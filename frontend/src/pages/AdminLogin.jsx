import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { KeyRound, ShieldAlert, UserCheck, Sparkles, ArrowRight, X } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import FloatingBackground from '../components/common/FloatingBackground';

const ROLE_OPTIONS = [
  { role: 'super-admin', label: 'Super Admin', icon: ShieldAlert },
  { role: 'admin', label: 'Admin', icon: UserCheck },
  { role: 'manager', label: 'Manager', icon: UserCheck },
];

function pickInitialRoleFromEmail(email) {
  const e = (email || '').toLowerCase();
  if (e.includes('super') || e.includes('root') || e.includes('owner') || e.includes('admin')) return 'super-admin';
  if (e.includes('manager') || e.includes('mgr')) return 'manager';
  return 'admin';
}

export default function AdminLogin({ onLogin, onCancel, isModal }) {
  const { setUser } = useAppStore();

  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('admin');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const initialHint = useMemo(() => {
    return 'Use any credentials (mock). Try: super@corp.com, manager@corp.com';
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!emailOrPhone || !password) {
      setError('Please enter email/phone and password.');
      return;
    }

    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 650));

    const inferredRole = pickInitialRoleFromEmail(emailOrPhone);
    const effectiveRole = role || inferredRole;

    setUser({
      emailOrPhone,
      isVerified: true,
      role: effectiveRole,
    });

    setSubmitting(false);
    onLogin({ role: effectiveRole, emailOrPhone });
  };

  const RoleIcon = ROLE_OPTIONS.find((r) => r.role === role)?.icon || ShieldAlert;

  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-brand-50 border border-brand-100/50 shadow-sm">
                  <Sparkles size={13} className="text-brand-500 animate-pulse" />
                  <span className="text-xs font-semibold text-brand-700 tracking-tight">Admin Portal</span>
                </div>
                <h1 className="font-headline-md text-2xl font-semibold text-[#0a0a0a]">
                  Sign in
                </h1>
                <p className="mt-2 font-body-md text-sm text-[#5a5a5c]">{initialHint}</p>
              </div>
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-2xl border border-neutral-100 bg-white/60">
                  <RoleIcon size={18} className="text-neutral-700" />
                </div>
                {onCancel && (
                  <button
                    type="button"
                    onClick={onCancel}
                    className="p-2 rounded-2xl border border-neutral-100 bg-white/60 hover:bg-neutral-100 text-neutral-500 hover:text-neutral-700 transition-colors"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-2.5">
              <div>
                <label className="mb-2 block font-label-caps text-[11px] font-semibold uppercase tracking-[0.05em] text-[#3a3a3c]">
                  Email or Phone
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={emailOrPhone}
                    onChange={(e) => {
                      const v = e.target.value;
                      setEmailOrPhone(v);
                      setRole(pickInitialRoleFromEmail(v));
                    }}
                    placeholder="e.g. super@corp.com"
                    className="h-11 w-full rounded-md border border-[#e5e5e5] bg-white px-4 font-body-md text-base text-[#0a0a0a] outline-none transition-all duration-200 placeholder:text-[#a8a8aa] focus:border-2 focus:border-[#00d4a4]"
                    disabled={submitting}
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block font-label-caps text-[11px] font-semibold uppercase tracking-[0.05em] text-[#3a3a3c]">
                  Password
                </label>
                <div className="relative">
                  <KeyRound size={14} className="absolute left-3.5 top-3.5 text-[#a8a8aa]" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="h-11 w-full rounded-md border border-[#e5e5e5] bg-white pl-10 pr-4 font-body-md text-base text-[#0a0a0a] outline-none transition-all duration-200 placeholder:text-[#a8a8aa] focus:border-2 focus:border-[#00d4a4]"
                    disabled={submitting}
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block font-label-caps text-[11px] font-semibold uppercase tracking-[0.05em] text-[#3a3a3c]">
                  Role (mock)
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="h-11 w-full rounded-md border border-[#e5e5e5] bg-white px-4 font-body-md text-base text-[#0a0a0a] outline-none transition-all duration-200 focus:border-2 focus:border-[#00d4a4]"
                  disabled={submitting}
                >
                  {ROLE_OPTIONS.map((r) => (
                    <option key={r.role} value={r.role}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>

              {error && <p className="text-[10px] font-bold text-red-500">{error}</p>}

              <button
                type="submit"
                disabled={submitting}
                className="mt-2 flex h-11 w-full items-center justify-center rounded-full bg-primary-container font-button-text text-sm font-semibold uppercase text-navy-accent transition-all duration-200 hover:shadow-md active:translate-y-px disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>{submitting ? 'SIGNING IN…' : 'SIGN IN'}</span>
              </button>
      </form>
    </>
  );

  if (isModal) {
    return <div className="pt-2">{content}</div>;
  }

  return (
    <div className="relative min-h-[calc(100vh-73px)] flex items-center justify-center px-4 py-8 overflow-hidden">
      <FloatingBackground />
      <div className="w-full max-w-[430px] relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key="admin-login"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="relative w-full bg-white border border-neutral-200 shadow-2xl z-10 overflow-hidden rounded-xl px-6 py-8 text-left sm:px-10 sm:py-10"
          >
            {content}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}