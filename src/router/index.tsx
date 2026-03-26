import { createBrowserRouter } from 'react-router-dom';
import HomePage from '../pages/HomePage';
import NotFoundPage from '../pages/NotFoundPage';
import Layout from '../components/Layout/Layout';
import MusicPage from '../pages/MusicPage/MusicPage.tsx';
import LoginPage from '../pages/LoginPage/LoginPage';
import ChatPage from '../pages/ChatPage/ChatPage';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';
import { PublicRoute } from '../components/auth/PublicRoute';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: (
      <PublicRoute>
        <LoginPage/>
      </PublicRoute>
    ),
    errorElement: <NotFoundPage/>
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    errorElement: <NotFoundPage />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: 'music',
        element: <MusicPage/>
      },
      {
        path: 'chat',
        element: <ChatPage/>
      },
      {
        path: 'chat/:id',
        element: <ChatPage/>
      }
    ],
  },
]);
