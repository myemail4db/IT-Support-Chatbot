import supportData from '../../data/support/support-data.json';
import intentData from '../../data/semantics/intents.json';
import objectData from '../../data/semantics/objects.json';
import contextData from '../../data/semantics/contexts.json';
import stateData from '../../data/semantics/states.json';

import { SupportTopic } from '../models/SupportTopic';
import {
  SemanticGroupCollection,
} from '../models/SemanticGroup';

const supportTopics: SupportTopic[] = supportData;
const intents: SemanticGroupCollection = intentData;
const objects: SemanticGroupCollection = objectData;
const contexts: SemanticGroupCollection = contextData;
const states: SemanticGroupCollection = stateData;

// This function returns the list of support topics.
export function getSupportTopics(): SupportTopic[] {
  return supportTopics;
}

// This function normalizes the text by converting it to lowercase and trimming whitespace.
export function normalizeText(text: string): string {
  return text.toLowerCase().trim();
}

// This function finds a support topic based on the user's input text.
export function findSupportTopic(userText: string): SupportTopic | undefined {
  return supportTopics.find((topic) => {
    const keywordCount = countKeywordMatches(userText, topic);
    const phraseCount = countPhraseMatches(userText, topic);
    const score = calculateTopicScore(userText, topic);

    console.log(
      `"${topic.title}" matched ${keywordCount} keyword(s), ${phraseCount} phrase(s), score: ${score}`,
    );

    return score >= 3;
  });
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