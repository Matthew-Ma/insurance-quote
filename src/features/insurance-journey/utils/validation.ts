import { z } from 'zod';
import type { ApplicationPage, Question } from '../services/insuranceService';

const emailSchema = z
  .string()
  .trim()
  .email('Enter a valid email address.')
  .max(254, 'Email address is too long.');

const phoneSchema = z
  .string()
  .trim()
  .regex(/^04\d{2}\s?\d{3}\s?\d{3}$/, 'Enter an Australian mobile number, e.g. 0400 000 000.');

export function validatePage(
  page: ApplicationPage,
  answers: Record<string, string>,
): Record<string, string> {
  return page.questions.reduce<Record<string, string>>((errors, question) => {
    const value = answers[question.id] ?? '';
    const error = validateQuestion(question, value);
    if (error) {
      errors[question.id] = error;
    }
    return errors;
  }, {});
}

function validateQuestion(question: Question, value: string): string | undefined {
  if (!value.trim() && question.required) {
    return 'This field is required.';
  }
  if (!value.trim()) {
    return undefined;
  }

  if (question.id === 'email') {
    const result = emailSchema.safeParse(value);
    return result.success ? undefined : result.error.issues[0]?.message;
  }
  if (question.id === 'phone') {
    const result = phoneSchema.safeParse(value);
    return result.success ? undefined : result.error.issues[0]?.message;
  }
  if (question.type === 'number') {
    const number = Number(value);
    if (!Number.isFinite(number)) {
      return 'Enter a valid number.';
    }
    if (!Number.isInteger(number) || number < 0) {
      return 'Enter a non-negative whole number.';
    }
  }
  if (question.options.length > 0 && !question.options.includes(value)) {
    return 'Choose one of the available options.';
  }
  return undefined;
}
