import React, { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { getRepository } from '../shared/data';
import { UserClaims } from '../shared/data/repository';
import { DashboardSkeleton } from '../components/common/SkeletonLoader';

interface RoleGuardProps {
  requiredRole: 'admin' | 'member';
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ requiredRole }) => {
  const location = useLocation();
  const repo = getRepository();

  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentMember, setCurrentMember] = useState<import('@sanchay/core').Member | null>(null);
  const [claims, setClaims] = useState<UserClaims>({});

  useEffect(() => {
    let isMounted = true;
    async function checkAuth() {
      try {
        const userClaims = await repo.getUserClaims();
        const member = await repo.getCurrentMember();

        if (userClaims.authUid) {
          if (isMounted) {
            setIsAuthenticated(true);
            setCurrentMember(member);
            setClaims(userClaims);
            setLoading(false);
          }
          return;
        }

        if (isMounted) {
          setIsAuthenticated(false);
          setCurrentMember(null);
          setLoading(false);
        }
      } catch (err) {
        console.error('Error in RoleGuard:', err);
        if (isMounted) {
          setIsAuthenticated(false);
          setCurrentMember(null);
          setLoading(false);
        }
      }
    }

    checkAuth();

    return () => {
      isMounted = false;
    };
  }, [location.pathname, repo]);

  if (loading) {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <DashboardSkeleton />
        </div>
      </div>
    );
  }

  // 1. Unauthenticated -> Redirect to /login with role parameter
  if (!isAuthenticated) {
    const roleParam = requiredRole === 'admin' ? '?role=admin' : '?role=member';
    return <Navigate to={`/login${roleParam}`} state={{ from: location.pathname }} replace />;
  }

  // 2. Effective status check
  const effectiveStatus = currentMember?.status || claims.status;
  if (effectiveStatus === 'pending') {
    return <Navigate to="/pending" replace />;
  }

  // 3. Removed member status -> Redirect to /login with error
  if (effectiveStatus === 'removed') {
    repo.logout();
    return <Navigate to="/login?error=removed" replace />;
  }

  const userRoles = claims.roles || (claims.role ? [claims.role] : [currentMember?.role || 'member']);
  const hasBoth = userRoles.includes('admin') && userRoles.includes('member');
  const hasRequired =
    userRoles.includes(requiredRole) ||
    (requiredRole === 'member' && (currentMember?.role === 'member' || effectiveStatus === 'active')) ||
    (requiredRole === 'admin' && (currentMember?.role === 'admin' || claims.role === 'admin' || userRoles.includes('admin') || repo.getActiveRole() === 'admin'));

  // 4. Role mismatch redirection
  if (!hasRequired && !hasBoth) {
    if (requiredRole === 'admin') {
      // Member trying to access /admin -> redirect to /app
      return <Navigate to="/app" replace />;
    } else {
      // Admin trying to access /app -> redirect to /admin
      return <Navigate to="/admin" replace />;
    }
  }

  return <Outlet />;
};

export default RoleGuard;
