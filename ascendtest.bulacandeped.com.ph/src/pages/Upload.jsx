import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronsUpDown,
  CircleX,
  CloudUpload,
  FileText,
  LoaderCircle,
  Plus,
  RotateCcw,
  X,
} from 'lucide-react';
import { api } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  defaultKeywordCategories,
  gradeOptionsByStage,
  keyStageLabels,
} from '@/lib/innovationMetadata';

const fileStatus = {
  pending: { label: 'Pending', icon: FileText, color: 'text-muted-foreground' },
  uploading: { label: 'Uploading and reading manuscript…', icon: LoaderCircle, color: 'text-blue-600', spin: true },
  complete: { label: 'Automatically rated against the framework', icon: CheckCircle2, color: 'text-teal-600' },
  error: { label: 'Submission failed', icon: CircleX, color: 'text-rose-600' },
  invalid: { label: 'File validation failed', icon: CircleX, color: 'text-rose-600' },
};

const steps = [
  { number: 1, title: 'Basic information', short: 'Basic info' },
  { number: 2, title: 'Manuscript details', short: 'Details' },
  { number: 3, title: 'Upload documents', short: 'Files' },
  { number: 4, title: 'Review & confirm', short: 'Review' },
];
const MAX_FILE_SIZE = 20 * 1024 * 1024;
const ALLOWED_EXTENSIONS = ['pdf', 'docx', 'txt', 'md'];

function fileSizeLabel(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  return bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;
}

function fileValidationError(file) {
  const extension = file.name.split('.').pop()?.toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(extension)) return 'Use a PDF, DOCX, TXT, or Markdown file.';
  if (file.size > MAX_FILE_SIZE) return 'This file exceeds the 20 MB limit.';
  if (file.size === 0) return 'This file is empty.';
  return null;
}

function makeFileEntry(file) {
  const validationError = fileValidationError(file);
  return {
    id: `${file.name}-${file.size}-${file.lastModified}-${crypto.randomUUID()}`,
    file,
    name: file.name,
    status: validationError ? 'invalid' : 'pending',
    result: null,
    error: validationError,
  };
}

