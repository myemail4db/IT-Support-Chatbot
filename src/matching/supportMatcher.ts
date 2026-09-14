import supportData from '../../data/support/support-data.json';
import intentData from '../../data/semantics/intents.json';
import objectData from '../../data/semantics/objects.json';
import contextData from '../../data/semantics/contexts.json';
import stateData from '../../data/semantics/states.json';

import { SupportTopic, TopicMatchResult } from '../models/SupportTopic';
import { SemanticGroupCollection } from '../models/SemanticGroup';

const supportTopics: SupportTopic[] = supportData;
const intents: SemanticGroupCollection = intentData;
const objects: SemanticGroupCollection = objectData;
const contexts: SemanticGroupCollection = contextData;
const states: SemanticGroupCollection = stateData;

interface DetectedSemantics {
  intent?: string;
  object?: string;
  context?: string;
  state?: string;
}

function detectSemantics(userText: string): DetectedSemantics {
  return {
    intent: matchIntent(userText),
    object: matchObject(userText),
    context: matchContext(userText),
    state: matchState(userText),
  };
}

// This function returns the list of support topics.
export function getSupportTopics(): SupportTopic[] {
  return supportTopics;
}

// This function normalizes the text by converting it to lowercase and trimming whitespace.
export function normalizeText(text: string): string {
  return text.toLowerCase().trim();
}

// This function finds the highest-scoring support topic based on the user's input text.
export function findSupportTopic(userText: string): TopicMatchResult {
  const detected = detectSemantics(userText);

  let bestTopic: SupportTopic | undefined;
  let bestScore = 0;

  let secondBestTopic: SupportTopic | undefined;
  let secondBestScore = 0;

  for (const topic of supportTopics) {
    const keywordCount = countKeywordMatches(userText, topic);
    const phraseCount = countPhraseMatches(userText, topic);
    const score = calculateTopicScore(userText, topic);
    const semanticScore = calculateSemanticScore(detected, topic);
    const combinedScore = score + semanticScore;

    console.log(
      `"${topic.title}" matched ${keywordCount} keyword(s), ${phraseCount} phrase(s), keyword/phrase score: ${score}, semantic score: ${semanticScore}, combined score: ${combinedScore}`,
    );

    if (combinedScore > bestScore) {
      secondBestScore = bestScore;
      secondBestTopic = bestTopic;

      bestScore = combinedScore;
      bestTopic = topic;
    } else if (combinedScore > secondBestScore) {
      secondBestScore = combinedScore;
      secondBestTopic = topic;
    }
  }

  console.log(
    `Best: ${bestTopic?.title ?? 'NONE'} (${bestScore}), Second: ${secondBestTopic?.title ?? 'NONE'} (${secondBestScore})`,
  );

  if (!bestTopic || !secondBestTopic) {
    return bestTopic && bestScore >= 3
      ? { status: 'FOUND', topic: bestTopic }
      : { status: 'NOT_FOUND' };
  }

  const isAmbiguous = isAmbiguousMatch(bestTopic, secondBestTopic, detected);

  console.log(`Ambiguous: ${isAmbiguous}`);

  if (isAmbiguous) {
    return {
      status: 'AMBIGUOUS',
      context: detected.context,
      candidates: [bestTopic, secondBestTopic],
    };
  }

  if (bestScore >= 3) {
    return {
      status: 'FOUND',
      topic: bestTopic,
    };
  }

  return {
    status: 'NOT_FOUND',
  };
}
// This function counts the number of keyword matches between the user's input text and a support topic's keywords.
export function countKeywordMatches(
  userText: string,
  topic: SupportTopic,
): number {
  const normalizedText = normalizeText(userText);

  return topic.keywords.filter((keyword) =>
    containsKeyword(normalizedText, keyword),
  ).length;
}

