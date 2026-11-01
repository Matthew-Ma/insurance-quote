import { Input } from '../../../components/Input';
import type { ApplicationPage } from '../services/insuranceService';
import styles from './FormStyles.module.css';

interface DynamicFormRendererProps {
  page: ApplicationPage;
  answers: Record<string, string>;
  errors: Record<string, string>;
  onChange: (questionId: string, value: string) => void;
}

export function DynamicFormRenderer({
  page,
  answers,
  errors,
  onChange,
}: DynamicFormRendererProps) {
  return (
    <section className={styles.formContent} aria-labelledby="page-title">
      <div className={styles.pageHeading}>
        <span className={styles.headingIcon} aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="8" r="3.25" />
            <path d="M5.5 19v-1.25a6.5 6.5 0 0 1 13 0V19h-13Z" />
          </svg>
        </span>
        <h1 id="page-title">{page.title}</h1>
      </div>

      <div className={styles.fields}>
        {page.questions.map((question) => {
          const value = answers[question.id] ?? '';
          const error = errors[question.id];
          const describedBy = error ? `${question.id}-error` : undefined;

          if (question.type === 'radio') {
            return (
              <fieldset
                className={styles.choiceField}
                key={question.id}
                aria-describedby={describedBy}
              >
                <legend>{question.label}</legend>
                <div className={styles.radioOptions}>
                  {question.options.map((option) => (
                    <label className={styles.radioOption} key={option}>
                      <input
                        type="radio"
                        name={question.id}
                        value={option}
                        checked={value === option}
                        onChange={(event) => onChange(question.id, event.target.value)}
                        aria-invalid={Boolean(error)}
                        required={question.required}
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
                {error && (
                  <p className={styles.fieldError} id={`${question.id}-error`} role="alert">
                    {error}
                  </p>
                )}
              </fieldset>
            );
          }

          if (question.type === 'select') {
            return (
              <div className={styles.field} key={question.id}>
                <label htmlFor={question.id}>{question.label}</label>
                <select
                  id={question.id}
                  required={question.required}
                  value={value}
                  onChange={(event) => onChange(question.id, event.target.value)}
                  aria-invalid={Boolean(error)}
                  aria-describedby={describedBy}
                  className={error ? styles.invalidControl : ''}
                >
                  <option value="">Select an option</option>
                  {question.options.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                {error && (
                  <p className={styles.fieldError} id={`${question.id}-error`} role="alert">
                    {error}
                  </p>
                )}
              </div>
            );
          }

          return (
            <Input
              autoComplete={
                question.id === 'email'
                  ? 'email'
                  : question.id === 'phone'
                    ? 'tel'
                    : undefined
              }
              error={error}
              id={question.id}
              inputMode={question.type === 'number' ? 'numeric' : undefined}
              key={question.id}
              label={question.label}
              name={question.id}
              onChange={(event) => onChange(question.id, event.target.value)}
              placeholder={
                question.id === 'email'
                  ? 'name@example.com'
                  : question.id === 'phone'
                    ? '0400 000 000'
                    : undefined
              }
              required={question.required}
              min={question.type === 'number' ? 0 : undefined}
              step={question.type === 'number' ? 1 : undefined}
              type={question.type === 'email' ? 'email' : question.type === 'number' ? 'number' : 'text'}
              value={value}
            />
          );
        })}
      </div>
    </section>
  );
}
