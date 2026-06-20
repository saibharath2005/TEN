import { useState } from 'react';
import { clearStoredAuth, useAuth } from '../../hooks/useAuth.js';
import { navigate } from '../../hooks/useRoute.js';
import Link from '../ui/Link.jsx';
import BrandMark from '../ui/BrandMark.jsx';

function HeaderIcon({ name, className = 'h-5 w-5' }) {
  const common = {
    className,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: '2',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': 'true',
  };

  const icons = {
    home: <svg {...common}><path d="m3 11 9-8 9 8" /><path d="M5 10v10h5v-6h4v6h5V10" /></svg>,
    login: <svg {...common}><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><path d="M10 17l5-5-5-5" /><path d="M15 12H3" /></svg>,
    signup: <svg {...common}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M19 8v6" /><path d="M22 11h-6" /></svg>,
    dashboard: <svg {...common}><path d="M4 5h7v7H4z" /><path d="M13 5h7v4h-7z" /><path d="M13 11h7v8h-7z" /><path d="M4 14h7v5H4z" /></svg>,
    logout: <svg {...common}><path d="M10 17l-1 1a2 2 0 0 1-2 0l-3-3a2 2 0 0 1 0-2l3-3a2 2 0 0 1 2 0l1 1" /><path d="M13 12H3" /><path d="M16 6h3a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-3" /></svg>,
    menu: <svg {...common}><path d="M4 6h16" /><path d="M4 12h16" /><path d="M4 18h16" /></svg>,
    close: <svg {...common}><path d="m6 6 12 12" /><path d="m18 6-12 12" /></svg>,
  };

  return icons[name] || icons.home;
}

export default function Navbar({ active }) {
  const [open, setOpen] = useState(false);
  const auth = useAuth();
  const links = [
    { href: '/', label: 'Home', key: 'home' },
    { href: '/tutorials', label: 'Tutorials', key: 'tutorials' },
    { href: '/notes', label: 'Notes & PDFs', key: 'notes' },
    { href: '/roadmaps', label: 'Roadmaps', key: 'roadmaps' },
  ];

  const closeMenu = () => setOpen(false);

  const handleLogout = () => {
    clearStoredAuth();
    closeMenu();
    navigate('/');
  };

  const dashboardHref = auth?.user?.role === 'admin' ? '/admin' : '/dashboard';
  const dashboardLabel = auth?.user?.role === 'admin' ? 'Admin' : 'Dashboard';

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-cyan-300/10 bg-[#050b13]/95 shadow-[0_14px_34px_rgba(0,0,0,0.38)] backdrop-blur-xl">
      <div className="mx-auto flex min-h-[72px] w-full max-w-7xl items-center justify-between gap-5 px-5 py-3 lg:px-8">
        <Link href="/" className="flex min-w-max items-center text-white" onClick={closeMenu}>
          <BrandMark className="scale-75 origin-left sm:scale-80" compact />
        </Link>

        <nav className="hidden items-center gap-8 lg:flex" aria-label="Primary navigation">
          {links.map((link) => {
            const isActive = active === link.key;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative inline-flex h-10 items-center gap-2 text-sm font-medium tracking-wide transition after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-full after:origin-left after:bg-gradient-to-r after:from-cyan-300 after:to-violet-500 after:transition-transform ${isActive ? 'text-white after:scale-x-100' : 'text-slate-300 after:scale-x-0 hover:text-white hover:after:scale-x-100'}`}
              >
                {link.key === 'home' && <HeaderIcon name="home" className="h-5 w-5" />}
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden min-w-max items-center gap-3 lg:flex">
          {auth?.token ? (
            <>
              <Link
                href={dashboardHref}
                className={`inline-flex h-10 items-center justify-center gap-2 rounded-[9px] border px-4 text-sm font-medium transition ${active === 'dashboard' || active === 'admin' ? 'border-cyan-300/80 bg-cyan-300/10 text-white' : 'border-cyan-300/60 bg-[#07111c] text-white hover:-translate-y-0.5 hover:bg-cyan-300/10'}`}
              >
                <HeaderIcon name="dashboard" className="h-4 w-4 text-cyan-300" />
                {dashboardLabel}
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-[9px] border border-white/10 bg-white/[0.03] px-4 text-sm font-medium text-slate-200 transition hover:-translate-y-0.5 hover:bg-white/10"
              >
                <HeaderIcon name="logout" className="h-4 w-4" />
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-[9px] border border-cyan-300/60 bg-[#07111c] px-4 text-sm font-medium text-white shadow-[0_0_24px_rgba(34,211,238,0.10)] transition hover:-translate-y-0.5 hover:bg-cyan-300/10"
              >
                <HeaderIcon name="login" className="h-4 w-4 text-cyan-300" />
                Login
              </Link>
              <Link
                href="/signup"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-[9px] bg-gradient-to-r from-cyan-300 to-violet-500 px-4 text-sm font-medium text-slate-950 shadow-[0_0_28px_rgba(124,58,237,0.20)] transition hover:-translate-y-0.5"
              >
                <HeaderIcon name="signup" className="h-4 w-4" />
                Sign Up
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          aria-label="Toggle navigation"
          aria-expanded={open}
          className="grid h-12 w-12 place-items-center rounded-[10px] border border-cyan-300/30 text-cyan-200 lg:hidden"
          onClick={() => setOpen((value) => !value)}
        >
          <HeaderIcon name={open ? 'close' : 'menu'} className="h-7 w-7" />
        </button>
      </div>

      {open && (
        <div className="border-t border-white/10 bg-[#050b13] px-6 pb-6 lg:hidden">
          <nav className="grid gap-2 py-4" aria-label="Mobile navigation">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-[10px] px-4 py-3 text-base font-black transition ${active === link.key ? 'bg-white/10 text-white' : 'text-slate-300 hover:bg-white/8 hover:text-white'}`}
                onClick={closeMenu}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="grid gap-3 sm:grid-cols-2">
            {auth?.token ? (
              <>
                <Link href={dashboardHref} className="inline-flex h-12 items-center justify-center gap-2 rounded-[10px] border border-cyan-300/50 text-sm font-black text-white" onClick={closeMenu}>
                  <HeaderIcon name="dashboard" className="h-4 w-4 text-cyan-300" /> {dashboardLabel}
                </Link>
                <button type="button" onClick={handleLogout} className="inline-flex h-12 items-center justify-center gap-2 rounded-[10px] border border-white/10 bg-white/[0.03] text-sm font-black text-slate-200">
                  <HeaderIcon name="logout" className="h-4 w-4" /> Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="inline-flex h-12 items-center justify-center gap-2 rounded-[10px] border border-cyan-300/50 text-sm font-black text-white" onClick={closeMenu}>
                  <HeaderIcon name="login" className="h-4 w-4 text-cyan-300" /> Login
                </Link>
                <Link href="/signup" className="inline-flex h-12 items-center justify-center gap-2 rounded-[10px] bg-gradient-to-r from-cyan-300 to-violet-500 text-sm font-black text-slate-950" onClick={closeMenu}>
                  <HeaderIcon name="signup" className="h-4 w-4" /> Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
