const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  'https://noble-ignite-recruit-e6gzfgcxeme6hcb2.australiasoutheast-01.azurewebsites.net/';
const USE_DEVELOPMENT_PROXY =
  import.meta.env.DEV && !import.meta.env.VITE_API_BASE_URL;

export async function apiRequest<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  const url = USE_DEVELOPMENT_PROXY
    ? new URL(`/api${endpoint}`, window.location.origin)
    : new URL(endpoint, API_BASE_URL);

  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new Error('The API URL must use HTTP or HTTPS.');
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers: {
        Accept: 'application/json',
        ...(options?.body ? { 'Content-Type': 'application/json' } : {}),
        ...options?.headers,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown network error';
    throw new Error(`Unable to connect to the quote service: ${message}`, {
      cause: error,
    });
  }

  const responseText = await response.text();
  let data: unknown;
  try {
    data = responseText ? JSON.parse(responseText) : undefined;
  } catch {
    if (response.ok) {
      throw new Error('The quote service returned an invalid response.');
    }
    data = responseText;
  }

  if (!response.ok) {
    throw new Error(getErrorMessage(data, response.status));
  }

  return data as T;
}

function getErrorMessage(data: unknown, status: number): string {
  if (typeof data !== 'object' || data === null) {
    return `Request failed with status ${status}.`;
  }

  if ('message' in data && typeof data.message === 'string') {
    return data.message;
  }

  if ('error' in data && typeof data.error === 'object' && data.error !== null) {
    const apiError = data.error;
    const message =
      'message' in apiError && typeof apiError.message === 'string'
        ? apiError.message
        : `Request failed with status ${status}.`;
    const details =
      'details' in apiError && Array.isArray(apiError.details)
        ? apiError.details
            .flatMap((detail: unknown) =>
              typeof detail === 'object' &&
              detail !== null &&
              'message' in detail &&
              typeof detail.message === 'string'
                ? [detail.message]
                : [],
            )
            .join(' ')
        : '';

    return details ? `${message} ${details}` : message;
  }

  return `Request failed with status ${status}.`;
}
