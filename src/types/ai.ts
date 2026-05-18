import type { QueryDsl } from './query';

export interface AiQueryRequest {
  prompt: string;
  currentDsl?: QueryDsl;
  mode: 'generate' | 'fix' | 'optimize' | 'sql-to-dsl' | 'suggest-indexes';
}

export interface AiQueryResponse {
  dsl?: QueryDsl;
  explanation: string;
  suggestedIndexes?: string[];
  warnings?: string[];
}
