import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getApplication,
  requestQuote,
} from '../services/insuranceService';
import type {
  ApplicationPage,
  Quote,
  QuoteResponse,
} from '../services/insuranceService';
import { useQuoteApi } from './useQuoteApi';

vi.mock('../services/insuranceService', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('../services/insuranceService')>();
  return {
    ...actual,
    getApplication: vi.fn(),
    requestQuote: vi.fn(),
  };
});

const pages: ApplicationPage[] = [
  {
    id: 'about-you',
    title: 'About You',
    questions: [
      {
        id: 'email',
        label: 'Email Address',
        type: 'email',
        required: true,
        options: [],
      },
      {
        id: 'cigarettesPerWeek',
        label: 'Cigarettes per week',
        type: 'number',
        required: true,
        options: [],
      },
    ],
  },
];

const quote: Quote = {
  product: 'Life Protect',
  coverAmount: 500000,
  premium: 64.85,
};

describe('useQuoteApi', () => {
  beforeEach(() => {
    vi.mocked(getApplication).mockReset();
    vi.mocked(requestQuote).mockReset();
  });

  it('loads the application on mount and clears the loading state', async () => {
    vi.mocked(getApplication).mockResolvedValue(pages);

    const { result } = renderHook(() => useQuoteApi());

    expect(result.current.isLoading).toBe(true);
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.applicationPages).toEqual(pages);
    expect(getApplication).toHaveBeenCalledOnce();
    expect(result.current.error).toBeUndefined();
  });

  it('exposes application loading errors and can retry the request', async () => {
    vi.mocked(getApplication)
      .mockRejectedValueOnce(new Error('Application unavailable.'))
      .mockResolvedValueOnce(pages);

    const { result } = renderHook(() => useQuoteApi());

    await waitFor(() => {
      expect(result.current.error).toBe('Application unavailable.');
    });
    expect(result.current.applicationPages).toBeUndefined();

    await act(async () => {
      await result.current.loadApplication();
    });

    expect(result.current.applicationPages).toEqual(pages);
    expect(result.current.error).toBeUndefined();
    expect(getApplication).toHaveBeenCalledTimes(2);
  });

  it('uses a fallback message for unexpected application loading failures', async () => {
    vi.mocked(getApplication).mockRejectedValue('unexpected failure');

    const { result } = renderHook(() => useQuoteApi());

    await waitFor(() => {
      expect(result.current.error).toBe(
        'Unable to load the application. Please try again.',
      );
    });
  });

  it('serializes numeric answers and stores a finalized quote', async () => {
    const quotedResponse: QuoteResponse = { status: 'quoted', quote };
    vi.mocked(getApplication).mockResolvedValue(pages);
    vi.mocked(requestQuote).mockResolvedValue(quotedResponse);

    const { result } = renderHook(() => useQuoteApi());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let response: QuoteResponse | undefined;
    await act(async () => {
      response = await result.current.submitAnswers(
        { email: 'alex@example.com', cigarettesPerWeek: '2' },
        pages,
      );
    });

    expect(requestQuote).toHaveBeenCalledWith({
      email: 'alex@example.com',
      cigarettesPerWeek: 2,
    });
    expect(response).toEqual(quotedResponse);
    expect(result.current.quote).toEqual(quote);
    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.error).toBeUndefined();
  });

  it('returns additional pages without marking the quote as finalized', async () => {
    const additionalResponse: QuoteResponse = {
      status: 'additionalQuestionsRequired',
      pages: [
        {
          ...pages[0]!,
          id: 'additional',
          title: 'Additional Questions',
        },
      ],
    };
    vi.mocked(getApplication).mockResolvedValue(pages);
    vi.mocked(requestQuote).mockResolvedValue(additionalResponse);

    const { result } = renderHook(() => useQuoteApi());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let response: QuoteResponse | undefined;
    await act(async () => {
      response = await result.current.submitAnswers(
        { email: 'alex@example.com' },
        pages,
      );
    });

    expect(response).toEqual(additionalResponse);
    expect(result.current.quote).toBeUndefined();
    expect(result.current.isSubmitting).toBe(false);
  });

  it('reports quote request errors and clears them explicitly', async () => {
    vi.mocked(getApplication).mockResolvedValue(pages);
    vi.mocked(requestQuote).mockRejectedValue(
      new Error('The request body is invalid.'),
    );

    const { result } = renderHook(() => useQuoteApi());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.submitAnswers(
        { cigarettesPerWeek: '-1' },
        pages,
      );
    });

    expect(result.current.error).toBe('The request body is invalid.');
    expect(result.current.isSubmitting).toBe(false);

    act(() => {
      result.current.clearError();
    });
    expect(result.current.error).toBeUndefined();
  });

  it('uses a fallback message for unexpected quote request failures', async () => {
    vi.mocked(getApplication).mockResolvedValue(pages);
    vi.mocked(requestQuote).mockRejectedValue('unexpected failure');

    const { result } = renderHook(() => useQuoteApi());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.submitAnswers({}, pages);
    });

    expect(result.current.error).toBe(
      'Unable to request a quote. Please try again.',
    );
    expect(result.current.isSubmitting).toBe(false);
  });
});
