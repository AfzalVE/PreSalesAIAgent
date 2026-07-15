import { useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';

export default function AdminPortalRoute({ children }) {
  const { user } = useAppStore();

  const role = useMemo(() => (user?.role ? String(user.role) : ''), [user?.role]);

  const allowed = role === 'super-admin' || role === 'admin' || role === 'manager';

  if (!allowed) {
    return (
      <div className="max-w-3xl mx-auto py-16 px-4 text-center">
        <div className="text-neutral-900 font-black text-2xl">Admin access required</div>
        <p className="text-neutral-500 text-sm mt-2">
          Sign in from the Admin Portal login page to continue.
        </p>
      </div>
    );
  }

  return children;
}

