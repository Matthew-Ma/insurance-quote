import { describe, expect, it } from 'vitest';
import type { ApplicationPage } from '../services/insuranceService';
import { validatePage } from './validation';

const contactPage: ApplicationPage = {
  id: 'your-details',
  title: 'Your Details',
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
  ],
};
const numericPage: ApplicationPage = {
  id: 'additional-smoking',
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

describe('validatePage', () => {
  it('accepts a realistic email and Australian mobile number', () => {
    expect(
      validatePage(contactPage, {
        email: 'alex@example.com',
        phone: '0400 000 000',
      }),
    ).toEqual({});
  });

  it('rejects invalid email addresses and Australian mobile numbers', () => {
    expect(
      validatePage(contactPage, {
        email: 'not-an-email',
        phone: '12345',
      }),
    ).toMatchObject({
      email: 'Enter a valid email address.',
      phone: 'Enter an Australian mobile number, e.g. 0400 000 000.',
    });

  });

  it('only accepts non-negative whole numbers for numeric questions', () => {
    expect(validatePage(numericPage, { cigarettesPerWeek: '0' })).toEqual({});
    expect(
      validatePage(numericPage, { cigarettesPerWeek: '-1' }).cigarettesPerWeek,
    ).toBe('Enter a non-negative whole number.');
    expect(
      validatePage(numericPage, { cigarettesPerWeek: '1.5' }).cigarettesPerWeek,
    ).toBe('Enter a non-negative whole number.');
  });

  it('allows an empty optional field and rejects values outside declared options', () => {
    const optionalPage: ApplicationPage = {
      id: 'preferences',
      title: 'Preferences',
      questions: [
        {
          id: 'nickname',
          label: 'Nickname',
          type: 'text',
          required: false,
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
    };

    expect(
      validatePage(optionalPage, {
        nickname: '',
        occupation: 'Astronaut',
      }),
    ).toEqual({ occupation: 'Choose one of the available options.' });
  });

  it('rejects non-numeric input for numeric questions', () => {
    expect(
      validatePage(numericPage, { cigarettesPerWeek: 'many' }),
    ).toEqual({ cigarettesPerWeek: 'Enter a valid number.' });
  });
});
