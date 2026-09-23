import { useState, useEffect } from 'react';
import { api } from '@/api/client';
import { useAuth } from '@/lib/AuthContext';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Search, Loader2, Layers3, GraduationCap } from 'lucide-react';
import InnovationCard from '@/components/InnovationCard';
import { gradeOptionsByStage, keyStageLabels } from '@/lib/innovationMetadata';

const keyStages = Object.keys(keyStageLabels);

function matchesGrade(innovation, selectedGrade) {
  if (selectedGrade === 'all') return true;
  const scope = innovation.grade_levels || '';
  if (innovation.key_stage === 'ALL') return scope === selectedGrade;
  if (scope === 'All grade levels' || scope === 'School-wide') return true;

  const gradeNumber = Number(selectedGrade.replace('Grade ', ''));
  const range = scope.match(/grades?\s*(\d{1,2})\s*[-–]\s*(\d{1,2})/i);
  if (range && gradeNumber >= Number(range[1]) && gradeNumber <= Number(range[2])) return true;
  return [...scope.matchAll(/\b\d{1,2}\b/g)].some((match) => Number(match[0]) === gradeNumber);
}

export default function Innovations() {
  const { user } = useAuth();
  const [innovations, setInnovations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [focusFilter, setFocusFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [stageFilter, setStageFilter] = useState('all');
  const [gradeFilter, setGradeFilter] = useState('all');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.innovations.list({ sort: '-created_at', limit: 200 })
      .then((data) => {
        setInnovations(data);
        setLoading(false);
      })
      .catch((requestError) => {
        setError(requestError.message || 'Unable to load innovations.');
        setLoading(false);
      });
  }, []);

  const baseFiltered = innovations.filter((inv) => {
    if (search && !inv.title?.toLowerCase().includes(search.toLowerCase()) && !inv.author?.toLowerCase().includes(search.toLowerCase()))
      return false;
    if (focusFilter !== 'all' && inv.learning_focus !== focusFilter) return false;
    const awaitingEvaluation = inv.framework_score == null;
    if (statusFilter === 'pending' && !awaitingEvaluation) return false;
    if (statusFilter === 'scalable' && (awaitingEvaluation || !inv.is_scalable)) return false;
    if (statusFilter === 'not-scalable' && (awaitingEvaluation || inv.is_scalable)) return false;
    if (statusFilter === 'validated' && (awaitingEvaluation || inv.status !== 'validated')) return false;
    return true;
  });

  const categories = [
    { key: 'all', label: 'All key stages', scope: 'Every grade and school-wide', count: baseFiltered.length },
    ...keyStages.map((key) => ({
      key,
      label: key === 'ALL' ? 'School-wide' : key,
      scope: key === 'ALL' ? 'All key stages and personnel' : keyStageLabels[key].split('—')[1]?.trim() || '',
      count: baseFiltered.filter((innovation) => innovation.key_stage === key).length,
    })),
  ];
  const uncategorizedCount = baseFiltered.filter((innovation) => !keyStages.includes(innovation.key_stage)).length;
  if (uncategorizedCount) categories.push({ key: 'uncategorized', label: 'Uncategorized', scope: 'Stage not yet recorded', count: uncategorizedCount });

  const gradeOptions = stageFilter === 'ALL'
    ? gradeOptionsByStage.ALL
    : (gradeOptionsByStage[stageFilter] || []).filter((grade) => /^Grade \d+$/.test(grade));
  const selectedStageInnovations = baseFiltered.filter((innovation) => innovation.key_stage === stageFilter);

  const filtered = baseFiltered.filter((innovation) => {
    if (stageFilter === 'uncategorized') return !keyStages.includes(innovation.key_stage);
    return (stageFilter === 'all' || innovation.key_stage === stageFilter) && matchesGrade(innovation, gradeFilter);
  });

  function chooseStage(stage) {
    setStageFilter(stage);
    setGradeFilter('all');
  }

  function renderInnovationGroup(stage, group) {
    if (group.length === 0) return null;
    const title = stage === 'ALL' ? 'School-wide / All key stages' : stage === 'uncategorized' ? 'Uncategorized' : keyStageLabels[stage];
    const headingId = `stage-${stage.toLowerCase()}-heading`;
    const focusGroups = [
      { key: 'literacy', title: 'Literacy Innovations', description: 'Reading, language, and literacy development.', items: group.filter((innovation) => innovation.learning_focus === 'literacy') },
      { key: 'numeracy', title: 'Numeracy Innovations', description: 'Mathematics, computation, and numeracy development.', items: group.filter((innovation) => innovation.learning_focus === 'numeracy') },
      { key: 'other', title: 'Other Learning Focus', description: 'Innovations outside the literacy and numeracy categories.', items: group.filter((innovation) => !['literacy', 'numeracy'].includes(innovation.learning_focus)) },
    ];

    return (
      <section aria-labelledby={headingId} className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 id={headingId} className="text-lg font-semibold text-foreground">
              {title}
            </h2>
            <p className="text-sm text-muted-foreground">{stage === 'uncategorized' ? 'Set a key stage to place these innovations in a grade category.' : `${group.length} submitted ${group.length === 1 ? 'innovation' : 'innovations'}`}</p>
          </div>
          <span className="rounded-full border border-primary/20 bg-primary/5 px-2.5 py-1 text-xs font-medium text-primary">
            {group.length} {group.length === 1 ? 'innovation' : 'innovations'}
          </span>
        </div>
        <div className="space-y-6">
          {focusGroups.filter((focus) => focus.items.length > 0).map((focus) => (
            <section key={focus.key} aria-labelledby={`${headingId}-${focus.key}`} className="space-y-3">
              <div className="flex flex-wrap items-end justify-between gap-2 border-b pb-2">
                <div>
                  <h3 id={`${headingId}-${focus.key}`} className="font-semibold">{focus.title}</h3>
                  <p className="text-xs text-muted-foreground">{focus.description}</p>
                </div>
                <span className="text-xs text-muted-foreground">{focus.items.length} {focus.items.length === 1 ? 'innovation' : 'innovations'}</span>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {focus.items.map((inv) => (
                  <InnovationCard
                    key={inv.id}
                    innovation={inv}
                    onDelete={user?.role === 'admin' || (inv.created_by_id === user?.id && inv.status !== 'validated' && (inv.framework_score == null || ['automatic_manuscript_review', 'manual_owner_correction'].includes(inv.evaluation_method))) ? setDeleteTarget : undefined}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      </section>
    );
  }

  async function deleteInnovation() {
    if (!deleteTarget) return;
    setDeleting(true);
    setError('');

    try {
      await api.innovations.remove(deleteTarget.id);
      setInnovations((current) => current.filter((innovation) => innovation.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (requestError) {
      setError(requestError.message || 'Unable to delete the innovation.');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="page-shell space-y-6">
      <div>
        <p className="page-eyebrow">Innovation portfolio</p>
        <h1 className="page-title">All Innovations</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Browse manuscripts by key stage and grade, then refine by learning focus or assessment status.
        </p>
      </div>

      <section aria-labelledby="key-stage-library-heading" className="space-y-3">
        <div>
          <p className="page-eyebrow">Categorical library</p>
          <h2 id="key-stage-library-heading" className="text-lg font-semibold">Key stages</h2>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {categories.map((category) => (
            <button
              key={category.key}
              type="button"
              onClick={() => chooseStage(category.key)}
              aria-pressed={stageFilter === category.key}
              className={`min-w-0 rounded-xl border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${stageFilter === category.key ? 'border-primary bg-primary/10 text-primary' : 'bg-card hover:border-primary/40 hover:bg-muted/30'}`}
            >
              <span className="flex items-start justify-between gap-2"><Layers3 className="h-4 w-4 shrink-0" aria-hidden="true" /><span className="text-lg font-semibold">{category.count}</span></span>
              <span className="mt-3 block text-sm font-semibold">{category.label}</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">{category.scope}</span>
            </button>
          ))}
        </div>
        {gradeOptions.length > 0 && (
          <div className="flex flex-wrap items-center gap-2" aria-label="Grade categories">
            <GraduationCap className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            {['all', ...gradeOptions].map((grade) => (
              <button
                key={grade}
                type="button"
                onClick={() => setGradeFilter(grade)}
                aria-pressed={gradeFilter === grade}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${gradeFilter === grade ? 'border-primary bg-primary text-primary-foreground' : 'bg-card hover:border-primary/40'}`}
              >
                {grade === 'all' ? (stageFilter === 'ALL' ? 'All scopes' : 'All grades') : grade}
                <span className="ml-1 opacity-70">{grade === 'all' ? selectedStageInnovations.length : selectedStageInnovations.filter((innovation) => matchesGrade(innovation, grade)).length}</span>
              </button>
            ))}
          </div>
        )}
      </section>

      {error && (
        <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title or author…"
            aria-label="Search innovations by title or author"
            className="pl-9"
          />
        </div>
        <Select value={focusFilter} onValueChange={setFocusFilter}>
          <SelectTrigger className="w-full sm:w-40" aria-label="Learning focus filter">
            <SelectValue placeholder="Learning Focus" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Focus</SelectItem>
            <SelectItem value="numeracy">Numeracy</SelectItem>
            <SelectItem value="literacy">Literacy</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40" aria-label="Evaluation status filter">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Awaiting Assessment</SelectItem>
            <SelectItem value="scalable">Scalable</SelectItem>
            <SelectItem value="not-scalable">Not Yet Recommended</SelectItem>
            <SelectItem value="validated">Panel Validated</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : error ? null : filtered.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-sm text-muted-foreground">No innovations match your filters.</p>
        </Card>
      ) : (
        <div className="space-y-8">
          {[...keyStages, 'uncategorized'].map((stage) => renderInnovationGroup(
            stage,
            filtered.filter((innovation) => stage === 'uncategorized'
              ? !keyStages.includes(innovation.key_stage)
              : innovation.key_stage === stage),
          ))}
        </div>
      )}

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this innovation?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes “{deleteTarget?.title}” and its evaluation record. The uploaded manuscript file will remain in storage.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteInnovation} disabled={deleting} className="bg-rose-600 hover:bg-rose-700">
              {deleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Delete Innovation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
