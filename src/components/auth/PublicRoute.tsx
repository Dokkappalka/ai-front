import { Navigate } from 'react-router-dom';
import { useMainStore } from '../../store/mainStore';

interface PublicRouteProps {
  children: React.ReactNode;
}

export const PublicRoute = ({ children }: PublicRouteProps) => {
  const accessToken = useMainStore((state) => state.accessToken);

  if (accessToken) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

