import { ArrowUpRight, PieChart, Target, ShieldCheck, ShieldMinus, BookOpen, TrendingUp } from 'lucide-react';

const stages = [
  { num: 1, title: 'Innovation Identification', desc: 'Discover promising educational practices and innovations.', icon: PieChart, hex: '#197786' },
  { num: 2, title: 'Innovation Validation', desc: 'Validate its effectiveness, scalability, and replicability.', icon: Target, hex: '#4272a1' },
  { num: 3, title: 'Readiness Assessment', desc: 'Assess readiness of systems, resources, and stakeholders.', icon: ShieldCheck, hex: '#a87928' },
  { num: 4, title: 'Institutionalization', desc: 'Integrate the innovation into policies, systems, and everyday practice.', icon: ShieldMinus, hex: '#5b7396' },
  { num: 5, title: 'Scaling and Expansion', desc: 'Expand successful practices to more schools and learners.', icon: BookOpen, hex: '#2b8b80' },
  { num: 6, title: 'Sustainability & Continuous Improvement', desc: 'Ensure long-term impact through monitoring, reflection, and ongoing enhancement.', icon: TrendingUp, hex: '#315b80' },
];

export default function ASCENDWorkflow({ onOpenResults, disabled = false }) {
  return (
    <div>
      <div className="mb-6 text-center">
        <div className="inline-flex flex-col items-center">
          <div
            className="flex h-36 w-36 flex-col items-center justify-center rounded-full border-[6px] border-white px-4 text-center shadow-[0_10px_28px_-12px_rgba(21,56,67,0.45)] sm:h-40 sm:w-40"
            style={{ background: 'linear-gradient(135deg, #173e4b, #247d89)' }}
          >
            <span className="text-lg font-bold leading-tight text-white">ASCEND</span>
            <span className="mt-1 text-[10px] leading-tight text-white/80">
              Assessment of Scalable Education Novelties and Development
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {stages.map((stage) => {
          const Icon = stage.icon;
          return (
            <button
              key={stage.num}
              type="button"
              onClick={onOpenResults}
              disabled={disabled}
              aria-haspopup="dialog"
              aria-label={`View submitted innovations from the ${stage.title} card`}
              className="relative rounded-xl border border-border/70 bg-card p-4 text-left transition duration-200 hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-wait disabled:hover:translate-y-0"
              style={{ borderTopWidth: '3px', borderTopColor: stage.hex }}
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: stage.hex + '15' }}
                >
                  <Icon className="w-5 h-5" style={{ color: stage.hex }} />
                </div>
                <div className="min-w-0">
                  <div className="mb-1 flex items-start gap-2">
                    <span
                      className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white"
                      style={{ backgroundColor: stage.hex }}
                    >
                      {stage.num}
                    </span>
                    <h4 className="text-sm font-semibold leading-snug text-foreground">
                      {stage.title}
                    </h4>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{stage.desc}</p>
                </div>
                <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              </div>
            </button>
          );
        })}
      </div>

      <p className="mt-6 text-center text-sm font-semibold text-primary">
        Because Every Great Innovation Should Go Places.
      </p>
    </div>
  );
}
