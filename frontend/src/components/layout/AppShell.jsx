import Navbar from './Navbar.jsx';
import Footer from './Footer.jsx';
import BackToTop from './BackToTop.jsx';

export default function AppShell({ active, children }) {
  const hideFooter = active === 'dashboard' || active === 'admin';

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white selection:bg-violet-500/30">
      <Navbar active={active} />
      <main>{children}</main>
      {!hideFooter && <Footer />}
      <BackToTop />
    </div>
  );
}
