import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../../App';

const initialApplication = {
  pages: [
    {
      id: 'about-you',
      title: 'About You',
      questions: [
        {
          id: 'email',
          label: 'Email Address',
          type: 'email',
          required: true,
        },
        {
          id: 'phone',
          label: 'Phone Number',
          type: 'text',
          required: true,
        },
        {
          id: 'occupation',
          label: 'Occupation',
          type: 'select',
          required: true,
          options: ['Accountant', 'Teacher', 'Builder', 'Pilot', 'Other'],
        },
      ],
    },
    {
      id: 'lifestyle',
      title: 'Lifestyle',
      questions: [
        {
          id: 'smokedLast12Months',
          label: 'Have you smoked in the last 12 months?',
          type: 'radio',
          required: true,
          options: ['Yes', 'No'],
        },
      ],
    },
  ],
};

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    headers: { 'Content-Type': 'application/json' },
    status: 200,
  });
}

describe('insurance journey', () => {
  beforeEach(() => {
    vi.mocked(globalThis.fetch).mockReset();
  });

  it('validates each page and submits dynamically returned questions until quoted', async () => {
    const user = userEvent.setup();
    let quoteRequests = 0;
    const submissionBodies: string[] = [];
    vi.mocked(globalThis.fetch).mockImplementation(async (input, init) => {
      const url = String(input);
      if (url.endsWith('/application')) {
        return jsonResponse(initialApplication);
      }

      quoteRequests += 1;
      const requestBody = init?.body;
      if (typeof requestBody === 'string') {
        submissionBodies.push(requestBody);
      }
      if (quoteRequests === 1) {
        return jsonResponse({
          status: 'additionalQuestionsRequired',
          pages: [
            {
              id: 'smoking-details',
              title: 'Smoking Details',
              questions: [
                {
                  id: 'cigarettesPerWeek',
                  label: 'Cigarettes per week',
                  type: 'number',
                  required: true,
                },
              ],
            },
          ],
        });
      }

      return jsonResponse({
        status: 'quoted',
        quote: {
          product: 'Life Protect',
          coverAmount: 500000,
          premium: 64.85,
        },
      });
    });

    render(<App />);

    const email = await screen.findByLabelText('Email Address');
    await user.click(screen.getByRole('button', { name: /next/i }));
    expect(await screen.findAllByText('This field is required.')).toHaveLength(2);

    await user.type(email, 'alex@example.com');
    await user.type(screen.getByLabelText('Phone Number'), '0400 000 000');
    await user.click(screen.getByRole('button', { name: /next/i }));

    await user.selectOptions(screen.getByLabelText('Occupation'), 'Teacher');
    await user.click(screen.getByRole('button', { name: /next/i }));
    await user.click(screen.getByRole('button', { name: /back/i }));
    expect(screen.getByRole('heading', { name: 'About You' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /next/i }));
    await user.click(screen.getByLabelText('Yes'));
    await user.click(screen.getByRole('button', { name: /get my quote/i }));

    await user.type(await screen.findByLabelText('Cigarettes per week'), '5');
    await user.click(screen.getByRole('button', { name: /get my quote/i }));

    expect(await screen.findByRole('heading', { name: 'Your quote is ready' }))
      .toBeInTheDocument();
    expect(screen.getByText('Life Protect')).toBeInTheDocument();
    expect(screen.getByText('$64.85')).toBeInTheDocument();
    expect(quoteRequests).toBe(2);
    expect(JSON.parse(submissionBodies[1] ?? '{}')).toEqual({
      answers: {
        email: 'alex@example.com',
        phone: '0400 000 000',
        occupation: 'Teacher',
        smokedLast12Months: 'Yes',
        cigarettesPerWeek: 5,
      },
    });
    await user.click(screen.getByRole('button', { name: 'Start a new quote' }));
    expect(await screen.findByLabelText('Email Address')).toBeInTheDocument();
    expect(
      vi.mocked(globalThis.fetch).mock.calls.filter(([input]) =>
        String(input).endsWith('/application'),
      ),
    ).toHaveLength(2);
  });

  it('shows a loading error and retries fetching the application', async () => {
    const user = userEvent.setup();
    vi.mocked(globalThis.fetch)
      .mockRejectedValueOnce(new Error('Network unavailable.'))
      .mockResolvedValueOnce(jsonResponse(initialApplication));

    render(<App />);

    expect(
      await screen.findByRole('heading', {
        name: 'We couldn’t load your application',
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Network unavailable/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByLabelText('Email Address')).toBeInTheDocument();
  });

  it('reports quote API errors and keeps the applicant on the current page', async () => {
    const user = userEvent.setup();
    let quoteRequests = 0;
    vi.mocked(globalThis.fetch).mockImplementation(async (input) => {
      if (String(input).endsWith('/application')) {
        return jsonResponse(initialApplication);
      }
      quoteRequests += 1;
      return new Response(JSON.stringify({
        status: 'error',
        error: {
          code: 'INVALID_REQUEST',
          message: 'The request body is invalid.',
          details: [
            {
              field: 'answers.cigarettesPerWeek',
              message: 'Cigarettes per week must be a non-negative whole number.',
            },
          ],
        },
      }), {
        headers: { 'Content-Type': 'application/json' },
        status: 503,
      });
    });

    render(<App />);

    await user.type(await screen.findByLabelText('Email Address'), 'alex@example.com');
    await user.type(screen.getByLabelText('Phone Number'), '0400 000 000');
    await user.click(screen.getByRole('button', { name: /next/i }));
    await user.selectOptions(screen.getByLabelText('Occupation'), 'Teacher');
    await user.click(screen.getByRole('button', { name: /next/i }));
    await user.click(screen.getByLabelText('No'));
    await user.click(screen.getByRole('button', { name: /get my quote/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'The request body is invalid. Cigarettes per week must be a non-negative whole number.',
    );
    expect(screen.getByRole('heading', { name: 'Lifestyle' })).toBeInTheDocument();
    expect(quoteRequests).toBe(1);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /get my quote/i })).toBeEnabled();
    });
  });
});
