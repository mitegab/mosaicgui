import { apiPost } from '../api/http';
import type { AiQueryRequest, AiQueryResponse } from '../types/ai';

export async function generateAiQuery(request: AiQueryRequest, signal?: AbortSignal): Promise<AiQueryResponse> {
  return apiPost<AiQueryResponse, AiQueryRequest>('/api/ai/', request, signal);
}
