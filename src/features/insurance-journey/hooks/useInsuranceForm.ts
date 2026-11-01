import { useMemo, useState } from 'react';
import type { ApplicationPage, Question } from '../services/insuranceService';
import { validatePage } from '../utils/validation';

const CONTACT_QUESTIONS = new Set(['email', 'phone']);

function splitInitialPages(pages: ApplicationPage[]): ApplicationPage[] {
  const contactQuestions: Question[] = [];
  const applicationPages: ApplicationPage[] = [];

  pages.forEach((page) => {
    const questions = page.questions.filter((question) => {
      if (CONTACT_QUESTIONS.has(question.id)) {
        contactQuestions.push(question);
        return false;
      }
      return true;
    });

    if (questions.length > 0) {
      applicationPages.push({ ...page, questions });
    }
  });

  const steps: ApplicationPage[] = [];
  if (contactQuestions.length > 0) {
    steps.push({
      id: 'your-details',
      title: 'Your Details',
      questions: contactQuestions,
    });
  }
  return [...steps, ...applicationPages];
}

export function useInsuranceForm(initialPages: ApplicationPage[]) {
  const [pages, setPages] = useState<ApplicationPage[]>(() =>
    splitInitialPages(initialPages),
  );
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [activePageIndex, setActivePageIndex] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const currentPage = pages[activePageIndex];
  const pageCount = pages.length;
  const isLastPage = activePageIndex === pageCount - 1;
  const pageTitles = useMemo(() => pages.map((page) => page.title), [pages]);

  const initialPageCount = useMemo(
    () => pages.filter((page) => !page.id.startsWith('additional-')).length,
    [pages],
  );

  function updateAnswer(questionId: string, value: string) {
    setAnswers((current) => ({ ...current, [questionId]: value }));
    setErrors((current) => {
      if (!(questionId in current)) {
        return current;
      }
      const next = { ...current };
      delete next[questionId];
      return next;
    });
  }

  function validateCurrentPage(): boolean {
    if (!currentPage) {
      return false;
    }
    const pageErrors = validatePage(currentPage, answers);
    setErrors(pageErrors);
    return Object.keys(pageErrors).length === 0;
  }

  function moveForward(): void {
    setActivePageIndex((index) => Math.min(index + 1, pages.length - 1));
    setErrors({});
  }

  function moveBack(): void {
    setActivePageIndex((index) => Math.max(index - 1, 0));
    setErrors({});
  }

  function appendAdditionalPages(newPages: ApplicationPage[]): void {
    const additionalPages = newPages.map((page, index) => ({
      ...page,
      id: `additional-${page.id}-${pages.length + index}`,
    }));
    setPages((current) => [...current, ...additionalPages]);
    setActivePageIndex(pages.length);
    setErrors({});
  }

  return {
    activePageIndex,
    answers,
    appendAdditionalPages,
    currentPage,
    errors,
    pages,
    initialPageCount,
    isLastPage,
    moveBack,
    moveForward,
    pageCount,
    pageTitles,
    updateAnswer,
    validateCurrentPage,
  };
}
