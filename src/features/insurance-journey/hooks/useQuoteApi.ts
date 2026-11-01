import { useCallback, useEffect, useState } from 'react';
import {
  getApplication,
  requestQuote,
  serializeAnswers,
} from '../services/insuranceService';
import type {
  ApplicationPage,
  Quote,
  QuoteResponse,
} from '../services/insuranceService';

export function useQuoteApi() {
  const [applicationPages, setApplicationPages] = useState<ApplicationPage[]>();
  const [quote, setQuote] = useState<Quote>();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>();

  const loadApplication = useCallback(async () => {
    setIsLoading(true);
    setError(undefined);
    try {
      const pages = await getApplication();
      setApplicationPages(pages);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Unable to load the application. Please try again.',
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadApplication();
  }, [loadApplication]);

  const submitAnswers = useCallback(
    async (
      answers: Record<string, string>,
      pages: ApplicationPage[],
    ): Promise<QuoteResponse | undefined> => {
      setIsSubmitting(true);
      setError(undefined);
      try {
        const result = await requestQuote(serializeAnswers(answers, pages));
        if (result.status === 'quoted') {
          setQuote(result.quote);
        }
        return result;
      } catch (submitError) {
        setError(
          submitError instanceof Error
            ? submitError.message
            : 'Unable to request a quote. Please try again.',
        );
        return undefined;
      } finally {
        setIsSubmitting(false);
      }
    },
    [],
  );

  const clearError = useCallback(() => setError(undefined), []);

  return {
    applicationPages,
    clearError,
    error,
    isLoading,
    isSubmitting,
    loadApplication,
    quote,
    submitAnswers,
  };
}
