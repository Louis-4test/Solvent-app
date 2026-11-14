/* eslint-disable react/prop-types */
import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import authAPI from '../../services/authAPI';
import { getUser, isAuthenticated, logout, saveUser } from '../../utils/auth';
import '../Admin/Admin.css';

export default function AdminRoute({ children }) {
  const location = useLocation();
  const [access, setAccess] = useState('checking');
  const [currentUser, setCurrentUser] = useState(() => getUser());

  useEffect(() => {
    let active = true;

    const verifyAccess = async () => {
      try {
        const response = await authAPI.getMe();

        if (!active) return;

        saveUser(response.user);
        setCurrentUser(response.user);
        setAccess(response.user?.isAdmin ? 'authorized' : 'denied');
      } catch (error) {
        if (!active) return;

        if (error.status === 401 || error.status === 403) {
          logout();
          setAccess('unauthenticated');
          return;
        }

        setAccess(getUser()?.isAdmin ? 'authorized' : 'denied');
      }
    };

    verifyAccess();

    return () => {
      active = false;
    };
  }, []);

  if (!isAuthenticated() || access === 'unauthenticated') {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (access === 'checking') {
    return (
      <div className="admin-access-state">
        <span className="admin-access-spinner" aria-hidden="true" />
        <p>Checking administrator access...</p>
      </div>
    );
  }

  if (!currentUser?.isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
}
