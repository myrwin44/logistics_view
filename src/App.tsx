// src/App.tsx
// Requirements: 1.2, 2.1, 14.3
import { RouterProvider } from 'react-router-dom';
import * as Toast from '@radix-ui/react-toast';
import { QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { router } from './router';
import { queryClient } from './lib/queryClient';

export default function App() {
  return (
    <Toast.Provider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <SettingsProvider>
            <RouterProvider router={router} />
          </SettingsProvider>
        </AuthProvider>
      </QueryClientProvider>
      <Toast.Viewport />
    </Toast.Provider>
  );
}
