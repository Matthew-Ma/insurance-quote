import { z } from 'zod';
import { apiRequest } from '../../../api/apiClient';

const questionSchema = z.union([
  z.string(),
  z.object({
    id: z.string().min(1),
    label: z.string().min(1),
    type: z.string().optional(),
    required: z.boolean().optional(),
    options: z.array(z.string()).optional(),
  }),
]);

const pageSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1),
  questions: z.array(questionSchema),
});

const applicationSchema = z.object({
  pages: z.array(pageSchema).min(1),
});

const quoteResponseSchema = z.discriminatedUnion('status', [
  z.object({
    status: z.literal('additionalQuestionsRequired'),
    pages: z.array(pageSchema).min(1),
  }),
  z.object({
    status: z.literal('quoted'),
    quote: z.object({
      product: z.string(),
      coverAmount: z.number(),
      premium: z.number(),
    }),
  }),
]);

export type Question = {
  id: string;
  label: string;
  type: string;
  required: boolean;
  options: string[];
};

export type ApplicationPage = {
  id: string;
  title: string;
  questions: Question[];
};

export type Quote = {
  product: string;
  coverAmount: number;
  premium: number;
};

export type QuoteAnswers = Record<string, string | number>;

export type QuoteResponse =
  | { status: 'additionalQuestionsRequired'; pages: ApplicationPage[] }
  | { status: 'quoted'; quote: Quote };

function humanize(value: string): string {
  return value
    .replace(/([a-z])([A-Z0-9])/g, '$1 $2')
    .replace(/([0-9])([A-Za-z])/g, '$1 $2')
    .replace(/^./, (character) => character.toUpperCase());
}

function normalizeQuestion(
  question: z.infer<typeof questionSchema>,
): Question {
  if (typeof question === 'string') {
    return {
      id: question,
      label: humanize(question),
      type: 'text',
      required: true,
      options: [],
    };
  }

  return {
    id: question.id,
    label: question.label,
    type: question.type ?? 'text',
    required: question.required ?? true,
    options: question.options ?? [],
  };
}

function normalizePages(pages: z.infer<typeof applicationSchema>['pages']) {
  return pages.map((page, index) => ({
    id: page.id ?? `page-${index + 1}`,
    title: page.title,
    questions: page.questions.map(normalizeQuestion),
  }));
}

export async function getApplication(): Promise<ApplicationPage[]> {
  const response: unknown = await apiRequest('/application');
  const result = applicationSchema.safeParse(response);
  if (!result.success) {
    throw new Error('The application form schema returned by the service is invalid.');
  }
  return normalizePages(result.data.pages);
}

export async function requestQuote(
  answers: QuoteAnswers,
): Promise<QuoteResponse> {
  const response: unknown = await apiRequest('/quote', {
    method: 'POST',
    body: JSON.stringify({ answers }),
  });
  const result = quoteResponseSchema.safeParse(response);
  if (!result.success) {
    throw new Error('The quote service returned an unexpected response.');
  }

  if (result.data.status === 'quoted') {
    return result.data;
  }

  return {
    status: 'additionalQuestionsRequired',
    pages: normalizePages(result.data.pages),
  };
}

export function serializeAnswers(
  answers: Record<string, string>,
  pages: ApplicationPage[],
): QuoteAnswers {
  const numericQuestionIds = new Set(
    pages.flatMap((page) =>
      page.questions
        .filter((question) => question.type === 'number')
        .map((question) => question.id),
    ),
  );

  return Object.fromEntries(
    Object.entries(answers).map(([questionId, answer]) => [
      questionId,
      numericQuestionIds.has(questionId) && answer !== ''
        ? Number(answer)
        : answer,
    ]),
  );
}
