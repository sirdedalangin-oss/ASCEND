import { useEffect, useState } from 'react';
import { api } from '@/api/client';
import { Card } from '@/components/ui/card';
import FrameworkEmphasis from '@/components/ascend/FrameworkEmphasis';
import { Loader2 } from 'lucide-react';

export default function Criteria() {
  const [framework, setFramework] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.framework.get()
      .then(setFramework)
      .catch((requestError) => setError(requestError.message || 'Unable to load the scalability framework.'));
  }, []);

  if (!framework && !error) {
    return <div className="p-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="page-shell max-w-6xl space-y-6">
      <div>
        <p className="page-eyebrow">Assessment standard</p>
        <h1 className="page-title">Innovation Scalability Framework</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Administrators enter a rating from 1 to 5 for each criterion. The framework determines the final score and classification.
        </p>
      </div>

      {error && <Card className="p-5 text-rose-700">{error}</Card>}

      {framework && (
        <>
          <Card className="p-5">
            <h2 className="font-semibold mb-4">Assessment criteria</h2>
            <div className="space-y-3">
              {framework.criteria.map((criterion) => (
                <div key={criterion.key} className="flex items-center justify-between gap-4 border-b border-border/60 pb-3 last:border-0 last:pb-0">
                  <span className="text-sm">{criterion.label}</span>
                  <span className="font-semibold text-sm">{criterion.weight}%</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="font-semibold mb-3">Rating scale</h2>
            <div className="space-y-3">
              {Object.entries(framework.ratings).sort(([a], [b]) => Number(b) - Number(a)).map(([rating, description]) => (
                <div key={rating} className="flex items-start gap-3 text-sm">
                  <span className="font-bold text-primary w-5 flex-shrink-0">{rating}</span>
                  <p className="text-muted-foreground"><FrameworkEmphasis text={description} /></p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5 bg-teal-50 border-teal-200">
            <h2 className="font-semibold text-teal-800 mb-1">Decision rule</h2>
            <p className="text-sm text-teal-800">
              Final scalability score = sum of each rating multiplied by its criterion weight, divided by 5.
              A score of <strong>{framework.threshold} or higher</strong> is classified as a Scalable Innovation.
            </p>
          </Card>

          <Card className="p-5">
            <h2 className="font-semibold mb-4">Classification levels</h2>
            <div className="space-y-4">
              {framework.levels.map((level) => (
                <div key={level.title} className="border-b border-border/60 pb-4 last:border-0 last:pb-0">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="font-medium text-sm">{level.title}</h3>
                    <span className="text-xs font-semibold text-primary">
                      {level.minimum === 0 ? 'Below 75' : `${level.minimum}–${level.maximum}`}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1"><FrameworkEmphasis text={level.description} /></p>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
