import { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '@/api/client';
import { manuscriptUrl } from '@/lib/manuscriptUrl';
import { useAuth } from '@/lib/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, CheckCircle2, XCircle, User, MapPin, Calendar, Upload, LoaderCircle } from 'lucide-react';

export default function InnovationDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [innovation, setInnovation] = useState(null);
  const [framework, setFramework] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const revisionInput = useRef(null);
  const [revising, setRevising] = useState(false);
  const [revisionError, setRevisionError] = useState('');

  useEffect(() => {
    Promise.all([api.innovations.get(id), api.framework.get()])
      .then(([record, frameworkData]) => {
        setInnovation(record);
        setFramework(frameworkData);
      })
      .catch((requestError) => setError(requestError.message || 'Unable to load this innovation.'))
      .finally(() => setLoading(false));
  }, [id]);

  async function reviseManuscript(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setRevising(true);
    setRevisionError('');
    try {
      setInnovation(await api.reviseManuscript(id, file));
    } catch (requestError) {
      setRevisionError(requestError.message || 'Unable to revise the manuscript.');
    } finally {
      event.target.value = '';
      setRevising(false);
    }
  }

  if (loading) {
    return <div className="p-8 flex justify-center"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>;
  }

  if (!innovation) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">{error || 'Innovation not found.'}</p>
        <Button asChild variant="outline" className="mt-4"><Link to="/innovations">Back to Innovations</Link></Button>
      </div>
    );
  }

  const hasAssessment = innovation.framework_score != null;
  const canEditRatings = hasAssessment && (user?.role === 'admin'
    || (innovation.created_by_id === user?.id && innovation.status !== 'validated'));
  const level = framework?.levels.find((item) => item.title === innovation.framework_level);

  return (
    <div className="page-shell max-w-6xl space-y-6">
      <Link to="/innovations" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="w-4 h-4" /> Back to Innovations
      </Link>

      <Card className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className={`px-2 py-0.5 rounded text-xs font-medium border ${innovation.learning_focus === 'numeracy'
                ? 'bg-teal-50 text-teal-700 border-teal-200'
                : 'bg-purple-50 text-purple-700 border-purple-200'}`}>
                {innovation.learning_focus?.toUpperCase()}
              </span>
              <span className="text-xs text-muted-foreground">{innovation.key_stage} · {innovation.grade_levels}</span>
              {!hasAssessment ? (
                <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded">Awaiting framework assessment</span>
              ) : innovation.is_scalable ? (
                <span className="inline-flex items-center gap-1 text-xs bg-teal-50 text-teal-700 px-2 py-0.5 rounded">
                  <CheckCircle2 className="w-3 h-3" /> {innovation.framework_level}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs bg-rose-50 text-rose-600 px-2 py-0.5 rounded">
                  <XCircle className="w-3 h-3" /> {innovation.framework_level}
                </span>
              )}
              {innovation.status === 'validated' && hasAssessment && (
                <span className="text-xs border rounded px-2 py-0.5">Panel validated</span>
              )}
            </div>
            <h1 className="text-xl font-bold text-foreground leading-snug">{innovation.title}</h1>
            {innovation.summary && <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{innovation.summary}</p>}
            <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-muted-foreground">
              {innovation.author && <span className="flex items-center gap-1"><User className="w-3 h-3" /> {innovation.author}</span>}
              {innovation.school && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {innovation.school}</span>}
              {innovation.district && <span>· {innovation.district}</span>}
              {innovation.framework_assessed_at && (
                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Assessed {new Date(innovation.framework_assessed_at).toLocaleDateString()}</span>
              )}
            </div>
          </div>
          <div className="text-center flex-shrink-0">
            <div className={`text-4xl font-bold ${innovation.is_scalable ? 'text-teal-600' : hasAssessment ? 'text-rose-600' : 'text-muted-foreground'}`}>
              {innovation.framework_score ?? '—'}
            </div>
            <div className="text-xs text-muted-foreground">{hasAssessment ? 'Scalability score / 100' : 'Not yet assessed'}</div>
            {innovation.evaluation_method === 'automatic_manuscript_review' && <div className="mt-1 text-xs text-muted-foreground">Automatically rated from the manuscript</div>}
          </div>
        </div>
        {innovation.manuscript_file_url && (
          <Button asChild variant="outline" className="mt-4 text-sm">
            <a href={manuscriptUrl(innovation.manuscript_file_url)} target="_blank" rel="noopener noreferrer">
              <Download className="w-4 h-4 mr-2" /> View Manuscript
            </a>
          </Button>
        )}
        {canEditRatings && <Button asChild variant="outline" className="ml-2 mt-4 text-sm"><Link to={`/evaluations?edit=${innovation.id}`}>Edit ratings</Link></Button>}
        {canEditRatings && innovation.manuscript_file_url && <>
          <input ref={revisionInput} type="file" accept=".pdf,.docx,.txt,.md" className="hidden" onChange={reviseManuscript} aria-label="Select revised manuscript" />
          <Button type="button" variant="outline" className="ml-2 mt-4 text-sm" disabled={revising} onClick={() => revisionInput.current?.click()}>
            {revising ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} {revising ? 'Updating assessment...' : 'Upload revision'}
          </Button>
        </>}
        {revisionError && <p role="alert" className="mt-3 text-sm text-rose-700">{revisionError}</p>}
      </Card>

      {hasAssessment ? (
        <>
          <Card className="p-5">
            <h2 className="font-semibold text-sm mb-4">Framework score breakdown</h2>
            <div className="space-y-4">
              {framework?.criteria.map((criterion) => {
                const rating = innovation.framework_ratings?.[criterion.key];
                const contribution = rating * criterion.weight / 5;
                return (
                  <div key={criterion.key}>
                    <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
                      <span className="font-medium">{criterion.label}</span>
                      <span>{rating}/5 × {criterion.weight}% = <strong>{contribution} points</strong></span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden mt-2">
                      <div className="h-full rounded-full bg-teal-500" style={{ width: `${rating * 20}%` }} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{framework.ratings[rating]}</p>
                  </div>
                );
              })}
              <div className="pt-3 border-t flex justify-between font-semibold text-sm">
                <span>Final scalability score</span><span>{innovation.framework_score}/100</span>
              </div>
            </div>
          </Card>
          <Card className="p-5">
            <h2 className="font-semibold text-sm mb-2">Classification</h2>
            <p className="font-medium">{innovation.framework_level}</p>
            {level && <p className="text-sm text-muted-foreground mt-1">{level.description}</p>}
          </Card>
        </>
      ) : (
        <Card className="p-6 text-center">
          <h2 className="font-semibold text-sm">Framework assessment pending</h2>
          <p className="text-sm text-muted-foreground mt-1">An administrator must enter all five ratings before this innovation receives a scalability decision.</p>
          <Button asChild className="mt-4"><Link to="/evaluations">Open Assessments</Link></Button>
        </Card>
      )}

      {innovation.framework_notes && (
        <Card className="p-5"><h2 className="font-semibold text-sm mb-2">Rating notes and evidence</h2><p className="text-sm whitespace-pre-line">{innovation.framework_notes}</p></Card>
      )}
      {innovation.recommendation && hasAssessment && (
        <Card className="p-5"><h2 className="font-semibold text-sm mb-2">Recommendation</h2><p className="text-sm">{innovation.recommendation}</p></Card>
      )}
    </div>
  );
}
