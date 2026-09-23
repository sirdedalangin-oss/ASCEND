import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Clock3, FileText, MapPin, Trash2, User } from 'lucide-react';

const focusStyles = {
  numeracy: 'bg-teal-50 text-teal-700 border-teal-200',
  literacy: 'bg-purple-50 text-purple-700 border-purple-200',
};

export default function InnovationCard({ innovation, onDelete }) {
  const score = innovation.framework_score;
  const scoreColor = score >= 75 ? 'text-teal-600' : score >= 60 ? 'text-amber-600' : 'text-rose-600';
  const awaitingEvaluation = score == null;
  const validated = innovation.status === 'validated';

  let decisionBadge;
  if (awaitingEvaluation) {
    decisionBadge = (
      <Badge variant="outline" className="text-muted-foreground">
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
    <Card className="p-5 h-full hover:shadow-md transition-shadow border-border/60 group">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className={`px-2 py-0.5 rounded text-xs font-medium border ${focusStyles[innovation.learning_focus] || ''}`}>
            {innovation.learning_focus?.toUpperCase()}
          </div>
          <div className="flex items-center gap-1.5">
            {decisionBadge}
            {onDelete && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => onDelete(innovation)}
                className="h-7 w-7 text-muted-foreground hover:text-rose-700 hover:bg-rose-50"
                aria-label={`Delete ${innovation.title}`}
                title="Delete innovation"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        </div>

        <Link to={`/innovations/${innovation.id}`} className="block">
          <h3 className="font-semibold text-foreground leading-snug mb-2 line-clamp-2 group-hover:text-primary transition-colors">
            {innovation.title}
          </h3>

          {innovation.summary && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{innovation.summary}</p>
          )}

          <div className="flex items-center justify-between pt-3 border-t border-border/50">
            <div className="flex items-center gap-3 text-xs text-muted-foreground min-w-0">
              {innovation.author && (
                <span className="flex items-center gap-1 truncate">
                  <User className="w-3 h-3" /> {innovation.author}
                </span>
              )}
              {innovation.school && (
                <span className="flex items-center gap-1 truncate">
                  <MapPin className="w-3 h-3" /> {innovation.school}
                </span>
              )}
            </div>
            {score != null && (
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                <span className={`font-bold text-lg ${scoreColor}`}>{score}</span>
                <span className="text-xs text-muted-foreground">/100</span>
              </div>
            )}
          </div>
        </Link>
    </Card>
  );
}
