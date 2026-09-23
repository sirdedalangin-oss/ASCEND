import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '@/api/client';
import { manuscriptUrl } from '@/lib/manuscriptUrl';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { ExternalLink, Eye, FileCheck2, FileText, Loader2, Pencil, Plus, Search, Trash2 } from 'lucide-react';

const gradeLevelsByStage = {
  KS1: 'Grades 1-3',
  KS2: 'Grades 4-6',
  KS3: 'Grades 7-10',
  KS4: 'Grades 11-12',
};

function emptyForm() {
  return {
    innovation_id: '',
    title: '',
    author: '',
    school: '',
    district: '',
    learning_focus: 'numeracy',
    key_stage: 'KS1',
    grade_levels: 'Grades 1-3',
    status: 'evaluated',
    framework_ratings: {},
    framework_notes: '',
    recommendation: '',
  };
}

function recordToForm(record) {
  return {
    ...emptyForm(),
    innovation_id: String(record.id),
    title: record.title || '',
    author: record.author || '',
    school: record.school || '',
    district: record.district || '',
    learning_focus: record.learning_focus || 'numeracy',
    key_stage: record.key_stage || 'KS1',
    grade_levels: record.grade_levels || 'Grades 1-3',
    status: record.framework_score != null && record.status === 'validated' ? 'validated' : 'evaluated',
    framework_ratings: record.framework_ratings || {},
    framework_notes: record.framework_notes || '',
    recommendation: record.framework_score != null ? record.recommendation || '' : '',
  };
}

function manuscriptFileDetails(fileUrl) {
  if (!fileUrl) return { extension: '', name: '' };

  try {
    const pathname = new URL(fileUrl, window.location.origin).pathname;
    const name = decodeURIComponent(pathname.split('/').pop() || 'Manuscript');
    return { extension: name.split('.').pop()?.toLowerCase() || '', name };
  } catch {
    const name = fileUrl.split('/').pop()?.split('?')[0] || 'Manuscript';
    return { extension: name.split('.').pop()?.toLowerCase() || '', name };
  }
}

