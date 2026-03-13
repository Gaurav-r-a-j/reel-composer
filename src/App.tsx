import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@/components/theme-provider';
import { MobileBlocker } from '@/components/layout/MobileBlocker';
import { AppContent } from '@/views/AppContent';

// Single root route: upload, generating, editor all at /. Draft restored from IndexedDB on load so refresh keeps state.
const App: React.FC = () => (
  <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
    <MobileBlocker />
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:rounded-lg focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background bg-background font-medium"
    >
      Skip to main content
    </a>
    <div id="main-content" className="hidden md:block md:min-h-screen md:h-full md:w-full" tabIndex={-1}>
      <Routes>
        <Route path="*" element={<AppContent />} />
      </Routes>
    </div>
  </ThemeProvider>
);

export default App;
