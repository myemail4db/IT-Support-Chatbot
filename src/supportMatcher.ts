import supportData from '../data/support-data.json';
import { SupportTopic } from './models/SupportTopic';

const supportTopics: SupportTopic[] = supportData;

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

function containsKeyword(text: string, keyword: string): boolean {
  const words = normalizeText(text).split(/\W+/);

  return words.includes(normalizeText(keyword));
}

export function countPhraseMatches(
  userText: string,
  topic: SupportTopic,
): number {
  const normalizedText = normalizeText(userText);

  return topic.phrases.filter((phrase) =>
    normalizedText.includes(normalizeText(phrase)),
  ).length;
}

export function calculateTopicScore(
  userText: string,
  topic: SupportTopic,
): number {
  const keywordCount = countKeywordMatches(userText, topic);
  const phraseCount = countPhraseMatches(userText, topic);

  return keywordCount + phraseCount * 3;
}
