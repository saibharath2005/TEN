import Link from '../ui/Link.jsx';
import BrandMark from '../ui/BrandMark.jsx';
import { shell } from '../ui/classes.js';

const footerGroups = [
  { title: 'Quick Links', links: ['Home', 'Tutorials', 'Notes', 'Roadmaps'] },
  { title: 'Resources', links: ['Java Tutorials', 'SQL Databases', 'DSA Guides', 'Web Development', 'DevOps Systems'] },
  { title: 'Contact', links: ['About Us', 'Contact Us', 'Privacy Policy', 'Terms of Service'] },
];

export default function Footer() {
  return (
    <footer className="border-t border-white/[0.04] bg-[#080808] py-16">
      <div className={shell}>
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div className="space-y-5">
            <Link href="/" className="flex items-center gap-3 text-lg font-bold text-white">
              <BrandMark compact />
            </Link>
            <p className="max-w-sm text-sm leading-6 text-neutral-400">
              Your gateway to mastering technology. Learn programming, software engineering and DevOps with premium structured guides.
            </p>
            <div className="flex gap-3">
              {['YT', 'GH', 'X', 'in'].map((item) => (
                <a key={item} className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-xs text-neutral-300 transition hover:-translate-y-0.5 hover:bg-cyan-300 hover:text-black">
                  {item}
                </a>
              ))}
            </div>
          </div>

          {footerGroups.map((group) => (
            <div key={group.title}>
              <h4 className="mb-5 border-l-2 border-cyan-300 pl-3 text-sm font-semibold uppercase tracking-wider text-white">{group.title}</h4>
              <ul className="space-y-3">
                {group.links.map((item) => (
                  <li key={item}>
                    <a href="#" className="text-sm text-neutral-400 transition hover:pl-1 hover:text-cyan-300">{item}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="mt-12 border-t border-white/[0.04] pt-8 text-center text-sm text-neutral-600">
          &copy; 2026 The Epoch Nova. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
