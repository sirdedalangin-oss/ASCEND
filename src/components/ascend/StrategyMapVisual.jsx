import {
  BarChart3,
  BookOpenCheck,
  BrainCircuit,
  Building2,
  ChevronsDown,
  Database,
  GraduationCap,
  HeartHandshake,
  Lightbulb,
  Sparkles,
  Target,
  UsersRound,
} from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';

const impactItems = [
  { title: 'Consistent Learner Mastery', icon: GraduationCap, accent: 'text-teal-700', surface: 'bg-teal-50 border-teal-100' },
  { title: 'Empowered Educators and Leaders', icon: UsersRound, accent: 'text-indigo-700', surface: 'bg-indigo-50 border-indigo-100' },
  { title: 'Responsive and Future-Ready School System', icon: Building2, accent: 'text-amber-700', surface: 'bg-amber-50 border-amber-100' },
];

const coreItems = [
  {
    title: 'Instructional Improvement Engine',
    desc: 'Optimize teaching using real-time learner data to ensure consistent mastery across all classrooms.',
    icon: BookOpenCheck,
  },
  {
    title: 'Innovation-to-Scale System',
    desc: 'Scale high-impact innovations that improve teaching and learning across schools consistently.',
    icon: Lightbulb,
  },
  {
    title: 'Coaching and Support Spine',
    desc: 'Strengthen teacher and school leader capability through targeted, continuous coaching and support systems.',
    icon: HeartHandshake,
  },
];

const coreValues = [
  { value: 'Maka-Diyos', icon: Sparkles },
  { value: 'Maka-Tao', icon: UsersRound },
  { value: 'Makakalikasan', icon: BrainCircuit },
  { value: 'Makabansa', icon: Building2 },
];

