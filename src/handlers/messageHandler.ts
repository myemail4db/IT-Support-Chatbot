import type { App } from '@microsoft/teams.apps';

import {
  findSupportTopic,
  matchIntent,
  matchObject,
  matchContext,
  matchState,
} from '../matching/supportMatcher';

import { saveUnresolvedProblem } from '../services/unresolvedProblemService';

import {
  missCounts,
  pendingSubmissions,
  answeredQuestions,
  awaitingHelpful,
  ambiguityCounts,
  unresolvedConversations,
} from '../state/conversationState';

export function registerMessageHandler(app: App): void {
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
}
