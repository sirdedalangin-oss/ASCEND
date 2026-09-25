import { ArrowUpRight } from 'lucide-react';

const colorMap = {
  teal: { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200', accent: 'bg-teal-600' },
  coral: { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200', accent: 'bg-sky-600' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', accent: 'bg-amber-500' },
  blue: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', accent: 'bg-indigo-600' },
  purple: { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200', accent: 'bg-violet-600' },
};

export default function StatCard({ icon: Icon, label, value, sublabel, color = 'teal', onClick, disabled = false }) {
  const c = colorMap[color] || colorMap.teal;
  return (
    <button type="button" onClick={onClick} disabled={disabled} aria-haspopup="dialog" aria-label={`View ${label} results`} className="group relative flex min-h-[154px] min-w-0 w-full flex-col overflow-hidden rounded-xl border border-border/70 bg-card p-5 text-left text-card-foreground shadow-[0_10px_28px_-24px_rgba(21,56,67,0.55)] transition duration-200 hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-wait disabled:hover:translate-y-0 disabled:hover:shadow-none">
      <span className={`absolute inset-x-0 top-0 h-1 ${c.accent}`} aria-hidden="true" />
      <div className="flex items-start justify-between gap-3">
        <p className="min-w-0 text-sm font-medium leading-5 text-muted-foreground">{label}</p>
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${c.bg} ${c.border}`}>
          <Icon className={`h-5 w-5 ${c.text}`} aria-hidden="true" />
        </span>
      </div>
      <p className="mt-2 text-3xl font-semibold tracking-tight tabular-nums text-foreground sm:text-[2rem]">{value}</p>
      <div className="mt-auto flex w-full items-end justify-between gap-2 pt-2"><p className="text-xs leading-4 text-muted-foreground">{sublabel}</p><ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" aria-hidden="true" /></div>
    </button>
  );
}
