import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import ErrorBoundary from './components/ErrorBoundary.tsx';
import './index.css';
import { offlineSyncService } from './services/offlineSyncService';

// Initialize Service Worker for Offline Quizzes & Study Materials
if (typeof window !== 'undefined') {
  offlineSyncService.registerServiceWorker();
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
