import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { hasVisitedBefore } from '../utils/storage';
import Welcome from './Welcome';

export default function Root() {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  if (!hasVisitedBefore()) return <Welcome />;
  return <Navigate to="/explore" replace />;
}
