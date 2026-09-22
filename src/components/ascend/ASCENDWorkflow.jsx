import { PieChart, Target, ShieldCheck, ShieldMinus, BookOpen, TrendingUp } from 'lucide-react';

const stages = [
  { num: 1, title: 'Innovation Identification', desc: 'Discover promising educational practices and innovations.', icon: PieChart, hex: '#00BFA5' },
  { num: 2, title: 'Innovation Validation', desc: 'Validate its effectiveness, scalability, and replicability.', icon: Target, hex: '#AA00FF' },
  { num: 3, title: 'Readiness Assessment', desc: 'Assess readiness of systems, resources, and stakeholders.', icon: ShieldCheck, hex: '#FFAB00' },
  { num: 4, title: 'Institutionalization', desc: 'Integrate the innovation into policies, systems, and everyday practice.', icon: ShieldMinus, hex: '#EC407A' },
  { num: 5, title: 'Scaling and Expansion', desc: 'Expand successful practices to more schools and learners.', icon: BookOpen, hex: '#F57C00' },
  { num: 6, title: 'Sustainability & Continuous Improvement', desc: 'Ensure long-term impact through monitoring, reflection, and ongoing enhancement.', icon: TrendingUp, hex: '#1976D2' },
];

export default function ASCENDWorkflow() {
  return (
    <div>
      <div className="text-center mb-6">
        <div className="inline-flex flex-col items-center">
          <div
            className="w-40 h-40 rounded-full flex flex-col items-center justify-center text-center px-4 shadow-lg"
            style={{ background: 'linear-gradient(135deg, #FFD29D, #FF81B8)' }}
          >
            <span className="font-bold text-lg leading-tight" style={{ color: '#1A237E' }}>ASCEND</span>
            <span className="text-[10px] leading-tight mt-1" style={{ color: '#5E35B1' }}>
              Assessment of Scalable Education Novelties and Development
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {stages.map((stage) => {
          const Icon = stage.icon;
          return (
            <div
              key={stage.num}
              className="relative bg-card rounded-lg border border-border/60 p-4 pl-5 hover:shadow-md transition-shadow"
              style={{ borderLeftWidth: '4px', borderLeftColor: stage.hex }}
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: stage.hex + '15' }}
                >
                  <Icon className="w-5 h-5" style={{ color: stage.hex }} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white"
                      style={{ backgroundColor: stage.hex }}
                    >
                      {stage.num}
                    </span>
                    <h4 className="font-semibold text-sm text-foreground uppercase tracking-wide leading-tight">
                      {stage.title}
                    </h4>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{stage.desc}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-center mt-6 text-sm font-semibold" style={{ color: '#1A237E' }}>
        Because Every Great Innovation Should Go Places.
      </p>
    </div>
  );
}
