/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './routes';
import ErrorBoundary from './components/ErrorBoundary';
import FloatingGeminiChatbot from './components/FloatingGeminiChatbot';

export default function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <AppRoutes />
        <FloatingGeminiChatbot />
      </ErrorBoundary>
    </BrowserRouter>
  );
}
