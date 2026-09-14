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

const supportTopics = getSupportTopics();

const missCounts = new Map<string, number>();
const pendingSubmissions = new Map<string, string>();
const awaitingHelpful = new Set<string>();

console.log(`Loaded ${supportTopics.length} support topic(s).`);

for (const topic of supportTopics) {
  console.log(`- ${topic.title}`);
}

async function saveUnresolvedProblem(
  conversationId: string,
  problem: string,
): Promise<void> {
  const unresolvedDirectory = path.join(process.cwd(), 'data', 'unresolved');

  const unresolvedFile = path.join(
    unresolvedDirectory,
    'unresolved-problems.jsonl',
  );

  await mkdir(unresolvedDirectory, { recursive: true });

  const record = {
    conversationId,
    problem,
    submittedAt: new Date().toISOString(),
  };

  await appendFile(unresolvedFile, `${JSON.stringify(record)}\n`, 'utf8');
}

app.on('message', async ({ send, activity }) => {
  await send({ type: 'typing' });

  const userText = activity.text ?? '';
  const conversationId = activity.conversation?.id ?? 'local';
  const normalizedResponse = userText.toLowerCase().trim();

  // Handle unresolved-problem submission response.
  const pendingProblem = pendingSubmissions.get(conversationId);

  if (pendingProblem) {
    if (normalizedResponse === 'yes' || normalizedResponse === 'y') {
      await saveUnresolvedProblem(conversationId, pendingProblem);

      pendingSubmissions.delete(conversationId);
      missCounts.delete(conversationId);

      await send('Your problem has been submitted for IT review.');
      return;
    }

    if (normalizedResponse === 'no' || normalizedResponse === 'n') {
      pendingSubmissions.delete(conversationId);
      missCounts.delete(conversationId);

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
      missCounts.delete(conversationId);

      await send('Great. Let me know if you need help with anything else.');
      return;
    }

    if (normalizedResponse === 'no' || normalizedResponse === 'n') {
      awaitingHelpful.delete(conversationId);

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

    await send(
      `**${result.topic.title}**\n\n${result.topic.solution.join('\n')}`,
    );

    awaitingHelpful.add(conversationId);

    await send('Was this helpful? Please answer yes or no.');
    return;
  }

  // More information is needed.
  if (result.status === 'AMBIGUOUS') {
    const contextText = result.context
      ? ` ${result.context.charAt(0) + result.context.slice(1).toLowerCase()}`
      : '';

    await send(
      `I found more than one possible${contextText} solution. Could you provide a little more detail about what you're trying to do?`,
    );
    return;
  }

  // No solution found.
  const currentMissCount = missCounts.get(conversationId) ?? 0;
  const newMissCount = currentMissCount + 1;

  missCounts.set(conversationId, newMissCount);

  if (newMissCount === 1) {
    await send(
      "Sorry, I couldn't find a solution for that. Please try saying it another way.",
    );
    return;
  }

  pendingSubmissions.set(conversationId, userText);

  await send(
    "I still couldn't find a solution. Would you like to submit this problem for IT review?",
  );
});

app.start(process.env.PORT || 3978).catch(console.error);