export default function Upload() {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const submittingRef = useRef(false);
  const [step, setStep] = useState(1);
  const [files, setFiles] = useState([]);
  const [author, setAuthor] = useState('');
  const [school, setSchool] = useState('');
  const [district, setDistrict] = useState('');
  const [keyStage, setKeyStage] = useState('KS1');
  const [gradeLevels, setGradeLevels] = useState(gradeOptionsByStage.KS1[0]);
  const [learningFocus, setLearningFocus] = useState('auto');
  const [keywords, setKeywords] = useState([]);
  const [keywordCategories, setKeywordCategories] = useState(defaultKeywordCategories);
  const [selectedKeywordIds, setSelectedKeywordIds] = useState([]);
  const [keywordCategory, setKeywordCategory] = useState('literacy');
  const [newKeyword, setNewKeyword] = useState('');
  const [keywordPickerOpen, setKeywordPickerOpen] = useState(false);
  const [loadingKeywords, setLoadingKeywords] = useState(true);
  const [keywordError, setKeywordError] = useState('');
  const [creatingKeyword, setCreatingKeyword] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  const [fileError, setFileError] = useState('');
  const [submissionError, setSubmissionError] = useState('');
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    api.keywords.list()
      .then((data) => {
        setKeywords(data.keywords || []);
        setKeywordCategories(data.categories || defaultKeywordCategories);
      })
      .catch((error) => setKeywordError(error.message || 'Unable to load keywords.'))
      .finally(() => setLoadingKeywords(false));
  }, []);

  const groupedKeywords = useMemo(() => Object.entries(keywordCategories).map(([value, label]) => ({
    value,
    label,
    keywords: keywords.filter((keyword) => keyword.category === value),
  })), [keywordCategories, keywords]);

  const metadataIsValid = Boolean(
    author.trim() && school.trim() && district.trim() && keyStage && gradeLevels,
  );
  const pendingCount = files.filter((file) => file.status === 'pending').length;
  const completedCount = files.filter((file) => file.status === 'complete').length;
  const invalidCount = files.filter((file) => file.status === 'invalid').length;
  const failedCount = files.filter((file) => file.status === 'error').length;
  const selectedKeywords = keywords.filter((keyword) => selectedKeywordIds.includes(keyword.id));

  function addFiles(fileList) {
    if (processing) return;
    const selected = Array.from(fileList || []);
    const knownSignatures = new Set(files.map((entry) => `${entry.name}-${entry.file.size}-${entry.file.lastModified}`));
    const uniqueSelected = selected.filter((file) => {
      const signature = `${file.name}-${file.size}-${file.lastModified}`;
      if (knownSignatures.has(signature)) return false;
      knownSignatures.add(signature);
      return true;
    });
    setFileError(uniqueSelected.length < selected.length ? 'Duplicate files were skipped.' : '');
    setFiles((current) => {
      const signatures = new Set(current.map((entry) => `${entry.name}-${entry.file.size}-${entry.file.lastModified}`));
      const entries = uniqueSelected.filter((file) => {
        const signature = `${file.name}-${file.size}-${file.lastModified}`;
        if (signatures.has(signature)) return false;
        signatures.add(signature);
        return true;
      }).map(makeFileEntry);
      return [...current, ...entries];
    });
    setConfirmed(false);
    if (inputRef.current) inputRef.current.value = '';
  }

  function handleDrop(event) {
    event.preventDefault();
    if (!processing) addFiles(event.dataTransfer.files);
  }

  function updateFile(id, changes) {
    setFiles((current) => current.map((file) => (file.id === id ? { ...file, ...changes } : file)));
  }

  function changeKeyStage(value) {
    setKeyStage(value);
    setGradeLevels(gradeOptionsByStage[value][0]);
  }

  function goToStep(nextStep) {
    if (processing || nextStep > step || nextStep < 1 || nextStep > 4) return;
    setStep(nextStep);
    setConfirmed(false);
  }

  function goNext() {
    if (step === 1 && !metadataIsValid) {
      setShowValidation(true);
      return;
    }
    if (step === 3 && (files.length === 0 || invalidCount > 0)) {
      setFileError(files.length === 0 ? 'Add at least one manuscript before continuing.' : 'Remove or replace files that did not pass validation.');
      return;
    }
    setShowValidation(false);
    setFileError('');
    setSubmissionError('');
    setKeywordPickerOpen(false);
    setStep((current) => Math.min(4, current + 1));
  }

  function toggleKeyword(id) {
    setSelectedKeywordIds((current) => (
      current.includes(id) ? current.filter((keywordId) => keywordId !== id) : current.length >= 15 ? current : [...current, id]
    ));
  }

  async function createKeyword() {
    const name = newKeyword.trim();
    if (!name) return;
    if (selectedKeywordIds.length >= 15) {
      setKeywordError('Select no more than 15 keywords.');
      return;
    }
    setCreatingKeyword(true);
    setKeywordError('');

    try {
      const created = await api.keywords.create({ name, category: keywordCategory });
      setKeywords((current) => {
        const withoutDuplicate = current.filter((keyword) => keyword.id !== created.id);
        return [...withoutDuplicate, created];
      });
      setSelectedKeywordIds((current) => (
        current.includes(created.id) ? current : [...current, created.id]
      ));
      setNewKeyword('');
    } catch (error) {
      setKeywordError(error.message || 'Unable to add the keyword.');
    } finally {
      setCreatingKeyword(false);
    }
  }

  async function submitFile(file) {
    try {
      updateFile(file.id, { status: 'uploading', error: null });
      const submission = new FormData();
      submission.append('file', file.file);
      submission.append('key_stage', keyStage);
      submission.append('grade_levels', gradeLevels);
      if (learningFocus !== 'auto') submission.append('learning_focus', learningFocus);
      submission.append('author', author.trim());
      submission.append('school', school.trim());
      submission.append('district', district.trim());
      selectedKeywordIds.forEach((id) => submission.append('keyword_ids[]', String(id)));
      const result = await api.submitManuscript(submission);
      if (!result?.innovation_id) throw new Error('The server did not confirm the manuscript submission. Check your submissions before retrying.');
      updateFile(file.id, { status: 'complete', result });
      return result;
    } catch (error) {
      updateFile(file.id, { status: 'error', error: error.message || 'Submission failed.' });
      return { error: error.message || 'Submission failed.', filename: file.name };
    }
  }

  async function submitAll() {
    if (submittingRef.current || processing || step !== 4) return;
    if (!metadataIsValid) {
      setShowValidation(true);
      setStep(1);
      return;
    }
    if (files.length === 0 || invalidCount > 0) {
      setStep(3);
      setFileError('Add a valid manuscript file before submitting.');
      return;
    }
    if (failedCount > 0) {
      setSubmissionError('Retry or remove failed files before submitting again.');
      return;
    }
    if (!confirmed || pendingCount === 0) return;

    setShowValidation(false);
    setSubmissionError('');
    submittingRef.current = true;
    setProcessing(true);
    const pending = files.filter((file) => file.status === 'pending');
    const results = [];

    try {
      for (const file of pending) results.push(await submitFile(file));
      const firstFailure = results.find((result) => !result?.innovation_id);
      if (!firstFailure) {
        setStep(5);
      } else {
        setConfirmed(false);
        setSubmissionError(`Could not submit “${firstFailure.filename}”: ${firstFailure.error} Successful submissions will not be sent again.`);
      }
    } finally {
      submittingRef.current = false;
      setProcessing(false);
    }
  }

  return (
    <div className="page-shell max-w-6xl space-y-6">
      <header className="relative overflow-hidden rounded-2xl bg-[#173e4b] px-5 py-7 text-white shadow-[0_18px_45px_-32px_rgba(14,48,59,0.8)] sm:px-7 sm:py-8">
        <span className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full border-[46px] border-white/[0.04]" aria-hidden="true" />
        <div className="relative"><p className="mb-3 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-cyan-100/75"><CloudUpload className="h-4 w-4" /> Submission desk</p><h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Upload innovation manuscripts</h1><p className="mt-3 max-w-3xl text-sm leading-6 text-white/70">Prepare your submission, upload one or more manuscripts, and review everything before sending. Each manuscript receives an initial framework assessment.</p></div>
      </header>

      {step < 5 && <nav aria-label="Submission progress" className="grid grid-cols-4 gap-2 rounded-2xl border bg-card p-2 shadow-[0_10px_28px_-24px_rgba(21,56,67,0.5)] sm:gap-3 sm:p-3">{steps.map((item) => <button key={item.number} type="button" onClick={() => goToStep(item.number)} disabled={processing || item.number > step} aria-current={step === item.number ? 'step' : undefined} className={`flex min-w-0 flex-col items-center gap-1 rounded-xl px-1 py-2 text-center transition-colors sm:flex-row sm:gap-3 sm:px-3 sm:py-3 sm:text-left ${step === item.number ? 'bg-primary text-primary-foreground' : item.number < step ? 'text-primary hover:bg-primary/5' : 'text-muted-foreground'} disabled:cursor-default`}><span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold sm:h-8 sm:w-8 ${step === item.number ? 'border-white/30 bg-white/15' : item.number < step ? 'border-primary/20 bg-primary/10' : 'border-border bg-muted/40'}`}>{item.number < step ? <Check className="h-4 w-4" /> : item.number}</span><span className="min-w-0"><span className="hidden text-[10px] font-bold uppercase tracking-wider opacity-70 sm:block">Step {item.number}</span><span className="block text-[10px] font-semibold leading-tight sm:hidden">{item.short}</span><span className="hidden text-xs font-semibold leading-tight sm:block lg:text-sm">{item.title}</span></span></button>)}</nav>}

      {step === 1 && <Card className="border-border/70 p-5 shadow-[0_10px_28px_-24px_rgba(21,56,67,0.5)] sm:p-6">
        <div className="mb-5"><p className="page-eyebrow mb-1">Step 1 of 4</p><h2 className="text-xl font-semibold">Basic information</h2><p className="mt-1 text-sm text-muted-foreground">These details apply to every manuscript in this batch.</p></div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <RequiredTextField id="proponent" label="Innovation proponent" value={author} onChange={setAuthor} placeholder="e.g. Juan Dela Cruz" invalid={showValidation && !author.trim()} />
          <RequiredTextField id="school" label="School" value={school} onChange={setSchool} placeholder="e.g. Bignay ES" invalid={showValidation && !school.trim()} />
          <RequiredTextField id="district" label="District" value={district} onChange={setDistrict} placeholder="e.g. District I" invalid={showValidation && !district.trim()} />

          <div>
            <Label className="text-xs">Key stage <RequiredMark /></Label>
            <Select value={keyStage} onValueChange={changeKeyStage}>
              <SelectTrigger className="mt-1" aria-label="Key stage"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(keyStageLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Grade level or scope <RequiredMark /></Label>
            <Select value={gradeLevels} onValueChange={setGradeLevels}>
              <SelectTrigger className="mt-1" aria-label="Grade level or scope"><SelectValue /></SelectTrigger>
              <SelectContent>
                {gradeOptionsByStage[keyStage].map((grade) => <SelectItem key={grade} value={grade}>{grade}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Learning focus</Label>
            <Select value={learningFocus} onValueChange={setLearningFocus}>
              <SelectTrigger className="mt-1" aria-label="Learning focus"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="auto">Detect from manuscript</SelectItem><SelectItem value="literacy">Literacy</SelectItem><SelectItem value="numeracy">Numeracy</SelectItem></SelectContent>
            </Select>
          </div>
        </div>
        {showValidation && !metadataIsValid && <p role="alert" className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">Complete the required fields before continuing.</p>}
      </Card>}

      {step === 2 && <div className="space-y-4">
      <Card className="border-border/70 p-5 shadow-[0_10px_28px_-24px_rgba(21,56,67,0.5)] sm:p-6">
        <div className="mb-4"><p className="page-eyebrow mb-1">Step 2 of 4</p><h2 className="text-xl font-semibold">Manuscript details</h2><p className="mt-1 text-sm text-muted-foreground">Add discovery keywords and check that the document contains the details reviewers need.</p></div>
        <div className="grid gap-3 sm:grid-cols-3"><div className="rounded-xl border bg-muted/20 p-3"><p className="text-xs font-semibold">Title</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Name each file after its manuscript title. The saved title is derived from the filename.</p></div><div className="rounded-xl border bg-muted/20 p-3"><p className="text-xs font-semibold">Abstract and objectives</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Include these in the manuscript so the system can read and summarize them.</p></div><div className="rounded-xl border bg-muted/20 p-3"><p className="text-xs font-semibold">Description and evidence</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Include the implementation approach and supporting evidence in the document.</p></div></div>
      </Card>
      <Card className="border-border/70 p-5 shadow-[0_10px_28px_-24px_rgba(21,56,67,0.5)] sm:p-6">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold">Keywords</h2>
            <p className="mt-1 text-xs text-muted-foreground">Optional. Select up to 15 topics to improve discovery and filtering.</p>
          </div>
          {selectedKeywordIds.length > 0 && <span className="text-xs font-medium text-primary">{selectedKeywordIds.length} selected</span>}
        </div>

        {loadingKeywords ? (
          <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground"><LoaderCircle className="h-4 w-4 animate-spin" /> Loading keywords…</div>
        ) : (
          <Popover open={keywordPickerOpen} onOpenChange={setKeywordPickerOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                role="combobox"
                aria-expanded={keywordPickerOpen}
                className="mt-4 w-full justify-between font-normal"
              >
                <span className={cn(selectedKeywordIds.length === 0 && 'text-muted-foreground')}>
                  {selectedKeywordIds.length > 0
                    ? `${selectedKeywordIds.length} keyword${selectedKeywordIds.length === 1 ? '' : 's'} selected`
                    : 'Select keywords'}
                </span>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] p-0">
              <Command>
                <CommandInput placeholder="Search keywords..." />
                <CommandList>
                  <CommandEmpty>No keyword found.</CommandEmpty>
                  {groupedKeywords.filter((group) => group.keywords.length > 0).map((group) => (
                    <CommandGroup key={group.value} heading={group.label}>
                      {group.keywords.map((keyword) => {
                        const selected = selectedKeywordIds.includes(keyword.id);
                        return (
                          <CommandItem
                            key={keyword.id}
                            value={`${group.label} ${keyword.name}`}
                            disabled={!selected && selectedKeywordIds.length >= 15}
                            onSelect={() => toggleKeyword(keyword.id)}
                          >
                            <Check className={cn('h-4 w-4', selected ? 'opacity-100' : 'opacity-0')} />
                            <span>{keyword.name}</span>
                          </CommandItem>
                        );
                      })}
                    </CommandGroup>
                  ))}
                </CommandList>

                <div className="space-y-2 border-t p-3">
                  <p className="text-xs font-medium text-muted-foreground">Add a custom keyword</p>
                  <Input
                    value={newKeyword}
                    onChange={(event) => setNewKeyword(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        createKeyword();
                      }
                    }}
                    placeholder="New keyword"
                    maxLength={60}
                    aria-label="New keyword"
                  />
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
                    <Select value={keywordCategory} onValueChange={setKeywordCategory}>
                      <SelectTrigger aria-label="New keyword category"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(keywordCategories).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Button type="button" variant="outline" onClick={createKeyword} disabled={!newKeyword.trim() || creatingKeyword || selectedKeywordIds.length >= 15}>
                      {creatingKeyword ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Add
                    </Button>
                  </div>
                </div>
              </Command>
            </PopoverContent>
          </Popover>
        )}
        {keywordError && <p role="alert" className="mt-3 text-xs text-rose-600">{keywordError}</p>}
      </Card>
      </div>}

      {step === 3 && <div className="space-y-4">
      <div><p className="page-eyebrow mb-1">Step 3 of 4</p><h2 className="text-xl font-semibold">Upload documents</h2><p className="mt-1 text-sm text-muted-foreground">Choose one or more manuscript files. Each file becomes a separate innovation submission.</p></div>
      <Card
        className="cursor-pointer border-2 border-dashed border-primary/25 bg-primary/[0.025] p-8 text-center transition-colors hover:border-primary/50 hover:bg-primary/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:p-10"
        onClick={() => !processing && inputRef.current?.click()}
        onKeyDown={(event) => {
          if (!processing && (event.key === 'Enter' || event.key === ' ')) {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDrop={handleDrop}
        onDragOver={(event) => event.preventDefault()}
        role="button"
        tabIndex={processing ? -1 : 0}
        aria-label="Select innovation manuscript files"
      >
        <input ref={inputRef} type="file" multiple accept=".pdf,.docx,.txt,.md" onChange={(event) => addFiles(event.target.files)} onClick={(event) => event.stopPropagation()} className="hidden" aria-label="Innovation manuscript files" />
        <span className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary"><CloudUpload className="h-7 w-7" /></span>
        <p className="text-sm font-semibold">Click to select or drag and drop manuscripts</p>
        <p className="mt-1 text-xs text-muted-foreground">Searchable PDF, DOCX, TXT, or Markdown · up to 20 MB per file</p>
      </Card>
      <p className="text-xs leading-5 text-muted-foreground">Supporting evidence can be included in the manuscript document. The current submission service accepts manuscript files only; separate attachments are not stored.</p>
      {fileError && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{fileError}</p>}

      {files.length > 0 && (
        <Card className="border-border/70 p-5 shadow-[0_10px_28px_-24px_rgba(21,56,67,0.5)] sm:p-6">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-sm font-semibold">
              Files ({files.length})
              {completedCount > 0 && <span className="ml-2 text-teal-700">· {completedCount} submitted</span>}
            </h3>
          </div>
          <div className="space-y-2">
            {files.map((file) => {
              const status = fileStatus[file.status];
              const StatusIcon = status.icon;
              return (
                <div key={file.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-border/60 bg-card px-3 py-3">
                  <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{file.name}</div>
                    <div className={`mt-0.5 text-xs ${['error', 'invalid'].includes(file.status) ? 'text-rose-600' : status.color}`}>
                      {fileSizeLabel(file.file.size)} · {file.error || status.label}
                    </div>
                  </div>
                  <StatusIcon className={`h-4 w-4 shrink-0 ${status.color} ${status.spin ? 'animate-spin' : ''}`} />
                  {file.status === 'complete' && file.result?.innovation_id && (
                    <Button type="button" variant="outline" size="sm" className="h-8 text-xs" onClick={() => navigate(`/innovations/${file.result.innovation_id}`)}>
                      View submission <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                    </Button>
                  )}
                  {file.status === 'error' && (
                    <Button type="button" variant="ghost" size="sm" className="h-8 text-xs" onClick={() => updateFile(file.id, { status: 'pending', error: null })}>
                      <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Retry
                    </Button>
                  )}
                  {['pending', 'invalid', 'error'].includes(file.status) && (
                    <button type="button" disabled={processing} onClick={() => setFiles((current) => current.filter((entry) => entry.id !== file.id))} className="text-muted-foreground hover:text-rose-600 disabled:opacity-50" aria-label={`Remove ${file.name}`}>
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}
      </div>}

      {step === 4 && <div className="space-y-4">
        <div><p className="page-eyebrow mb-1">Step 4 of 4</p><h2 className="text-xl font-semibold">Review & confirm</h2><p className="mt-1 text-sm text-muted-foreground">Check the metadata and files before submission. You can return to any previous step to make changes.</p></div>
        <Card className="border-border/70 p-5 shadow-[0_10px_28px_-24px_rgba(21,56,67,0.5)] sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-3"><h3 className="font-semibold">Basic information</h3><Button type="button" variant="outline" size="sm" disabled={processing} onClick={() => goToStep(1)}>Edit</Button></div>
          <dl className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3"><ReviewField label="Innovation proponent" value={author} /><ReviewField label="School" value={school} /><ReviewField label="District" value={district} /><ReviewField label="Key stage" value={keyStageLabels[keyStage]} /><ReviewField label="Grade level or scope" value={gradeLevels} /><ReviewField label="Learning focus" value={learningFocus === 'auto' ? 'Detect from manuscript' : learningFocus} /></dl>
        </Card>
        <Card className="border-border/70 p-5 shadow-[0_10px_28px_-24px_rgba(21,56,67,0.5)] sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-3"><h3 className="font-semibold">Manuscript details</h3><Button type="button" variant="outline" size="sm" disabled={processing} onClick={() => goToStep(2)}>Edit</Button></div>
          <dl><ReviewField label="Keywords" value={selectedKeywords.length > 0 ? selectedKeywords.map((keyword) => keyword.name).join(', ') : 'No keywords selected; a focus keyword will be added automatically.'} /></dl>
          <p className="mt-3 text-xs leading-5 text-muted-foreground">The title is derived from each filename. The summary and initial framework ratings are generated from the readable manuscript after upload.</p>
          {completedCount > 0 && <p className="mt-2 text-xs leading-5 text-amber-800">Previously submitted files retain their saved information. Changes here apply only to files awaiting submission.</p>}
        </Card>
        <Card className="border-border/70 p-5 shadow-[0_10px_28px_-24px_rgba(21,56,67,0.5)] sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-3"><h3 className="font-semibold">Manuscript files ({files.length})</h3><Button type="button" variant="outline" size="sm" disabled={processing} onClick={() => goToStep(3)}>Edit</Button></div>
          <div className="space-y-2">{files.map((file) => <div key={file.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-muted/20 px-3 py-3"><div className="flex min-w-0 items-center gap-2"><FileText className="h-4 w-4 shrink-0 text-primary" /><div className="min-w-0"><p className="truncate text-sm font-medium">{file.name}</p><p className={`text-xs ${file.error ? 'text-rose-700' : 'text-muted-foreground'}`}>{fileSizeLabel(file.file.size)} · {file.error || fileStatus[file.status].label}</p></div></div>{file.status === 'error' && <Button type="button" variant="outline" size="sm" disabled={processing} onClick={() => { updateFile(file.id, { status: 'pending', error: null }); setSubmissionError(''); }}><RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Retry</Button>}</div>)}</div>
        </Card>
        {submissionError && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"><span>{submissionError}</span><Button type="button" variant="outline" size="sm" onClick={() => goToStep(3)}>Review failed files</Button></div>}
        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-primary/20 bg-primary/[0.04] p-4 text-sm leading-6"><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} disabled={processing} className="mt-1 h-4 w-4 shrink-0 accent-[#206b78]" /><span>I confirm that the information and selected manuscript files are correct. I understand each file will be submitted as a separate innovation.</span></label>
      </div>}

      {step === 5 && <Card className="border-border/70 p-6 text-center shadow-[0_10px_28px_-24px_rgba(21,56,67,0.5)] sm:p-8"><span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-50 text-teal-700"><CheckCircle2 className="h-9 w-9" /></span><p className="page-eyebrow mt-5">Submission complete</p><h2 className="text-2xl font-semibold">Manuscript{completedCount === 1 ? '' : 's'} submitted successfully</h2><p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground">Your {completedCount} manuscript{completedCount === 1 ? ' has' : 's have'} been received and automatically reviewed. Keep the reference ID for each submission.</p><div className="mx-auto mt-6 max-w-2xl space-y-2 text-left">{files.filter((file) => file.status === 'complete').map((file) => <div key={file.id} className="flex flex-col gap-3 rounded-xl border bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><p className="truncate text-sm font-semibold">{file.result?.detected_title || file.name}</p><p className="mt-1 text-xs text-muted-foreground">Reference ID: <span className="font-semibold text-foreground">{file.result?.innovation_id}</span> · {fileSizeLabel(file.file.size)}</p></div><Button type="button" variant="outline" size="sm" onClick={() => navigate(`/innovations/${file.result.innovation_id}`)}>View Submission <ArrowRight className="ml-1.5 h-4 w-4" /></Button></div>)}</div><div className="mt-7 flex flex-col justify-center gap-2 sm:flex-row"><Button type="button" onClick={() => navigate('/innovations')}>Back to Manuscripts <ArrowRight className="ml-1.5 h-4 w-4" /></Button><Button type="button" variant="outline" onClick={() => { setFiles([]); setConfirmed(false); setStep(3); }}>Submit more manuscripts</Button></div></Card>}

      {step < 5 && <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-4 shadow-[0_10px_28px_-24px_rgba(21,56,67,0.5)]"><div>{step > 1 && <Button type="button" variant="outline" onClick={() => goToStep(step - 1)} disabled={processing}><ArrowLeft className="mr-1.5 h-4 w-4" /> Back</Button>}</div><span className="text-xs font-medium text-muted-foreground">Step {step} of 4</span>{step < 4 ? <Button type="button" onClick={goNext}>Next <ArrowRight className="ml-1.5 h-4 w-4" /></Button> : pendingCount === 0 && failedCount === 0 && completedCount > 0 ? <Button type="button" onClick={() => setStep(5)}>Finish <ArrowRight className="ml-1.5 h-4 w-4" /></Button> : <Button type="button" onClick={submitAll} disabled={processing || !confirmed || pendingCount === 0 || failedCount > 0 || invalidCount > 0}>{processing ? <><LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> Submitting {pendingCount} manuscript{pendingCount === 1 ? '' : 's'}...</> : <>Submit {pendingCount} manuscript{pendingCount === 1 ? '' : 's'} <ArrowRight className="ml-1.5 h-4 w-4" /></>}</Button>}</div>}
    </div>
  );
}

function RequiredMark() {
  return <span className="text-rose-600" aria-hidden="true">*</span>;
}

function ReviewField({ label, value }) {
  return <div className="min-w-0"><dt className="text-xs font-medium text-muted-foreground">{label}</dt><dd className="mt-1 break-words text-sm font-semibold text-foreground">{value || '—'}</dd></div>;
}

function RequiredTextField({ id, label, value, onChange, placeholder, invalid }) {
  return (
    <div>
      <Label htmlFor={id} className="text-xs">{label} <RequiredMark /></Label>
      <Input id={id} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} maxLength={255} required aria-invalid={invalid} className="mt-1" />
      {invalid && <p className="mt-1 text-xs text-rose-600">{label} is required.</p>}
    </div>
  );
}
