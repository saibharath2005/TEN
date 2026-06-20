import { useEffect, useState } from 'react';
import { apiPost } from '../../services/api.js';
import { navigate } from '../../hooks/useRoute.js';
import { setStoredAuth, useAuth } from '../../hooks/useAuth.js';
import BrandMark from '../ui/BrandMark.jsx';

function Icon({ name, className = 'h-5 w-5' }) {
  const common = {
    className,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: '1.8',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': 'true',
  };

  const icons = {
    mail: <svg {...common}><path d="m4 6 8 7 8-7" /><rect x="3" y="5" width="18" height="14" rx="2" /></svg>,
    lock: <svg {...common}><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>,
    eye: <svg {...common}><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></svg>,
    eyeOff: <svg {...common}><path d="m3 3 18 18" /><path d="M10.6 10.6A3 3 0 0 0 12 15a3 3 0 0 0 2.4-1.2" /><path d="M9.9 5.1A10.8 10.8 0 0 1 12 5c6.5 0 10 7 10 7a18.1 18.1 0 0 1-4.1 4.9" /><path d="M6.1 6.1C3.4 8.3 2 12 2 12s3.5 7 10 7c1.2 0 2.4-.2 3.4-.5" /></svg>,
    user: <svg {...common}><circle cx="12" cy="8" r="4" /><path d="M4 20a8 8 0 0 1 16 0" /></svg>,
    arrow: <svg {...common}><path d="M5 12h13" /><path d="m12 5 7 7-7 7" /></svg>,
  };

  return icons[name] || icons.mail;
}

function FormField({ label, type, name, placeholder, value, onChange, icon, autoComplete, rightAction }) {
  return (
    <label className="grid gap-2 text-sm font-medium text-slate-300">
      <span>{label}</span>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
          <Icon name={icon} className="h-4 w-4" />
        </span>
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="h-11 w-full rounded-[8px] border border-white/10 bg-white/[0.03] pl-10 pr-10 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-300 focus:bg-white/[0.05]"
        />
        {rightAction && (
          <button
            type="button"
            onClick={rightAction.onClick}
            aria-label={rightAction.label}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-white"
          >
            <Icon name={rightAction.icon} className="h-4 w-4" />
          </button>
        )}
      </div>
    </label>
  );
}

