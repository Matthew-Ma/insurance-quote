import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { apiRequest } from './apiClient';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    headers: { 'Content-Type': 'application/json' },
    status,
  });
}

describe('apiRequest', () => {
  beforeEach(() => {
    vi.mocked(globalThis.fetch).mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sends JSON requests with the expected headers and parses the response', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValue(
      jsonResponse({ accepted: true }),
    );

    await expect(
      apiRequest<{ accepted: boolean }>('/quote', {
        method: 'POST',
        body: JSON.stringify({ answers: { cigarettesPerWeek: 2 } }),
      }),
    ).resolves.toEqual({ accepted: true });

    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.objectContaining({ pathname: '/api/quote' }),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ answers: { cigarettesPerWeek: 2 } }),
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      }),
    );
  });

  it('omits the content type header for requests without a body', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValue(jsonResponse({ pages: [] }));

    await apiRequest('/application');

    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.any(URL),
      expect.objectContaining({
        headers: { Accept: 'application/json' },
      }),
    );
  });

  it('surfaces nested API validation details for failed requests', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValue(
      jsonResponse(
        {
          status: 'error',
          error: {
            code: 'INVALID_REQUEST',
            message: 'The request body is invalid.',
            details: [
              {
                field: 'answers.cigarettesPerWeek',
                message:
                  'Cigarettes per week must be a non-negative whole number.',
              },
            ],
          },
        },
        400,
      ),
    );

    await expect(apiRequest('/quote')).rejects.toThrow(
      'The request body is invalid. Cigarettes per week must be a non-negative whole number.',
    );
  });

  it('reports network errors with a clear message', async () => {
    vi.mocked(globalThis.fetch).mockRejectedValue(new Error('offline'));

    await expect(apiRequest('/application')).rejects.toThrow(
      'Unable to connect to the quote service: offline',
    );
  });

  it('handles network failures that are not Error instances', async () => {
    vi.mocked(globalThis.fetch).mockRejectedValue('offline');

    await expect(apiRequest('/application')).rejects.toThrow(
      'Unable to connect to the quote service: Unknown network error',
    );
  });

  it('rejects malformed JSON from successful API responses', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValue(
      new Response('not json', {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }),
    );

    await expect(apiRequest('/application')).rejects.toThrow(
      'The quote service returned an invalid response.',
    );
  });

  it('uses the HTTP status when an error response is not JSON', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValue(
      new Response('bad gateway', { status: 502 }),
    );

    await expect(apiRequest('/application')).rejects.toThrow(
      'Request failed with status 502.',
    );
  });

  it('uses a top-level API message when one is returned', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValue(
      jsonResponse({ message: 'Please retry later.' }, 503),
    );

    await expect(apiRequest('/application')).rejects.toThrow(
      'Please retry later.',
    );
  });

  it('falls back to the HTTP status for incomplete error objects', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValue(
      jsonResponse({ error: { code: 'INVALID_REQUEST' } }, 400),
    );

    await expect(apiRequest('/quote')).rejects.toThrow(
      'Request failed with status 400.',
    );
  });
});
