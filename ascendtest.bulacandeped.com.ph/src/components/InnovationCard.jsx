import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowUpRight, CheckCircle2, Clock3, MapPin, Trash2, User } from 'lucide-react';

const focusStyles = {
  numeracy: 'bg-teal-50 text-teal-700 border-teal-200',
  literacy: 'bg-violet-50 text-violet-700 border-violet-200',
};

export default function InnovationCard({ innovation, onDelete }) {
  const score = innovation.framework_score;
  const scoreColor = score >= 75 ? 'text-teal-700' : score >= 60 ? 'text-amber-700' : 'text-rose-700';
  const awaitingEvaluation = score == null;
  const validated = innovation.status === 'validated';

  let decisionBadge;
  if (awaitingEvaluation) {
    decisionBadge = (
      <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-600">
        <Clock3 className="w-3 h-3 mr-1" /> Awaiting Assessment
      </Badge>
    );
  } else if (innovation.is_scalable) {
    decisionBadge = (
      <Badge className="bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-50">
        <CheckCircle2 className="w-3 h-3 mr-1" /> {validated ? 'Validated · ' : ''}{innovation.framework_level}
      </Badge>
    );
  } else {
    decisionBadge = (
      <Badge variant="outline" className="border-rose-200 bg-rose-50 text-rose-700">
        {innovation.framework_level}
      </Badge>
    );
  }

  return (
    <Card className="group flex h-full min-w-0 flex-col overflow-hidden border-border/70 p-5 shadow-[0_10px_28px_-24px_rgba(21,56,67,0.5)] transition duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${focusStyles[innovation.learning_focus] || 'border-slate-200 bg-slate-50 text-slate-600'}`}>
          {innovation.learning_focus || 'Other focus'}
        </span>
        {onDelete && <Button type="button" variant="ghost" size="icon" onClick={() => onDelete(innovation)} className="-mr-1 -mt-1 h-8 w-8 text-muted-foreground hover:bg-rose-50 hover:text-rose-700" aria-label={`Delete ${innovation.title}`} title="Delete innovation"><Trash2 className="h-4 w-4" /></Button>}
      </div>

      <Link to={`/innovations/${innovation.id}`} className="mt-4 block rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
        <h3 className="line-clamp-2 min-h-[3rem] text-base font-semibold leading-6 text-foreground transition-colors group-hover:text-primary">{innovation.title}</h3>
        {innovation.summary && <p className="mt-2 line-clamp-2 text-sm leading-5 text-muted-foreground">{innovation.summary}</p>}
      </Link>

      <div className="mt-auto pt-5">
        <div className="flex min-w-0 flex-col gap-1.5 text-xs text-muted-foreground">
          {innovation.author && <span className="flex min-w-0 items-center gap-2"><User className="h-3.5 w-3.5 shrink-0" aria-hidden="true" /><span className="truncate" title={innovation.author}>{innovation.author}</span></span>}
          {innovation.school && <span className="flex min-w-0 items-center gap-2"><MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" /><span className="truncate" title={innovation.school}>{innovation.school}</span></span>}
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border/70 pt-3">
          <div className="min-w-0">{decisionBadge}</div>
          {score != null ? <span className="whitespace-nowrap text-xs text-muted-foreground"><span className={`text-lg font-bold ${scoreColor}`}>{score}</span> / 100</span> : <Link to={`/innovations/${innovation.id}`} className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">View record <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" /></Link>}
        </div>
      </div>
    </Card>
  );
}
