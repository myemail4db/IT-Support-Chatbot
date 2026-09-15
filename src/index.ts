import { App } from '@microsoft/teams.apps';
import { appendFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

import {
  getSupportTopics,
  findSupportTopic,
  matchIntent,
  matchObject,
  matchContext,
  matchState,
} from './matching/supportMatcher';

const app = new App({
  dangerouslyAllowUnauthenticatedRequests: true,
});

type UnresolvedConversation = {
  user: string;
  originalQuestion: string;
  rephrasedQuestion?: string;
};

const supportTopics = getSupportTopics();

const missCounts = new Map<string, number>();
const ambiguityCounts = new Map<string, number>();
const unresolvedConversations = new Map<string, UnresolvedConversation>();
const pendingSubmissions = new Map<string, UnresolvedConversation>();
const answeredQuestions = new Map<string, string>();
const awaitingHelpful = new Set<string>();

console.log(`Loaded ${supportTopics.length} support topic(s).`);

for (const topic of supportTopics) {
  console.log(`- ${topic.title}`);
}

function getLocalIsoTimestamp(): string {
  const now = new Date();

  const offsetMinutes = -now.getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? '+' : '-';

  const absoluteOffset = Math.abs(offsetMinutes);
  const offsetHours = Math.floor(absoluteOffset / 60);
  const offsetMins = absoluteOffset % 60;

  const pad = (value: number, length = 2) =>
    String(value).padStart(length, '0');

  return (
    `${now.getFullYear()}-` +
    `${pad(now.getMonth() + 1)}-` +
    `${pad(now.getDate())}T` +
    `${pad(now.getHours())}:` +
    `${pad(now.getMinutes())}:` +
    `${pad(now.getSeconds())}.` +
    `${pad(now.getMilliseconds(), 3)}` +
    `${sign}${pad(offsetHours)}:${pad(offsetMins)}`
  );
}

async function saveUnresolvedProblem(
  conversationId: string,
  problem: UnresolvedConversation,
): Promise<void> {
  const unresolvedDirectory = path.join(process.cwd(), 'data', 'unresolved');

  const unresolvedFile = path.join(
    unresolvedDirectory,
    'unresolved-problems.jsonl',
  );

  await mkdir(unresolvedDirectory, { recursive: true });

  const record = {
    conversationId,
    user: problem.user,
    originalQuestion: problem.originalQuestion,
    rephrasedQuestion: problem.rephrasedQuestion ?? '',
    submittedAt: getLocalIsoTimestamp(),
  };

  await appendFile(unresolvedFile, `${JSON.stringify(record)}\n`, 'utf8');
}

app.on('message', async ({ send, activity }) => {
  await send({ type: 'typing' });

  const userText = activity.text ?? '';
  const conversationId = activity.conversation?.id ?? 'local';
  const user = 'user';
  const normalizedResponse = userText.toLowerCase().trim();

  // Handle unresolved-problem submission response.
  const pendingProblem = pendingSubmissions.get(conversationId);

  if (pendingProblem) {
    if (normalizedResponse === 'yes' || normalizedResponse === 'y') {
      await saveUnresolvedProblem(conversationId, pendingProblem);

      pendingSubmissions.delete(conversationId);
      unresolvedConversations.delete(conversationId);
      missCounts.delete(conversationId);
      ambiguityCounts.delete(conversationId);

      await send('Your problem has been submitted for IT review.');
      return;
    }

    if (normalizedResponse === 'no' || normalizedResponse === 'n') {
      pendingSubmissions.delete(conversationId);
      unresolvedConversations.delete(conversationId);
      missCounts.delete(conversationId);
      ambiguityCounts.delete(conversationId);

      await send('No problem. Your request was not submitted.');
      return;
    }

    await send('Please answer yes or no.');
    return;
  }

  // Handle "Was this helpful?"
  if (awaitingHelpful.has(conversationId)) {
    if (normalizedResponse === 'yes' || normalizedResponse === 'y') {
      awaitingHelpful.delete(conversationId);
      answeredQuestions.delete(conversationId);
      missCounts.delete(conversationId);
      ambiguityCounts.delete(conversationId);

      await send('Great. Let me know if you need help with anything else.');
      return;
    }

    if (normalizedResponse === 'no' || normalizedResponse === 'n') {
      awaitingHelpful.delete(conversationId);

      const answeredQuestion = answeredQuestions.get(conversationId);

      if (answeredQuestion) {
        unresolvedConversations.set(conversationId, {
          user,
          originalQuestion: answeredQuestion,
        });
      }

      answeredQuestions.delete(conversationId);

      // Treat the next unsuccessful rephrase as the second miss.
      missCounts.set(conversationId, 1);

      await send(
        "Please try describing the problem another way and I'll search again.",
      );
      return;
    }

    await send('Please answer yes or no.');
    return;
  }

  console.log(`Intent: ${matchIntent(userText) ?? 'NONE'}`);
  console.log(`Object: ${matchObject(userText) ?? 'NONE'}`);
  console.log(`Context: ${matchContext(userText) ?? 'NONE'}`);
  console.log(`State: ${matchState(userText) ?? 'NONE'}`);

  const result = findSupportTopic(userText);

  // Solution found.
  if (result.status === 'FOUND' && result.topic) {
    missCounts.delete(conversationId);
    ambiguityCounts.delete(conversationId);
    unresolvedConversations.delete(conversationId);

    await send(
      `**${result.topic.title}**\n\n${result.topic.solution.join('\n')}`,
    );

    answeredQuestions.set(conversationId, userText);
    awaitingHelpful.add(conversationId);

    await send('Was this helpful? Please answer yes or no.');
    return;
  }

  // More information is needed.
  if (result.status === 'AMBIGUOUS') {
    const currentAmbiguityCount = ambiguityCounts.get(conversationId) ?? 0;

    const newAmbiguityCount = currentAmbiguityCount + 1;

    ambiguityCounts.set(conversationId, newAmbiguityCount);

    if (newAmbiguityCount === 1) {
      if (!unresolvedConversations.has(conversationId)) {
        unresolvedConversations.set(conversationId, {
          user,
          originalQuestion: userText,
        });
      }

      const contextText = result.context
        ? ` ${result.context.charAt(0) + result.context.slice(1).toLowerCase()}`
        : '';

      await send(
        `I found more than one possible${contextText} solution. Could you provide a little more detail about what you're trying to do?`,
      );
      return;
    }

    const unresolved = unresolvedConversations.get(conversationId);

    if (unresolved) {
      unresolved.rephrasedQuestion = userText;

      pendingSubmissions.set(conversationId, unresolved);

      await send(
        "I still couldn't determine the correct solution. Would you like to submit this problem for IT review?",
      );
      return;
    }
  }

  // No solution found.
  const currentMissCount = missCounts.get(conversationId) ?? 0;
  const newMissCount = currentMissCount + 1;

  missCounts.set(conversationId, newMissCount);

  if (newMissCount === 1) {
    unresolvedConversations.set(conversationId, {
      user,
      originalQuestion: userText,
    });

    await send(
      "Sorry, I couldn't find a solution for that. Please try saying it another way.",
    );
    return;
  }

  const unresolved = unresolvedConversations.get(conversationId);

  if (unresolved) {
    unresolved.rephrasedQuestion = userText;

    pendingSubmissions.set(conversationId, unresolved);

    await send(
      "I still couldn't find a solution. Would you like to submit this problem for IT review?",
    );
    return;
  }

  missCounts.delete(conversationId);

  await send(
    "Sorry, I couldn't keep track of the original problem. Please describe the problem again.",
  );
});

app.start(process.env.PORT || 3978).catch(console.error);
