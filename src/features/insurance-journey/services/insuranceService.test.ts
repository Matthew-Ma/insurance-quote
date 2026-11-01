import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiRequest } from '../../../api/apiClient';
import {
  getApplication,
  requestQuote,
  serializeAnswers,
} from './insuranceService';

vi.mock('../../../api/apiClient', () => ({
  apiRequest: vi.fn(),
}));

describe('insuranceService', () => {
  beforeEach(() => {
    vi.mocked(apiRequest).mockReset();
  });

  it('loads and normalizes application page and question schemas', async () => {
    vi.mocked(apiRequest).mockResolvedValue({
      pages: [
        {
          title: 'About You',
          questions: [
            'smokedLast12Months',
            {
              id: 'occupation',
              label: 'Occupation',
              type: 'select',
              options: ['Teacher', 'Builder'],
            },
          ],
        },
      ],
    });

    await expect(getApplication()).resolves.toEqual([
      {
        id: 'page-1',
        title: 'About You',
        questions: [
          {
            id: 'smokedLast12Months',
            label: 'Smoked Last 12 Months',
            type: 'text',
            required: true,
            options: [],
          },
          {
            id: 'occupation',
            label: 'Occupation',
            type: 'select',
            required: true,
            options: ['Teacher', 'Builder'],
          },
        ],
      },
    ]);
    expect(apiRequest).toHaveBeenCalledWith('/application');
  });

  it('rejects invalid application schemas', async () => {
    vi.mocked(apiRequest).mockResolvedValue({ pages: [] });

    await expect(getApplication()).rejects.toThrow(
      'The application form schema returned by the service is invalid.',
    );
  });

  it('posts the answers object and returns a finalized quote', async () => {
    const response = {
      status: 'quoted',
      quote: {
        product: 'Life Protect',
        coverAmount: 500000,
        premium: 64.85,
      },
    };
    vi.mocked(apiRequest).mockResolvedValue(response);

    await expect(
      requestQuote({
        email: 'alex@example.com',
        cigarettesPerWeek: 2,
      }),
    ).resolves.toEqual(response);

    expect(apiRequest).toHaveBeenCalledWith('/quote', {
      method: 'POST',
      body: JSON.stringify({
        answers: {
          email: 'alex@example.com',
          cigarettesPerWeek: 2,
        },
      }),
    });
  });

  it('normalizes additional questions returned by the quote API', async () => {
    vi.mocked(apiRequest).mockResolvedValue({
      status: 'additionalQuestionsRequired',
      pages: [
        {
          id: 'smoking-details',
          title: 'Smoking Details',
          questions: [
            {
              id: 'cigarettesPerWeek',
              label: 'How many cigarettes do you smoke each week?',
              type: 'number',
            },
          ],
        },
      ],
    });

    await expect(requestQuote({ smokedLast12Months: 'Yes' })).resolves.toEqual({
      status: 'additionalQuestionsRequired',
      pages: [
        {
          id: 'smoking-details',
          title: 'Smoking Details',
          questions: [
            {
              id: 'cigarettesPerWeek',
              label: 'How many cigarettes do you smoke each week?',
              type: 'number',
              required: true,
              options: [],
            },
          ],
        },
      ],
    });
  });

  it('rejects unexpected quote API responses', async () => {
    vi.mocked(apiRequest).mockResolvedValue({
      status: 'quoted',
      quote: { product: 'Life Protect', coverAmount: '500000', premium: 64.85 },
    });

    await expect(requestQuote({})).rejects.toThrow(
      'The quote service returned an unexpected response.',
    );
  });

  it('converts only schema-declared numeric answers to numbers', () => {
    expect(
      serializeAnswers(
        {
          email: 'alex@example.com',
          cigarettesPerWeek: '2',
          optionalNumericAnswer: '',
        },
        [
          {
            id: 'smoking-details',
            title: 'Smoking Details',
            questions: [
              {
                id: 'cigarettesPerWeek',
                label: 'Cigarettes per week',
                type: 'number',
                required: true,
                options: [],
              },
              {
                id: 'optionalNumericAnswer',
                label: 'Other number',
                type: 'number',
                required: false,
                options: [],
              },
            ],
          },
        ],
      ),
    ).toEqual({
      email: 'alex@example.com',
      cigarettesPerWeek: 2,
      optionalNumericAnswer: '',
    });
  });
});
