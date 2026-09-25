import { useState, useEffect } from 'react';
import { api } from '@/api/client';
import { useAuth } from '@/lib/AuthContext';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { ArrowRight, BookOpen, Filter, GraduationCap, Layers3, Lightbulb, Loader2, RotateCcw, Search, Sparkles } from 'lucide-react';
import InnovationCard from '@/components/InnovationCard';
import { gradeOptionsByStage, keyStageLabels } from '@/lib/innovationMetadata';

const keyStages = Object.keys(keyStageLabels);
const stageDetails = {
  KS1: { label: 'Key Stage 1', scope: 'Grades 1-3' },
  KS2: { label: 'Key Stage 2', scope: 'Grades 4-6' },
  KS3: { label: 'Key Stage 3', scope: 'Grades 7-10' },
  KS4: { label: 'Key Stage 4', scope: 'Grades 11-12' },
  ALL: { label: 'School-wide', scope: 'All stages and personnel' },
};
const focusDetails = {
  literacy: { title: 'Literacy', description: 'Reading, language, and literacy development', icon: BookOpen, color: 'text-violet-700', surface: 'bg-violet-50', border: 'border-violet-200' },
  numeracy: { title: 'Numeracy', description: 'Mathematics, computation, and numeracy development', icon: Layers3, color: 'text-teal-700', surface: 'bg-teal-50', border: 'border-teal-200' },
  other: { title: 'Other learning focus', description: 'Ideas across other learning areas', icon: Sparkles, color: 'text-amber-700', surface: 'bg-amber-50', border: 'border-amber-200' },
};

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

  const assessedCount = innovations.filter((innovation) => innovation.framework_score != null).length;
  const scalableCount = innovations.filter((innovation) => innovation.framework_score != null && innovation.is_scalable).length;
  const baseFiltered = innovations.filter((inv) => {
    const query = search.trim().toLowerCase();
    if (query && !inv.title?.toLowerCase().includes(query) && !inv.author?.toLowerCase().includes(query))
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
    { key: 'all', label: 'All stages', scope: 'Browse the full portfolio', count: baseFiltered.length },
    ...keyStages.map((key) => ({
      key,
      ...stageDetails[key],
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
  const hasActiveFilters = Boolean(search.trim()) || focusFilter !== 'all' || statusFilter !== 'all' || stageFilter !== 'all' || gradeFilter !== 'all';

  function chooseStage(stage) {
    setStageFilter(stage);
    setGradeFilter('all');
  }

  function clearFilters() {
    setSearch('');
    setFocusFilter('all');
    setStatusFilter('all');
    setStageFilter('all');
    setGradeFilter('all');
  }

  function renderInnovationGroup(stage, group) {
    if (group.length === 0) return null;
    const title = stage === 'ALL' ? 'School-wide / All key stages' : stage === 'uncategorized' ? 'Uncategorized' : keyStageLabels[stage];
    const headingId = `stage-${stage.toLowerCase()}-heading`;
    const focusGroups = [
      { key: 'literacy', items: group.filter((innovation) => innovation.learning_focus === 'literacy') },
      { key: 'numeracy', items: group.filter((innovation) => innovation.learning_focus === 'numeracy') },
      { key: 'other', items: group.filter((innovation) => !['literacy', 'numeracy'].includes(innovation.learning_focus)) },
    ];

    return (
      <section aria-labelledby={headingId} className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border/80 pb-3">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><GraduationCap className="h-5 w-5" aria-hidden="true" /></span>
            <div>
              <h2 id={headingId} className="text-lg font-semibold text-foreground">{title}</h2>
              <p className="text-xs text-muted-foreground">{stage === 'uncategorized' ? 'Awaiting a key stage category' : stageDetails[stage]?.scope}</p>
            </div>
          </div>
          <span className="rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
            {group.length} {group.length === 1 ? 'innovation' : 'innovations'}
          </span>
        </div>
        <div className="space-y-7">
          {focusGroups.filter((focus) => focus.items.length > 0).map((focus) => {
            const detail = focusDetails[focus.key];
            const Icon = detail.icon;
            return <section key={focus.key} aria-labelledby={`${headingId}-${focus.key}`} className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className={`flex h-8 w-8 items-center justify-center rounded-lg border ${detail.surface} ${detail.border} ${detail.color}`}><Icon className="h-4 w-4" aria-hidden="true" /></span>
                  <div><h3 id={`${headingId}-${focus.key}`} className="text-sm font-semibold">{detail.title}</h3><p className="text-xs text-muted-foreground">{detail.description}</p></div>
                </div>
                <span className="text-xs font-medium text-muted-foreground">{focus.items.length} {focus.items.length === 1 ? 'record' : 'records'}</span>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {focus.items.map((inv) => (
                  <InnovationCard
                    key={inv.id}
                    innovation={inv}
                    onDelete={user?.role === 'admin' || (inv.created_by_id === user?.id && inv.status !== 'validated' && (inv.framework_score == null || ['automatic_manuscript_review', 'manual_owner_correction'].includes(inv.evaluation_method))) ? setDeleteTarget : undefined}
                  />
                ))}
              </div>
            </section>;
          })}
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
    <div className="page-shell space-y-7">
      <header className="relative overflow-hidden rounded-2xl bg-[#173e4b] px-5 py-7 text-white shadow-[0_18px_45px_-32px_rgba(14,48,59,0.8)] sm:px-7 sm:py-8">
        <span className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full border-[46px] border-white/[0.04]" aria-hidden="true" />
        <span className="pointer-events-none absolute bottom-0 right-1/3 h-24 w-48 rounded-full bg-cyan-300/[0.06] blur-3xl" aria-hidden="true" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="mb-3 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-cyan-100/75"><Lightbulb className="h-4 w-4" /> Innovation portfolio</p>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">All Innovations</h1>
            <p className="mt-3 text-sm leading-6 text-white/70">Explore submitted manuscripts by key stage, grade level, learning focus, and assessment status.</p>
          </div>
          {!loading && !error && (
            <div className="flex w-full shrink-0 overflow-hidden rounded-xl border border-white/15 bg-white/[0.07] lg:w-[360px]" aria-label="Innovation portfolio summary">
              <div className="min-w-0 flex-1 px-3 py-3.5 sm:px-4"><div className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/55">Submitted</div><div className="mt-1 text-2xl font-semibold">{innovations.length}</div></div>
              <div className="min-w-0 flex-1 border-x border-white/10 px-3 py-3.5 sm:px-4"><div className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/55">Assessed</div><div className="mt-1 text-2xl font-semibold">{assessedCount}</div></div>
              <div className="min-w-0 flex-1 px-3 py-3.5 sm:px-4"><div className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/55">Scalable</div><div className="mt-1 text-2xl font-semibold text-cyan-100">{scalableCount}</div></div>
            </div>
          )}
        </div>
      </header>

      <section aria-labelledby="key-stage-library-heading" className="space-y-4">
        <div>
          <p className="page-eyebrow mb-1"><Layers3 className="h-4 w-4" /> Browse by category</p>
          <h2 id="key-stage-library-heading" className="text-xl font-semibold">Key stages</h2>
          <p className="mt-1 text-sm text-muted-foreground">Choose a stage to narrow the portfolio by grade level.</p>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          {categories.map((category) => (
            <button
              key={category.key}
              type="button"
              onClick={() => chooseStage(category.key)}
              aria-pressed={stageFilter === category.key}
              className={`group relative flex min-h-[132px] min-w-0 flex-col overflow-hidden rounded-2xl border p-4 text-left shadow-[0_10px_28px_-24px_rgba(21,56,67,0.5)] transition duration-200 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${stageFilter === category.key ? 'border-primary bg-primary text-primary-foreground' : 'bg-card hover:border-primary/40'}`}
            >
              <span className="flex w-full items-start justify-between gap-2"><Layers3 className={`h-5 w-5 shrink-0 ${stageFilter === category.key ? 'text-cyan-100' : 'text-primary'}`} aria-hidden="true" /><span className="text-2xl font-semibold leading-none">{category.count}</span></span>
              <span className="mt-auto block pt-5 text-sm font-semibold">{category.label}</span>
              <span className={`mt-1 block text-xs leading-4 ${stageFilter === category.key ? 'text-white/75' : 'text-muted-foreground'}`}>{category.scope}</span>
            </button>
          ))}
        </div>
        {gradeOptions.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-card px-3 py-3 sm:px-4" aria-label="Grade categories">
            <span className="mr-1 inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground"><GraduationCap className="h-4 w-4" aria-hidden="true" /> Grade</span>
            {['all', ...gradeOptions].map((grade) => (
              <button
                key={grade}
                type="button"
                onClick={() => setGradeFilter(grade)}
                aria-pressed={gradeFilter === grade}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${gradeFilter === grade ? 'border-primary bg-primary text-primary-foreground' : 'bg-background hover:border-primary/40 hover:bg-primary/5'}`}
              >
                {grade === 'all' ? (stageFilter === 'ALL' ? 'All scopes' : 'All grades') : grade}
                <span className="ml-1 opacity-70">{grade === 'all' ? selectedStageInnovations.length : selectedStageInnovations.filter((innovation) => matchesGrade(innovation, grade)).length}</span>
              </button>
            ))}
          </div>
        )}
      </section>

      {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

      <section aria-label="Search and filter innovations" className="rounded-2xl border bg-card p-4 shadow-[0_10px_28px_-24px_rgba(21,56,67,0.5)] sm:p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm font-semibold"><Filter className="h-4 w-4 text-primary" aria-hidden="true" /> Refine results</div>
          {hasActiveFilters && <button type="button" onClick={clearFilters} className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold text-primary hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"><RotateCcw className="h-3.5 w-3.5" aria-hidden="true" /> Clear filters</button>}
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_190px_190px]">
          <div className="relative sm:col-span-2 lg:col-span-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by title or author..." aria-label="Search innovations by title or author" className="pl-9" /></div>
          <Select value={focusFilter} onValueChange={setFocusFilter}><SelectTrigger className="w-full" aria-label="Learning focus filter"><SelectValue placeholder="Learning focus" /></SelectTrigger><SelectContent><SelectItem value="all">All learning focus</SelectItem><SelectItem value="numeracy">Numeracy</SelectItem><SelectItem value="literacy">Literacy</SelectItem></SelectContent></Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="w-full" aria-label="Evaluation status filter"><SelectValue placeholder="Assessment status" /></SelectTrigger><SelectContent><SelectItem value="all">All statuses</SelectItem><SelectItem value="pending">Awaiting Assessment</SelectItem><SelectItem value="scalable">Scalable</SelectItem><SelectItem value="not-scalable">Not Yet Recommended</SelectItem><SelectItem value="validated">Panel Validated</SelectItem></SelectContent></Select>
        </div>
      </section>

      <section aria-labelledby="innovation-results-heading" className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="page-eyebrow mb-1">Portfolio results</p><h2 id="innovation-results-heading" className="text-xl font-semibold">Innovations <span className="ml-1 text-muted-foreground">{!loading && !error ? filtered.length : ''}</span></h2></div>{!loading && !error && <p className="text-xs text-muted-foreground">Showing {filtered.length} of {innovations.length} submitted</p>}</div>
        {loading ? (
          <div className="flex items-center justify-center rounded-2xl border bg-card py-20" role="status"><Loader2 className="h-6 w-6 animate-spin text-primary" /><span className="sr-only">Loading innovations</span></div>
        ) : error ? null : filtered.length === 0 ? (
          <Card className="flex flex-col items-center px-5 py-14 text-center"><span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Search className="h-6 w-6" /></span><h3 className="mt-4 font-semibold">No innovations found</h3><p className="mt-1 max-w-sm text-sm leading-6 text-muted-foreground">Try another search term or adjust the selected filters.</p>{hasActiveFilters && <button type="button" onClick={clearFilters} className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">Show all innovations <ArrowRight className="h-4 w-4" /></button>}</Card>
        ) : (
          <div className="space-y-10">{[...keyStages, 'uncategorized'].map((stage) => renderInnovationGroup(stage, filtered.filter((innovation) => stage === 'uncategorized' ? !keyStages.includes(innovation.key_stage) : innovation.key_stage === stage)))}</div>
        )}
      </section>

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
