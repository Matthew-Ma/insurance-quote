import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { ApplicationPage } from '../services/insuranceService';
import { useInsuranceForm } from './useInsuranceForm';

const initialPages: ApplicationPage[] = [
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
        id: 'phone',
        label: 'Phone Number',
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
];

const additionalPage: ApplicationPage = {
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
  ],
};

describe('useInsuranceForm', () => {
  it('splits contact details into Your Details and starts at the first page', () => {
    const { result } = renderHook(() => useInsuranceForm(initialPages));

    expect(result.current.currentPage?.title).toBe('Your Details');
    expect(result.current.currentPage?.questions.map(({ id }) => id)).toEqual([
      'email',
      'phone',
    ]);
    expect(result.current.pageTitles).toEqual([
      'Your Details',
      'About You',
      'Lifestyle',
    ]);
    expect(result.current.pageCount).toBe(3);
    expect(result.current.initialPageCount).toBe(3);
    expect(result.current.activePageIndex).toBe(0);
    expect(result.current.isLastPage).toBe(false);
  });

  it('validates required fields and clears a field error when its answer changes', () => {
    const { result } = renderHook(() => useInsuranceForm(initialPages));

    act(() => {
      expect(result.current.validateCurrentPage()).toBe(false);
    });
    expect(result.current.errors).toEqual({
      email: 'This field is required.',
      phone: 'This field is required.',
    });

    act(() => {
      result.current.updateAnswer('email', 'alex@example.com');
    });
    expect(result.current.errors).toEqual({
      phone: 'This field is required.',
    });

    act(() => {
      result.current.updateAnswer('phone', '0400 000 000');
    });
    act(() => {
      expect(result.current.validateCurrentPage()).toBe(true);
    });
    expect(result.current.errors).toEqual({});
  });

  it('navigates between pages and clamps navigation to the first and last pages', () => {
    const { result } = renderHook(() => useInsuranceForm(initialPages));

    act(() => {
      result.current.moveBack();
    });
    expect(result.current.activePageIndex).toBe(0);

    act(() => {
      result.current.moveForward();
      result.current.moveForward();
    });
    expect(result.current.currentPage?.title).toBe('Lifestyle');
    expect(result.current.isLastPage).toBe(true);

    act(() => {
      result.current.moveForward();
    });
    expect(result.current.activePageIndex).toBe(2);

    act(() => {
      result.current.moveBack();
    });
    expect(result.current.currentPage?.title).toBe('About You');
    expect(result.current.isLastPage).toBe(false);
  });

  it('appends additional pages without changing the initial page count', () => {
    const { result } = renderHook(() => useInsuranceForm(initialPages));

    act(() => {
      result.current.appendAdditionalPages([additionalPage]);
    });

    expect(result.current.pageCount).toBe(4);
    expect(result.current.initialPageCount).toBe(3);
    expect(result.current.currentPage).toEqual({
      ...additionalPage,
      id: 'additional-smoking-details-3',
    });
    expect(result.current.isLastPage).toBe(true);
    expect(result.current.pageTitles).toEqual([
      'Your Details',
      'About You',
      'Lifestyle',
      'Smoking Details',
    ]);
  });

  it('keeps pages without contact questions and validates safely when no page exists', () => {
    const { result } = renderHook(() => useInsuranceForm([]));

    expect(result.current.pageCount).toBe(0);
    expect(result.current.currentPage).toBeUndefined();
    expect(result.current.isLastPage).toBe(false);

    act(() => {
      expect(result.current.validateCurrentPage()).toBe(false);
    });
  });

  it('does not re-add a field error when updating a field without one', () => {
    const { result } = renderHook(() => useInsuranceForm(initialPages));

    act(() => {
      result.current.updateAnswer('email', 'alex@example.com');
    });

    expect(result.current.answers.email).toBe('alex@example.com');
    expect(result.current.errors).toEqual({});
  });
});
