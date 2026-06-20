import StatCard from '../components/cards/StatCard.jsx';
import BrandMark from '../components/ui/BrandMark.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import SectionHeader from '../components/ui/SectionHeader.jsx';
import { glass, gradientText, shell } from '../components/ui/classes.js';

const founders = [
  {
    name: 'Founder One',
    role: 'Co-Founder & Lead Instructor',
    bio: 'Full-stack developer focused on backend systems, databases, performance and technical interviews.',
  },
  {
    name: 'Founder Two',
    role: 'Co-Founder & Platform Architect',
    bio: 'Frontend specialist and DevOps engineer focused on high-performance UI, automation and deployments.',
  },
];

export default function About() {
  return (
    <>
      <PageHeader title="About" accent="The Epoch Nova" subtitle="We are passionate developers on a mission to make technology education accessible." />
      <section className="py-20">
        <div className={`${shell} grid items-center gap-12 lg:grid-cols-[1.2fr_1fr]`}>
          <div>
            <h2 className="mb-6 text-3xl font-bold text-white">Our <span className={gradientText}>Story</span></h2>
            <div className="space-y-5 text-neutral-400">
              <p>The Epoch Nova was founded by friends who love technology, software and teaching. We noticed how fragmented and overwhelming good programming guidance can be.</p>
              <p>Our mission is to build a free, structured gateway with tutorials, notes, cheat sheets and blueprints that help learners become strong engineers.</p>
              <p>Anyone with curiosity and commitment should be able to learn production-grade coding standards without gatekeepers.</p>
            </div>
          </div>
          <div className={`${glass} flex min-h-80 flex-col items-center justify-center text-center`}>
            <div className="mb-5">
              <BrandMark compact />
            </div>
            <p className="text-neutral-400">Building the future of tech education</p>
          </div>
        </div>
      </section>

      <section className="bg-neutral-900/20 py-20">
        <div className={shell}>
          <SectionHeader title="Meet the" accent="Founders" subtitle="The brains behind the courses, notes and roadmaps." />
          <div className="grid gap-8 md:grid-cols-2">
            {founders.map((founder) => (
              <article key={founder.name} className={`${glass} text-center`}>
                <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full border-2 border-dashed border-cyan-300/40 bg-white/[0.03] text-xl font-bold text-cyan-300">
                  DEV
                </div>
                <h3 className="mb-1 text-2xl font-bold text-white">{founder.name}</h3>
                <p className="mb-5 text-sm font-medium text-cyan-300">{founder.role}</p>
                <p className="mb-6 text-sm leading-6 text-neutral-400">{founder.bio}</p>
                <div className="flex justify-center gap-3">
                  {['GH', 'in', 'X'].map((item) => <span key={item} className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-xs text-neutral-300">{item}</span>)}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-white/[0.04] bg-neutral-900/50 py-16">
        <div className={`${shell} grid gap-8 md:grid-cols-4`}>
          <StatCard value="500+" label="Tutorials Published" />
          <StatCard value="200+" label="PDFs Available" />
          <StatCard value="10,000+" label="Students Helped" />
          <StatCard value="150+" label="Projects Shared" />
        </div>
      </section>
    </>
  );
}