function ManuscriptPreview({ innovation }) {
  const fileUrl = manuscriptUrl(innovation?.manuscript_file_url);
  const { extension, name } = manuscriptFileDetails(fileUrl);
  const canPreview = ['pdf', 'txt', 'md'].includes(extension);
  const [fileAvailable, setFileAvailable] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setFileAvailable(null);

    if (!fileUrl) return () => { cancelled = true; };

    fetch(fileUrl, { method: 'HEAD' })
      .then((response) => {
        if (!cancelled) setFileAvailable(response.ok);
      })
      .catch(() => {
        if (!cancelled) setFileAvailable(false);
      });

    return () => { cancelled = true; };
  }, [fileUrl]);

  return (
    <section className="overflow-hidden rounded-lg border bg-muted/20 lg:sticky lg:top-0">
      <div className="flex items-center justify-between gap-3 border-b bg-background px-4 py-3">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold">Manuscript preview</h3>
          <p className="truncate text-xs text-muted-foreground">
            {fileUrl ? name : 'Select an innovation to view its file'}
          </p>
        </div>
        {fileUrl && fileAvailable && (
          <Button asChild type="button" variant="outline" size="sm" className="shrink-0">
            <a href={fileUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" /> Open file
            </a>
          </Button>
        )}
      </div>

      {fileUrl && fileAvailable === null ? (
        <div className="flex h-72 items-center justify-center lg:h-[calc(92dvh-16rem)] lg:min-h-[36rem]">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : fileUrl && fileAvailable && canPreview ? (
        <iframe
          key={fileUrl}
          src={fileUrl}
          title={`Manuscript preview for ${innovation.title}`}
          className="h-[30rem] w-full bg-white lg:h-[calc(92dvh-16rem)] lg:min-h-[36rem]"
        />
      ) : (
        <div className="flex h-72 flex-col items-center justify-center px-6 text-center lg:h-[calc(92dvh-16rem)] lg:min-h-[36rem]">
          <FileText className="mb-3 h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm font-medium">
            {fileUrl && !fileAvailable
              ? 'The manuscript file could not be loaded.'
              : fileUrl
                ? 'Inline preview is unavailable for this file type.'
                : 'No manuscript selected'}
          </p>
          <p className="mt-1 max-w-sm text-xs text-muted-foreground">
            {fileUrl && !fileAvailable
              ? 'The database record points to a file that is missing from public manuscript storage.'
              : fileUrl
                ? 'Open the manuscript in a new tab while completing the assessment.'
                : 'Choose an innovation above to display the submitted manuscript here.'}
          </p>
        </div>
      )}
    </section>
  );
}

export default function Evaluations() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const canAssess = user?.role === 'admin';
  const [evaluations, setEvaluations] = useState([]);
  const [availableInnovations, setAvailableInnovations] = useState([]);
  const [framework, setFramework] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [focusFilter, setFocusFilter] = useState('all');
  const [decisionFilter, setDecisionFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      api.evaluations.list(),
      api.innovations.list({ sort: '-created_at', limit: 500 }),
      api.framework.get(),
    ])
      .then(([evaluationRecords, innovationRecords, frameworkData]) => {
        setEvaluations(evaluationRecords);
        setAvailableInnovations(innovationRecords);
        setFramework(frameworkData);
      })
      .catch((requestError) => setError(requestError.message || 'Unable to load framework assessments.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const editId = searchParams.get('edit');
    if (loading || !editId || !user) return;

    const record = evaluations.find((evaluation) => String(evaluation.id) === editId);
    if (record && (canAssess || (record.created_by_id === user.id && record.status !== 'validated'))) {
      setEditing(record);
      setForm(recordToForm(record));
      setError('');
      setDialogOpen(true);
    }
    setSearchParams({}, { replace: true });
  }, [canAssess, evaluations, loading, searchParams, setSearchParams, user]);

  const filtered = useMemo(() => evaluations.filter((evaluation) => {
    const query = search.trim().toLowerCase();
    const matchesSearch = !query || [evaluation.title, evaluation.author, evaluation.school, evaluation.district]
      .some((value) => value?.toLowerCase().includes(query));
    const matchesFocus = focusFilter === 'all' || evaluation.learning_focus === focusFilter;
    const matchesDecision = decisionFilter === 'all'
      || (decisionFilter === 'scalable' ? evaluation.is_scalable : !evaluation.is_scalable);
    return matchesSearch && matchesFocus && matchesDecision;
  }), [evaluations, focusFilter, search, decisionFilter]);

  const allRated = framework?.criteria.every(({ key }) => {
    const rating = Number(form.framework_ratings[key]);
    return Number.isInteger(rating) && rating >= 1 && rating <= 5;
  }) || false;
  const previewScore = allRated
    ? framework.criteria.reduce((sum, { key, weight }) => sum + Number(form.framework_ratings[key]) * weight, 0) / 5
    : null;
  const previewLevel = previewScore == null
    ? null
    : framework.levels.find((level) => previewScore >= level.minimum)?.title;
  const unassessedInnovations = availableInnovations.filter((innovation) => innovation.framework_score == null);
  const selectedInnovation = availableInnovations.find((innovation) => String(innovation.id) === form.innovation_id)
    || editing;

  function canEditAssessment(assessment) {
    return canAssess || (assessment.created_by_id === user?.id && assessment.status !== 'validated');
  }

  function assessmentStatus(assessment) {
    if (assessment.status === 'validated') return 'Panel validated';
    if (assessment.evaluation_method === 'automatic_manuscript_review') return 'Automatically rated';
    if (assessment.evaluation_method === 'manual_owner_correction') return 'Uploader corrected';
    return 'Assessed';
  }

  function openCreate() {
    setEditing(null);
    setForm(emptyForm());
    setError('');
    setDialogOpen(true);
  }

  function openEdit(evaluation) {
    setEditing(evaluation);
    setForm(recordToForm(evaluation));
    setError('');
    setDialogOpen(true);
  }

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function updateRating(key, value) {
    setForm((current) => ({
      ...current,
      framework_ratings: { ...current.framework_ratings, [key]: value },
    }));
  }

  function selectInnovation(value) {
    const innovation = availableInnovations.find((record) => String(record.id) === value);
    if (innovation) setForm(recordToForm(innovation));
  }

  function updateKeyStage(value) {
    setForm((current) => ({ ...current, key_stage: value, grade_levels: gradeLevelsByStage[value] }));
  }

  async function saveEvaluation(event) {
    event.preventDefault();
    if (!(editing ? canEditAssessment(editing) : canAssess) || !allRated) return;
    setSaving(true);
    setError('');

    try {
      const payload = {
        ...form,
        framework_ratings: Object.fromEntries(
          framework.criteria.map(({ key }) => [key, Number(form.framework_ratings[key])]),
        ),
      };
      const saved = editing
        ? await api.evaluations.update(editing.id, payload)
        : await api.evaluations.create(payload);

      setEvaluations((current) => current.some((evaluation) => evaluation.id === saved.id)
        ? current.map((evaluation) => evaluation.id === saved.id ? saved : evaluation)
        : [saved, ...current]);
      setAvailableInnovations((current) => current.map((innovation) => innovation.id === saved.id ? saved : innovation));
      setDialogOpen(false);
    } catch (requestError) {
      setError(requestError.message || 'Unable to save the framework assessment.');
    } finally {
      setSaving(false);
    }
  }

  async function removeEvaluation() {
    if (!deleteTarget || !canAssess) return;
    setDeleting(true);
    setError('');

    try {
      const result = await api.evaluations.remove(deleteTarget.id);
      setEvaluations((current) => current.filter((evaluation) => evaluation.id !== deleteTarget.id));
      setAvailableInnovations((current) => current.map((innovation) => (
        innovation.id === deleteTarget.id ? result.innovation : innovation
      )));
      setDeleteTarget(null);
    } catch (requestError) {
      setError(requestError.message || 'Unable to remove the framework assessment.');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="page-shell space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <p className="page-eyebrow">Framework review</p>
          <h1 className="page-title">Scalability Assessments</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manuscripts receive automatic ratings that uploaders and administrators can correct. Administrators may validate the final assessment.
          </p>
        </div>
        {canAssess && <Button onClick={openCreate}><Plus className="w-4 h-4 mr-2" /> New Assessment</Button>}
      </div>

      {!canAssess && <Card className="p-4 text-sm text-muted-foreground">You can correct ratings for manuscripts you uploaded. Only administrators can validate assessments.</Card>}
      {error && !dialogOpen && <Card className="p-4 text-sm text-rose-700">{error}</Card>}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4"><div className="text-xs text-muted-foreground">Assessed</div><div className="text-2xl font-bold mt-1">{evaluations.length}</div></Card>
        <Card className="p-4"><div className="text-xs text-muted-foreground">Scalable</div><div className="text-2xl font-bold text-teal-600 mt-1">{evaluations.filter((item) => item.is_scalable).length}</div></Card>
        <Card className="p-4"><div className="text-xs text-muted-foreground">Panel validated</div><div className="text-2xl font-bold text-primary mt-1">{evaluations.filter((item) => item.status === 'validated').length}</div></Card>
      </div>

      <div className="flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search title, proponent, school, or district..." aria-label="Search assessments" className="pl-9" />
        </div>
        <Select value={focusFilter} onValueChange={setFocusFilter}>
          <SelectTrigger className="w-full lg:w-44" aria-label="Learning focus filter"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All focus areas</SelectItem>
            <SelectItem value="numeracy">Numeracy</SelectItem>
            <SelectItem value="literacy">Literacy</SelectItem>
          </SelectContent>
        </Select>
        <Select value={decisionFilter} onValueChange={setDecisionFilter}>
          <SelectTrigger className="w-full lg:w-44" aria-label="Scalability decision filter"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All decisions</SelectItem>
            <SelectItem value="scalable">Scalable</SelectItem>
            <SelectItem value="not-scalable">Not scalable</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center px-4">
            <FileCheck2 className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="font-medium text-sm">No framework assessments found</p>
            <p className="text-xs text-muted-foreground mt-1">Select an innovation and enter all five ratings to assess scalability.</p>
          </div>
        ) : <>
          <div className="divide-y divide-border md:hidden">
            {filtered.map((evaluation) => (
              <article key={evaluation.id} className="min-w-0 space-y-3 p-4">
                <div className="flex min-w-0 items-start justify-between gap-3"><div className="min-w-0"><h2 className="break-words text-sm font-semibold">{evaluation.title}</h2><p className="mt-1 break-words text-xs text-muted-foreground">{[evaluation.author, evaluation.school].filter(Boolean).join(' · ') || 'No proponent details'}</p></div><span className="shrink-0 rounded-lg bg-primary/10 px-2 py-1 text-xs font-bold text-primary">{evaluation.framework_score}/100</span></div>
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground"><span>{evaluation.framework_level}</span><span>{assessmentStatus(evaluation)}</span><span>{evaluation.framework_assessed_at ? new Date(evaluation.framework_assessed_at).toLocaleDateString() : '—'}</span></div>
                <div className="flex flex-wrap gap-2"><Button variant="outline" size="sm" asChild><Link to={`/innovations/${evaluation.id}`}><Eye className="h-4 w-4" /> View</Link></Button>{canEditAssessment(evaluation) && <Button variant="outline" size="sm" onClick={() => openEdit(evaluation)}><Pencil className="h-4 w-4" /> Edit</Button>}{canAssess && <Button variant="outline" size="sm" onClick={() => setDeleteTarget(evaluation)} className="text-rose-700"><Trash2 className="h-4 w-4" /> Remove</Button>}</div>
              </article>
            ))}
          </div>
          <div className="hidden md:block"><Table>
            <TableHeader><TableRow>
              <TableHead>Innovation</TableHead><TableHead>Score</TableHead><TableHead>Classification</TableHead><TableHead>Status</TableHead><TableHead>Assessed</TableHead><TableHead className="text-right">Actions</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {filtered.map((evaluation) => (
                <TableRow key={evaluation.id}>
                  <TableCell>
                    <div className="font-medium max-w-md truncate">{evaluation.title}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{[evaluation.author, evaluation.school].filter(Boolean).join(' · ') || 'No proponent details'}</div>
                  </TableCell>
                  <TableCell className="font-semibold">{evaluation.framework_score}/100</TableCell>
                  <TableCell className="text-xs">{evaluation.framework_level}</TableCell>
                  <TableCell className="text-xs">{assessmentStatus(evaluation)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {evaluation.framework_assessed_at ? new Date(evaluation.framework_assessed_at).toLocaleDateString() : '—'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" asChild title="View assessment"><Link to={`/innovations/${evaluation.id}`}><Eye className="w-4 h-4" /></Link></Button>
                      {canEditAssessment(evaluation) && <Button variant="ghost" size="icon" onClick={() => openEdit(evaluation)} title="Edit assessment"><Pencil className="w-4 h-4" /></Button>}
                      {canAssess && <>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(evaluation)} title="Remove assessment" className="text-rose-600 hover:text-rose-700"><Trash2 className="w-4 h-4" /></Button>
                      </>}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table></div>
        </>}
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[92dvh] w-[calc(100vw-2rem)] max-w-7xl overflow-x-hidden overflow-y-auto">
          <form onSubmit={saveEvaluation} className="space-y-6">
            <DialogHeader>
              <DialogTitle>{editing ? 'Edit Scalability Assessment' : 'New Scalability Assessment'}</DialogTitle>
              <DialogDescription>{editing?.evaluation_method === 'automatic_manuscript_review' ? 'Correct any automatic ratings that do not reflect the manuscript. The score and classification update from the fixed weights.' : 'Rate each framework criterion from 1 to 5. The score and classification are calculated from the fixed weights.'}</DialogDescription>
            </DialogHeader>
            {error && <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>}

            <div>
              <Label>Innovation <span className="text-rose-600">*</span></Label>
              {editing ? (
                <Input value={form.title} readOnly className="mt-1 bg-muted/40" />
              ) : (
                <Select value={form.innovation_id} onValueChange={selectInnovation}>
                  <SelectTrigger className="mt-1" aria-label="Innovation"><SelectValue placeholder="Select an innovation to assess" /></SelectTrigger>
                  <SelectContent>
                    {unassessedInnovations.map((innovation) => (
                      <SelectItem key={innovation.id} value={String(innovation.id)}>{innovation.title}{innovation.school ? ` — ${innovation.school}` : ''}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {!editing && unassessedInnovations.length === 0 && <p className="text-xs text-muted-foreground mt-1">Upload or create an unassessed innovation first.</p>}
            </div>

            <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(28rem,0.85fr)]">
              <ManuscriptPreview innovation={selectedInnovation} />
              <div className="min-w-0 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div><Label htmlFor="assessment-author">Proponent</Label><Input id="assessment-author" value={form.author} onChange={(event) => updateForm('author', event.target.value)} readOnly={!canAssess} className="mt-1" /></div>
              <div><Label htmlFor="assessment-school">School</Label><Input id="assessment-school" value={form.school} onChange={(event) => updateForm('school', event.target.value)} readOnly={!canAssess} className="mt-1" /></div>
              <div><Label htmlFor="assessment-district">District</Label><Input id="assessment-district" value={form.district} onChange={(event) => updateForm('district', event.target.value)} readOnly={!canAssess} className="mt-1" /></div>
              <div>
                <Label>Learning focus</Label>
                <Select value={form.learning_focus} onValueChange={(value) => updateForm('learning_focus', value)} disabled={!canAssess}>
                  <SelectTrigger className="mt-1" aria-label="Learning focus"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="numeracy">Numeracy</SelectItem><SelectItem value="literacy">Literacy</SelectItem></SelectContent>
                </Select>
              </div>
              <div>
                <Label>Key stage</Label>
                <Select value={form.key_stage} onValueChange={updateKeyStage} disabled={!canAssess}>
                  <SelectTrigger className="mt-1" aria-label="Key stage"><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.keys(gradeLevelsByStage).map((stage) => <SelectItem key={stage} value={stage}>{stage}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label htmlFor="assessment-grades">Grade levels</Label><Input id="assessment-grades" value={form.grade_levels} onChange={(event) => updateForm('grade_levels', event.target.value)} readOnly={!canAssess} required className="mt-1" /></div>
            </div>

            <div className="space-y-4">
              <div className="flex items-end justify-between gap-4 border-b pb-2">
                <h3 className="text-sm font-semibold">Framework ratings</h3>
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">Final scalability score</div>
                  <div className="text-xl font-bold text-primary">{previewScore == null ? '—' : `${previewScore}/100`}</div>
                </div>
              </div>
              {framework?.criteria.map((criterion) => (
                <div key={criterion.key} className="grid grid-cols-1 sm:grid-cols-[1fr_10rem] gap-3 items-start">
                  <div>
                    <Label>{criterion.label} <span className="text-muted-foreground">({criterion.weight}%)</span></Label>
                    {form.framework_ratings[criterion.key] && <p className="text-xs text-muted-foreground mt-1">{framework.ratings[form.framework_ratings[criterion.key]]}</p>}
                  </div>
                  <Select value={String(form.framework_ratings[criterion.key] || '')} onValueChange={(value) => updateRating(criterion.key, value)}>
                    <SelectTrigger aria-label={`${criterion.label} rating`}><SelectValue placeholder="Rate 1–5" /></SelectTrigger>
                    <SelectContent>{[1, 2, 3, 4, 5].map((rating) => <SelectItem key={rating} value={String(rating)}>{rating}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              ))}
              <div className="rounded-md bg-muted/50 p-3 text-sm">
                {previewLevel || 'Rate all five criteria to see the classification.'}
              </div>
              <p className="text-xs text-muted-foreground">Final score = sum of each rating × its weight ÷ 5. Scores of 75 or more are scalable.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><Label htmlFor="framework-notes">Rating notes and evidence</Label><Textarea id="framework-notes" value={form.framework_notes} onChange={(event) => updateForm('framework_notes', event.target.value)} rows={6} className="mt-1" /></div>
              <div><Label htmlFor="framework-recommendation">Recommendation</Label><Textarea id="framework-recommendation" value={form.recommendation} onChange={(event) => updateForm('recommendation', event.target.value)} rows={4} className="mt-1" /></div>
            </div>
            {canAssess ? <div>
              <Label>Assessment status</Label>
              <Select value={form.status} onValueChange={(value) => updateForm('status', value)}>
                <SelectTrigger className="mt-1" aria-label="Assessment status"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="evaluated">Assessed</SelectItem><SelectItem value="validated">Panel validated</SelectItem></SelectContent>
              </Select>
            </div> : <p className="text-xs text-muted-foreground">Only administrators can mark an assessment as panel validated.</p>}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving || !form.innovation_id || !allRated}>
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editing ? 'Save Changes' : 'Save Assessment'}
              </Button>
            </DialogFooter>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this assessment?</AlertDialogTitle>
            <AlertDialogDescription>The framework ratings and decision for “{deleteTarget?.title}” will be removed. The innovation and manuscript will remain available for reassessment.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={removeEvaluation} disabled={deleting} className="bg-rose-600 hover:bg-rose-700">
              {deleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Remove Assessment
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
