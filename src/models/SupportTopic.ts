export interface TopicSemantics {
  intents: string[];
  objects: string[];
  contexts: string[];
  states: string[];
}

export interface SupportTopic {
  id: string;
  category: string;
  subcategory: string;
  title: string;
  semantics: TopicSemantics;
  keywords: string[];
  phrases: string[];
  solution: string[];
}

export interface TopicMatchResult {
  status: 'FOUND' | 'AMBIGUOUS' | 'NOT_FOUND';
  topic?: SupportTopic;
  context?: string;
  candidates?: SupportTopic[];
}
