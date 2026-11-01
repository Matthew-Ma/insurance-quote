import { Button } from '../../components/Button';
import { Layout } from '../../components/Layout';
import { DynamicFormRenderer } from './components/DynamicFormRenderer';
import { StepStepper } from './components/StepStepper';
import { useInsuranceForm } from './hooks/useInsuranceForm';
import { useQuoteApi } from './hooks/useQuoteApi';
import type { ApplicationPage } from './services/insuranceService';
import styles from './components/FormStyles.module.css';

interface InsuranceJourneyContainerProps {
  onRestart: () => void;
}

interface FormFlowProps extends InsuranceJourneyContainerProps {
  applicationPages: ApplicationPage[];
  api: ReturnType<typeof useQuoteApi>;
}

const currency = new Intl.NumberFormat('en-AU', {
  style: 'currency',
  currency: 'AUD',
});

export function InsuranceJourneyContainer({
  onRestart,
}: InsuranceJourneyContainerProps) {
  const api = useQuoteApi();

  if (api.isLoading) {
    return (
      <Layout>
        <div className={styles.journey}>
          <div className={styles.loading} role="status">
            Loading your application…
          </div>
        </div>
      </Layout>
    );
  }

  if (!api.applicationPages) {
    return (
      <Layout>
        <div className={styles.journey}>
          <section className={styles.loading} aria-labelledby="load-error-title">
            <div>
              <h1 id="load-error-title">We couldn’t load your application</h1>
              <p>{api.error}</p>
              <Button onClick={() => void api.loadApplication()}>
                Try again
              </Button>
            </div>
          </section>
        </div>
      </Layout>
    );
  }

  return (
    <FormFlow
      api={api}
      applicationPages={api.applicationPages}
      onRestart={onRestart}
    />
  );
}

function FormFlow({ applicationPages, api, onRestart }: FormFlowProps) {
  const form = useInsuranceForm(applicationPages);

  async function handleNext() {
    api.clearError();
    if (!form.validateCurrentPage()) {
      return;
    }

    if (!form.isLastPage) {
      form.moveForward();
      return;
    }

    const result = await api.submitAnswers(form.answers, form.pages);
    if (result?.status === 'additionalQuestionsRequired') {
      form.appendAdditionalPages(result.pages);
    }
  }

  function handleBack() {
    api.clearError();
    form.moveBack();
  }

  const isQuoted = Boolean(api.quote);

  return (
    <Layout>
      <div className={styles.journey}>
        <StepStepper
          activeIndex={form.activePageIndex}
          initialPageCount={form.initialPageCount}
          isQuoted={isQuoted}
          pageTitles={form.pageTitles}
        />
        <div className={styles.panel}>
          {isQuoted ? (
            <section className={styles.quoteContent} aria-labelledby="quote-title">
              <div className={styles.quoteCard}>
                <h1 id="quote-title">Your quote is ready</h1>
                <p className={styles.quoteIntro}>
                  Here are the details of your {api.quote?.product} cover.
                </p>
                <dl className={styles.quoteDetails}>
                  <div>
                    <dt>Product</dt>
                    <dd>{api.quote?.product}</dd>
                  </div>
                  <div>
                    <dt>Cover amount</dt>
                    <dd>{currency.format(api.quote?.coverAmount ?? 0)}</dd>
                  </div>
                  <div>
                    <dt>Monthly premium</dt>
                    <dd>{currency.format(api.quote?.premium ?? 0)}</dd>
                  </div>
                </dl>
                <Button className={styles.restart} onClick={onRestart}>
                  Start a new quote
                </Button>
              </div>
            </section>
          ) : (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void handleNext();
              }}
              noValidate
            >
              {form.currentPage && (
                <DynamicFormRenderer
                  answers={form.answers}
                  errors={form.errors}
                  onChange={form.updateAnswer}
                  page={form.currentPage}
                />
              )}
              {api.error && (
                <div className={styles.alert} role="alert" aria-live="assertive">
                  <p>{api.error}</p>
                </div>
              )}
              <div className={styles.formFooter}>
                {form.activePageIndex > 0 ? (
                  <Button
                    disabled={api.isSubmitting}
                    onClick={handleBack}
                    type="button"
                    variant="secondary"
                  >
                    <span aria-hidden="true">‹</span> Back
                  </Button>
                ) : (
                  <span className={styles.footerSpacer} />
                )}
                <Button disabled={api.isSubmitting} type="submit">
                  {api.isSubmitting
                    ? 'Getting quote…'
                    : form.isLastPage
                      ? 'Get my quote'
                      : 'Next'}
                  {!api.isSubmitting && <span aria-hidden="true">›</span>}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </Layout>
  );
}