function ScrollReveal({ children, className = '', delay = 0, distance = 24 }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={`will-change-transform ${className}`}
      initial={reduceMotion ? false : { opacity: 0, y: distance }}
      animate={reduceMotion ? undefined : { opacity: 0, y: distance }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: false, amount: 0.16 }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

function BandHeading({ eyebrow, title, description, icon: Icon }) {
  return (
    <div className="flex items-start gap-3 mb-4">
      <div className="w-9 h-9 rounded-lg bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 shadow-sm">
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <div className="text-[10px] uppercase tracking-[0.22em] font-bold text-primary/70">{eyebrow}</div>
        <h3 className="font-bold text-foreground leading-tight mt-0.5">{title}</h3>
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
      </div>
    </div>
  );
}

function FlowArrow() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="flex items-center justify-center py-1" aria-hidden="true">
      <div className="flex flex-col items-center">
        <div className="h-3 w-px bg-gradient-to-b from-transparent to-primary/30" />
        <motion.div
          className="w-10 h-10 rounded-xl border border-primary/20 bg-gradient-to-br from-white to-primary/10 text-primary flex items-center justify-center shadow-sm ring-4 ring-primary/5"
          animate={reduceMotion ? undefined : { y: [0, 3, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        >
          <ChevronsDown className="w-5 h-5" strokeWidth={2.25} />
        </motion.div>
        <div className="h-3 w-px bg-gradient-to-b from-primary/30 to-transparent" />
      </div>
    </div>
  );
}

export default function StrategyMapVisual() {
  return (
    <section className="rounded-2xl border border-border/70 bg-card shadow-sm overflow-hidden">
      <ScrollReveal className="relative overflow-hidden bg-gradient-to-br from-[#173F4D] via-[#236878] to-[#2E8791] px-6 py-8 sm:px-10 sm:py-10 text-white" distance={16}>
        <div className="absolute -right-12 -top-20 w-64 h-64 rounded-full border-[36px] border-white/5" />
        <div className="absolute right-28 -bottom-24 w-48 h-48 rounded-full bg-cyan-300/10 blur-2xl" />
        <div className="relative flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]">
              <Target className="w-3.5 h-3.5" /> Division Strategy
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mt-4">Strategy Map 2030</h2>
            <p className="text-sm sm:text-base text-white/75 mt-2">Schools Division Office of Bulacan Province</p>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm">
            <div className="w-10 h-10 rounded-lg bg-white/15 flex items-center justify-center">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-widest text-white/60">North Star</div>
              <div className="text-sm font-semibold">Better outcomes, at scale</div>
            </div>
          </div>
        </div>
      </ScrollReveal>

      <div className="bg-slate-50/70 p-4 sm:p-6 lg:p-8">
        <ScrollReveal className="rounded-xl border border-border/70 bg-white p-5 sm:p-6">
          <BandHeading
            eyebrow="Impact"
            title="What success looks like"
            description="The lasting outcomes the division aims to achieve for learners, educators, and schools."
            icon={Target}
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {impactItems.map(({ title, icon: Icon, accent, surface }) => (
              <div key={title} className={`rounded-xl border p-4 flex items-center gap-3 ${surface}`}>
                <div className={`w-10 h-10 rounded-lg bg-white/80 flex items-center justify-center flex-shrink-0 ${accent}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-sm font-semibold leading-snug text-slate-800">{title}</span>
              </div>
            ))}
          </div>
        </ScrollReveal>

        <FlowArrow />

        <ScrollReveal className="rounded-xl border border-primary/20 bg-gradient-to-r from-primary to-[#277E89] p-5 sm:p-6 text-primary-foreground shadow-sm">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-[0.22em] font-bold text-white/65">Strategic Position</div>
              <p className="text-base sm:text-lg font-semibold leading-relaxed mt-1 max-w-5xl">
                By 2030, SDO Bulacan will be Central Luzon's innovation hub for public education—developing and scaling new approaches that strengthen teaching and help every learner succeed.
              </p>
            </div>
          </div>
        </ScrollReveal>

        <FlowArrow />

        <ScrollReveal className="rounded-xl border border-border/70 bg-white p-5 sm:p-6">
          <BandHeading
            eyebrow="Core"
            title="Three engines of transformation"
            description="Connected systems that turn classroom evidence into sustainable division-wide improvement."
            icon={Lightbulb}
          />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {coreItems.map(({ title, desc, icon: Icon }, index) => (
              <ScrollReveal key={title} className="relative rounded-xl border border-border bg-card p-5 overflow-hidden group hover:border-primary/30 hover:shadow-sm transition-all" delay={index * 0.08} distance={18}>
                <div className="absolute right-3 top-2 text-5xl font-black text-primary/[0.06]">0{index + 1}</div>
                <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-foreground pr-8">{title}</h4>
                <p className="text-xs text-muted-foreground leading-relaxed mt-2">{desc}</p>
              </ScrollReveal>
            ))}
          </div>
        </ScrollReveal>

        <FlowArrow />

        <ScrollReveal className="rounded-xl border border-sky-200 bg-sky-50 p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-sky-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-[0.22em] font-bold text-sky-700">Support Backbone</div>
              <h3 className="font-bold text-slate-900 mt-0.5">Data, Knowledge, and Innovation Backbone</h3>
              <p className="text-sm text-slate-600 leading-relaxed mt-1">
                Integrate data systems and digital services to enable faster decisions and efficient, reliable operations.
              </p>
            </div>
          </div>
        </ScrollReveal>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] border-t border-border/70">
        <ScrollReveal className="p-6 lg:p-8 border-b lg:border-b-0 lg:border-r border-border/70">
          <div className="flex items-center gap-2 text-primary mb-3">
            <BookOpenCheck className="w-4 h-4" />
            <h3 className="text-xs font-bold uppercase tracking-[0.18em]">Mission</h3>
          </div>
          <p className="text-sm text-muted-foreground leading-7">
            To protect and promote the right of every Filipino to quality, equitable, and culture-based education where students learn in a child-friendly, gender-sensitive, safe, and motivating environment; teachers facilitate learning and constantly nurture every learner; administrators and staff ensure an enabling environment; and families, communities, and stakeholders share responsibility for developing life-long learners.
          </p>
        </ScrollReveal>
        <ScrollReveal className="p-6 lg:p-8" delay={0.08}>
          <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-primary mb-4">Core Values</h3>
          <div className="grid grid-cols-2 gap-3">
            {coreValues.map(({ value, icon: Icon }) => (
              <div key={value} className="rounded-lg bg-muted/70 px-3 py-3 flex items-center gap-2.5">
                <Icon className="w-4 h-4 text-primary flex-shrink-0" />
                <span className="text-xs font-semibold">{value}</span>
              </div>
            ))}
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
