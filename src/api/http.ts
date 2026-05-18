export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly payload?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiGet<T>(path: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(path, { signal, headers: { Accept: 'application/json' } });
  if (!response.ok) {
    throw new ApiError(`GET ${path} failed`, response.status, await safeJson(response));
  }
  return response.json() as Promise<T>;
}

export async function apiPost<TResponse, TBody>(path: string, body: TBody, signal?: AbortSignal): Promise<TResponse> {
  const response = await fetch(path, {
    method: 'POST',
    signal,
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new ApiError(`POST ${path} failed`, response.status, await safeJson(response));
  }

  return response.json() as Promise<TResponse>;
}

async function safeJson(response: Response) {
  try {
    return await response.json();
  } catch {
    return undefined;
  }
}
