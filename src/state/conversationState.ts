import type { UnresolvedConversation } from '../models/UnresolvedConversation';

export const missCounts = new Map<string, number>();

export const pendingSubmissions = new Map<string, UnresolvedConversation>();

export const answeredQuestions = new Map<string, string>();

export const awaitingHelpful = new Set<string>();

export const ambiguityCounts = new Map<string, number>();

export const unresolvedConversations = new Map<
  string,
  UnresolvedConversation
>();