// This function checks if a keyword is present in the user's input text.
function containsKeyword(text: string, keyword: string): boolean {
  const words = normalizeText(text).split(/\W+/);

  return words.includes(normalizeText(keyword));
}

// This function counts the number of phrase matches between the user's input text and a support topic's phrases.
export function countPhraseMatches(
  userText: string,
  topic: SupportTopic,
): number {
  const normalizedText = normalizeText(userText);

  return topic.phrases.filter((phrase) =>
    normalizedText.includes(normalizeText(phrase)),
  ).length;
}

// This function calculates a score for a support topic based on the number of keyword and phrase matches with the user's input text.
export function calculateTopicScore(
  userText: string,
  topic: SupportTopic,
): number {
  const keywordCount = countKeywordMatches(userText, topic);
  const phraseCount = countPhraseMatches(userText, topic);

  return keywordCount + phraseCount * 3;
}

// This function matches a user's input text against a collection of semantic groups and returns the name of the matched group, if any.
function matchSemanticGroup(
  userText: string,
  groups: SemanticGroupCollection,
): string | undefined {
  const words = normalizeText(userText).split(/\W+/);

  for (const [groupName, group] of Object.entries(groups)) {
    const matched = group.terms.some((term) =>
      words.includes(normalizeText(term)),
    );

    if (matched) {
      return groupName;
    }
  }

  return undefined;
}

export function matchIntent(userText: string): string | undefined {
  return matchSemanticGroup(userText, intents);
}

export function matchObject(userText: string): string | undefined {
  return matchSemanticGroup(userText, objects);
}

export function matchContext(userText: string): string | undefined {
  return matchSemanticGroup(userText, contexts);
}

export function matchState(userText: string): string | undefined {
  return matchSemanticGroup(userText, states);
}

function semanticValueMatches(
  detectedValue: string | undefined,
  topicValues: string[],
): boolean {
  if (!detectedValue) {
    return false;
  }

  return topicValues.includes(detectedValue);
}

export function calculateSemanticScore(
  detected: DetectedSemantics,
  topic: SupportTopic,
): number {
  let score = 0;

  if (semanticValueMatches(detected.intent, topic.semantics.intents)) {
    score += 3;
  }

  if (semanticValueMatches(detected.object, topic.semantics.objects)) {
    score += 4;
  }

  if (semanticValueMatches(detected.context, topic.semantics.contexts)) {
    score += 1;
  }

  if (semanticValueMatches(detected.state, topic.semantics.states)) {
    score += 3;
  }

  return score;
}

function arraysDiffer(firstValues: string[], secondValues: string[]): boolean {
  const first = [...firstValues].sort();
  const second = [...secondValues].sort();

  return JSON.stringify(first) !== JSON.stringify(second);
}

function isDistinguishingSemanticMissing(
  fieldDiffers: boolean,
  detectedValue: string | undefined,
): boolean {
  return fieldDiffers && detectedValue === undefined;
}

function isAmbiguousMatch(
  bestTopic: SupportTopic,
  secondBestTopic: SupportTopic,
  detected: DetectedSemantics,
): boolean {
  const intentDiffers = arraysDiffer(
    bestTopic.semantics.intents,
    secondBestTopic.semantics.intents,
  );

  const objectDiffers = arraysDiffer(
    bestTopic.semantics.objects,
    secondBestTopic.semantics.objects,
  );

  const contextDiffers = arraysDiffer(
    bestTopic.semantics.contexts,
    secondBestTopic.semantics.contexts,
  );

  const stateDiffers = arraysDiffer(
    bestTopic.semantics.states,
    secondBestTopic.semantics.states,
  );

  return (
    isDistinguishingSemanticMissing(intentDiffers, detected.intent) ||
    isDistinguishingSemanticMissing(objectDiffers, detected.object) ||
    isDistinguishingSemanticMissing(contextDiffers, detected.context) ||
    isDistinguishingSemanticMissing(stateDiffers, detected.state)
  );
}
