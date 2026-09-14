export interface SemanticGroup {
  description: string;
  terms: string[];
}

export type SemanticGroupCollection = Record<string, SemanticGroup>;
