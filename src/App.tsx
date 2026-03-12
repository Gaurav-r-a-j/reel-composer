import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@/components/theme-provider';
import { MobileBlocker } from '@/components/layout/MobileBlocker';
import { AppContent } from '@/views/AppContent';
import { ROUTES } from '@/routes';

const App: React.FC = () => (
  <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
    <MobileBlocker />
    <div className="hidden md:block md:min-h-screen md:h-full md:w-full">
      <Routes>
        <Route path={ROUTES.DRAFT} element={<AppContent />} />
        <Route path="*" element={<AppContent />} />
      </Routes>
    </div>
  </ThemeProvider>
);

export default App;
