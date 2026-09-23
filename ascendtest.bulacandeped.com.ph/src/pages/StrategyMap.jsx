import StrategyMapVisual from '@/components/ascend/StrategyMapVisual';
import { Card } from '@/components/ui/card';
import { CheckCircle2, Flag, Target, TrendingUp } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';

function ScrollReveal({ children, className = '', delay = 0 }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={`will-change-transform ${className}`}
      initial={reduceMotion ? false : { opacity: 0, y: 26 }}
      animate={reduceMotion ? undefined : { opacity: 0, y: 26 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: false, amount: 0.14 }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

const roadmap = [
  {
    phase: 'SY 2026-27',
    title: 'System Launched',
    items: [
      'Established clear criteria and framework in identifying and validating scalable innovations',
      'Initial set of innovations are validated based on evidence of learners\' performance outcomes',
      'Selected innovations implemented in multiple pilot schools',
      'Early evidence demonstrated improved learner outcomes from scaled innovations',
    ],
  },
  {
    phase: 'SY 2028-29',
    title: 'System Scaled',
    items: [
      'Innovation pipeline established across learning areas and key stages',
      'Proven innovations scaled in 25% of schools across each district',
      'Monitoring systems tracked fidelity and impact of scaled innovations',
      'Measurable gains in learner outcomes linked to innovation adoption',
    ],
  },
  {
    phase: 'SY 2029-30',
    title: 'System Producing Results',
    items: [
      'Continuous pipeline of high-impact innovations sustained division-wide',
      'Proven innovations scaled in 50% of schools across each district',
      'Innovation adoption is consistent and systematized',
      'Innovation consistently drove system-wide improvement in learner outcomes',
    ],
  },
];

const outcomes = [
  'High-impact innovations are systematically identified and validated',
  'Effective innovations are scaled consistently across divisions',
  'Teaching improves through adoption of validated innovations',
];

const kpis = [
  '80-90% of learners from each of the schools implementing the validated scalable innovations improved learning outcomes on numeracy and literacy',
];

export default function StrategyMap() {
  return (
    <div className="page-shell space-y-8">
      <ScrollReveal className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.18em] font-bold text-primary mb-2">
            <Flag className="w-3.5 h-3.5" /> Division Roadmap
          </div>
          <h1 className="page-title">Strategy Map 2030</h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
            SDO Bulacan's strategic framework for identifying, validating, and scaling innovations that improve learner outcomes.
          </p>
        </div>
        <div className="inline-flex items-center gap-3 rounded-xl border border-primary/15 bg-primary/5 px-4 py-3 self-start">
          <Target className="w-5 h-5 text-primary" />
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Target horizon</div>
            <div className="font-bold text-sm text-primary">School Year 2029–30</div>
          </div>
        </div>
      </ScrollReveal>

      <StrategyMapVisual />

      <section className="space-y-4">
        <ScrollReveal>
          <div className="text-[11px] uppercase tracking-[0.18em] font-bold text-primary">Implementation Path</div>
          <h2 className="text-xl font-bold mt-1">From launch to division-wide results</h2>
          <p className="text-sm text-muted-foreground mt-1">Three checkpoints keep the Innovation-to-Scale System focused and measurable.</p>
        </ScrollReveal>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {roadmap.map((stage, index) => (
            <ScrollReveal key={stage.phase} delay={index * 0.08}>
              <Card className="relative p-5 overflow-hidden border-border/70 h-full">
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary to-teal-400" />
              <div className="flex items-center justify-between gap-3 mb-4">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-primary">{stage.phase}</div>
                  <h3 className="font-bold mt-0.5">{stage.title}</h3>
                </div>
                <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                  {index + 1}
                </div>
              </div>
              <ul className="space-y-3">
                {stage.items.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-xs text-muted-foreground leading-relaxed">
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              </Card>
            </ScrollReveal>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-4">
        <ScrollReveal>
          <Card className="p-6 border-border/70 h-full">
          <div className="flex items-center gap-2 text-primary mb-4">
            <TrendingUp className="w-4 h-4" />
            <h2 className="text-sm font-bold">Expected Outcomes</h2>
          </div>
          <div className="space-y-3">
            {outcomes.map((outcome, index) => (
              <div key={outcome} className="flex items-start gap-3 rounded-lg bg-muted/60 p-3">
                <span className="w-6 h-6 rounded-md bg-white text-primary flex items-center justify-center text-xs font-bold flex-shrink-0 shadow-sm">{index + 1}</span>
                <p className="text-sm text-foreground leading-relaxed">{outcome}</p>
              </div>
            ))}
          </div>
          </Card>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-[#173F4D] to-[#2A7D87] p-6 text-white h-full">
          <div className="absolute -right-14 -bottom-20 w-56 h-56 rounded-full border-[30px] border-white/5" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em]">
              <Target className="w-3.5 h-3.5" /> 2030 Success Indicator
            </div>
            <div className="flex items-end gap-2 mt-6">
              <span className="text-5xl sm:text-6xl font-black tracking-tight">80–90%</span>
              <span className="text-sm text-white/65 pb-2">of learners</span>
            </div>
            <p className="text-sm leading-relaxed text-white/80 mt-4 max-w-2xl">{kpis[0]}</p>
          </div>
          </Card>
        </ScrollReveal>
      </section>
    </div>
  );
}
