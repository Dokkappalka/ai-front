import axios from 'axios';
axios.defaults.withCredentials = true;

import { createRoot } from 'react-dom/client'
import './index.scss'
import App from './App.tsx'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WebSocketProvider } from './utils/WebSocketProvider.tsx';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});


createRoot(document.getElementById('root')!).render(
  <WebSocketProvider>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </WebSocketProvider>
)
