import { useState } from 'react';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { InsuranceJourneyContainer } from './features/insurance-journey/InsuranceJourneyContainer';
import { initializeMonitoring } from './monitoring/sentry';

initializeMonitoring();

export default function App() {
  const [journeyKey, setJourneyKey] = useState(0);

  return (
    <ErrorBoundary>
      <InsuranceJourneyContainer
        key={journeyKey}
        onRestart={() => setJourneyKey((key) => key + 1)}
      />
    </ErrorBoundary>
  );
}
