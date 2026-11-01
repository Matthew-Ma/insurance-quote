import styles from './FormStyles.module.css';

interface StepStepperProps {
  activeIndex: number;
  pageTitles: string[];
  initialPageCount: number;
  isQuoted: boolean;
}

export function StepStepper({
  activeIndex,
  pageTitles,
  initialPageCount,
  isQuoted,
}: StepStepperProps) {
  const isInDetails = activeIndex === 0 && pageTitles[0] === 'Your Details';
  const isInApplication = activeIndex >= (isInDetails ? 1 : 0) && !isQuoted;
  const currentGroup = isQuoted ? 2 : isInDetails ? 0 : 1;

  return (
    <nav className={styles.stepper} aria-label="Application progress">
      <ol className={styles.primarySteps}>
        <li className={`${styles.primaryStep} ${currentGroup === 0 ? styles.current : ''} ${currentGroup > 0 ? styles.completed : ''}`}>
          <span className={styles.stepNumber} aria-hidden="true">
            {currentGroup > 0 ? '✓' : '1'}
          </span>
          <span>Your Details</span>
        </li>
        <li className={`${styles.applicationGroup} ${currentGroup === 1 ? styles.current : ''} ${currentGroup > 1 ? styles.completed : ''}`}>
          <div className={styles.primaryStep}>
            <span className={styles.stepNumber} aria-hidden="true">
              {currentGroup > 1 ? '✓' : '2'}
            </span>
            <span>Application</span>
          </div>
          {isInApplication && (
            <ol className={styles.subSteps} aria-label="Application sections">
              {pageTitles.slice(1, initialPageCount).map((title, index) => {
                const pageIndex = index + 1;
                return (
                  <li
                    className={activeIndex === pageIndex ? styles.subStepCurrent : ''}
                    key={`${title}-${pageIndex}`}
                    aria-current={activeIndex === pageIndex ? 'step' : undefined}
                  >
                    <span className={styles.subStepDot} aria-hidden="true" />
                    {title}
                  </li>
                );
              })}
              {pageTitles.slice(initialPageCount).map((title, index) => {
                const pageIndex = initialPageCount + index;
                return (
                  <li
                    className={activeIndex === pageIndex ? styles.subStepCurrent : ''}
                    key={`${title}-${pageIndex}`}
                    aria-current={activeIndex === pageIndex ? 'step' : undefined}
                  >
                    <span className={styles.subStepDot} aria-hidden="true" />
                    {title}
                  </li>
                );
              })}
            </ol>
          )}
        </li>
        <li className={`${styles.primaryStep} ${currentGroup === 2 ? styles.current : ''}`}>
          <span className={styles.stepNumber} aria-hidden="true">
            3
          </span>
          <span>Quote</span>
        </li>
      </ol>
    </nav>
  );
}