export default function AuthPage({ mode }) {
  const isLogin = mode === 'login';
  const auth = useAuth();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (auth?.token) {
      navigate(auth?.user?.role === 'admin' ? '/admin' : '/dashboard');
    }
  }, [auth]);

  async function onSubmit(event) {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!isLogin && form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const payload = isLogin
        ? { email: form.email.trim(), password: form.password }
        : { name: form.name.trim(), email: form.email.trim(), password: form.password };

      const data = await apiPost(isLogin ? '/auth/login' : '/auth/register', payload);
      setStoredAuth({ ...data, loggedInAt: new Date().toISOString() });
      setSuccess(isLogin ? 'Login successful. Redirecting...' : 'Account created successfully. Redirecting...');
      setTimeout(() => navigate(data?.user?.role === 'admin' ? '/admin' : '/dashboard'), 600);
    } catch (err) {
      setError(err?.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#050b13] px-4 py-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.08),transparent_26%),radial-gradient(circle_at_80%_15%,rgba(124,58,237,0.10),transparent_24%),linear-gradient(180deg,#050b13_0%,#04070d_100%)]" />
      <div className="relative w-full max-w-[620px] rounded-[14px] border border-cyan-300/20 bg-[#050a11]/95 px-6 py-8 shadow-[0_24px_80px_rgba(0,0,0,0.6)] sm:px-10">
        <div className="mx-auto mb-6 flex justify-center">
          <BrandMark compact />
        </div>

        <div className="text-center">
          <h1 className="text-2xl font-black text-white sm:text-3xl">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            {isLogin ? 'Login to your account and continue your learning journey.' : 'Join us and unlock a world of knowledge.'}
          </p>
        </div>

        <form onSubmit={onSubmit} className="mt-8 grid gap-4">
          {!isLogin && (
            <FormField
              label="Full Name"
              type="text"
              name="name"
              placeholder="Enter your full name"
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              icon="user"
              autoComplete="name"
            />
          )}

          <FormField
            label="Email Address"
            type="email"
            name="email"
            placeholder="Enter your email"
            value={form.email}
            onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
            icon="mail"
            autoComplete="email"
          />

          <FormField
            label="Password"
            type={showPassword ? 'text' : 'password'}
            name="password"
            placeholder={isLogin ? 'Enter your password' : 'Create a password'}
            value={form.password}
            onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
            icon="lock"
            autoComplete={isLogin ? 'current-password' : 'new-password'}
            rightAction={{
              label: showPassword ? 'Hide password' : 'Show password',
              icon: showPassword ? 'eyeOff' : 'eye',
              onClick: () => setShowPassword((value) => !value),
            }}
          />

          {!isLogin && (
            <FormField
              label="Confirm Password"
              type={showConfirm ? 'text' : 'password'}
              name="confirmPassword"
              placeholder="Confirm your password"
              value={form.confirmPassword}
              onChange={(event) => setForm((current) => ({ ...current, confirmPassword: event.target.value }))}
              icon="lock"
              autoComplete="new-password"
              rightAction={{
                label: showConfirm ? 'Hide confirm password' : 'Show confirm password',
                icon: showConfirm ? 'eyeOff' : 'eye',
                onClick: () => setShowConfirm((value) => !value),
              }}
            />
          )}

          {error && <p className="rounded-[8px] border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</p>}
          {success && <p className="rounded-[8px] border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">{success}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-1 inline-flex h-11 w-full items-center justify-center gap-2 rounded-[8px] bg-gradient-to-r from-cyan-300 via-sky-400 to-violet-500 text-sm font-bold text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? 'Please wait...' : isLogin ? 'Login' : 'Sign Up'}
            <Icon name="arrow" className="h-4 w-4" />
          </button>

          <div className="pt-2 text-center text-sm text-slate-400">
            {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
            <button
              type="button"
              onClick={() => navigate(isLogin ? '/signup' : '/login')}
              className="font-bold text-cyan-300 transition hover:text-violet-300"
            >
              {isLogin ? 'Sign up' : 'Login'}
            </button>
          </div>

          <div className="mt-2 flex justify-center gap-3 text-orange-400">
            {['brain', 'cloud', 'image', 'shield'].map((item) => (
              <span key={item} className="grid h-8 w-8 place-items-center rounded-full border border-orange-300/20 bg-orange-400/8">
                <SmallMark icon={item} />
              </span>
            ))}
          </div>
        </form>
      </div>
    </div>
  );
}

function SmallMark({ icon }) {
  const common = {
    className: 'h-4 w-4',
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: '1.8',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': 'true',
  };

  const icons = {
    brain: <svg {...common}><path d="M9 4a3 3 0 0 0-3 3v1a3 3 0 0 0-1 5 3 3 0 0 0 1 5v1a3 3 0 0 0 3 3h2" /><path d="M15 4a3 3 0 0 1 3 3v1a3 3 0 0 1 1 5 3 3 0 0 1-1 5v1a3 3 0 0 1-3 3h-2" /></svg>,
    cloud: <svg {...common}><path d="M7 18a4 4 0 0 1 .3-8A5 5 0 0 1 17 8a4 4 0 0 1 1 8H7Z" /></svg>,
    image: <svg {...common}><rect x="4" y="5" width="16" height="14" rx="2" /><path d="m8 13 2-2 3 3 2-2 3 3" /></svg>,
    shield: <svg {...common}><path d="M12 3 19 6v5c0 4.5-2.9 8.4-7 10-4.1-1.6-7-5.5-7-10V6l7-3Z" /></svg>,
  };

  return icons[icon] || icons.brain;
}

