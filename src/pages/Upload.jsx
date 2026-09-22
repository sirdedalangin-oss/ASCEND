import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
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
  uploading: { label: 'Uploading manuscript…', icon: LoaderCircle, color: 'text-blue-600', spin: true },
  analyzing: { label: 'Reading manuscript…', icon: LoaderCircle, color: 'text-amber-600', spin: true },
  complete: { label: 'Submitted for framework assessment', icon: CheckCircle2, color: 'text-teal-600' },
  error: { label: 'Submission failed', icon: CircleX, color: 'text-rose-600' },
};

function makeFileEntry(file) {
  return {
    id: `${file.name}-${file.size}-${file.lastModified}-${crypto.randomUUID()}`,
    file,
    name: file.name,
    status: 'pending',
    result: null,
    error: null,
  };
}

export default function Upload() {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const [files, setFiles] = useState([]);
  const [author, setAuthor] = useState('');
  const [school, setSchool] = useState('');
  const [district, setDistrict] = useState('');
  const [keyStage, setKeyStage] = useState('KS1');
  const [gradeLevels, setGradeLevels] = useState(gradeOptionsByStage.KS1[0]);
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

  function addFiles(fileList) {
    const entries = Array.from(fileList || []).map(makeFileEntry);
    setFiles((current) => [...current, ...entries]);
    if (inputRef.current) inputRef.current.value = '';
  }

  function handleDrop(event) {
    event.preventDefault();
    addFiles(event.dataTransfer.files);
  }

  function updateFile(id, changes) {
    setFiles((current) => current.map((file) => (file.id === id ? { ...file, ...changes } : file)));
  }

  function changeKeyStage(value) {
    setKeyStage(value);
    setGradeLevels(gradeOptionsByStage[value][0]);
  }

  function toggleKeyword(id) {
    setSelectedKeywordIds((current) => (
      current.includes(id) ? current.filter((keywordId) => keywordId !== id) : [...current, id]
    ));
  }

  async function createKeyword() {
    const name = newKeyword.trim();
    if (!name) return;
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
      const { file_url: fileUrl } = await api.uploads.create(file.file);
      updateFile(file.id, { status: 'analyzing' });
      const result = await api.submitManuscript({
        manuscript_file_url: fileUrl,
        original_filename: file.name,
        key_stage: keyStage,
        grade_levels: gradeLevels,
        author: author.trim(),
        school: school.trim(),
        district: district.trim(),
        ...(selectedKeywordIds.length > 0 ? { keyword_ids: selectedKeywordIds } : {}),
      });
      updateFile(file.id, { status: 'complete', result });
      return result;
    } catch (error) {
      updateFile(file.id, { status: 'error', error: error.message || 'Submission failed.' });
      return null;
    }
  }

  async function submitAll() {
    if (!metadataIsValid) {
      setShowValidation(true);
      return;
    }

    setShowValidation(false);
    setProcessing(true);
    const pending = files.filter((file) => file.status === 'pending');
    const results = [];

    for (const file of pending) results.push(await submitFile(file));

    setProcessing(false);
    if (pending.length === 1 && results[0]?.innovation_id) {
      navigate(`/innovations/${results[0].innovation_id}`);
    }
  }

  return (
    <div className="page-shell max-w-6xl space-y-6">
      <header>
        <p className="page-eyebrow">Submission desk</p>
        <h1 className="page-title">Upload Innovation Manuscripts</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload searchable PDF, DOCX, TXT, or Markdown manuscripts. Each submission is prepared for
          assessment against the five-criterion Innovation Scalability Framework.
        </p>
      </header>

      <Card className="p-5">
        <h2 className="mb-4 text-sm font-semibold">Batch metadata</h2>
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
        </div>
      </Card>

      <Card className="p-5">
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

      <Card
        className="cursor-pointer border-2 border-dashed p-8 text-center transition-colors hover:border-primary/40"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDrop={handleDrop}
        onDragOver={(event) => event.preventDefault()}
        role="button"
        tabIndex={0}
        aria-label="Select innovation manuscript files"
      >
        <input ref={inputRef} type="file" multiple accept=".pdf,.docx,.txt,.md" onChange={(event) => addFiles(event.target.files)} onClick={(event) => event.stopPropagation()} className="hidden" aria-label="Innovation manuscript files" />
        <CloudUpload className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
        <p className="text-sm font-medium">Click to select or drag and drop manuscripts</p>
        <p className="mt-1 text-xs text-muted-foreground">Supports searchable PDF, DOCX, TXT, and Markdown — multiple files allowed</p>
      </Card>

      {files.length > 0 && (
        <Card className="p-5">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-sm font-semibold">
              Files ({files.length})
              {completedCount > 0 && <span className="ml-2 text-teal-600">· {completedCount} submitted</span>}
            </h2>
            <Button type="button" onClick={submitAll} disabled={processing || pendingCount === 0}>
              {processing ? <><LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> Processing…</> : <>Submit all ({pendingCount})</>}
            </Button>
          </div>
          {showValidation && !metadataIsValid && <p role="alert" className="mb-3 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">Complete the required batch metadata before submitting.</p>}
          <div className="space-y-2">
            {files.map((file) => {
              const status = fileStatus[file.status];
              const StatusIcon = status.icon;
              return (
                <div key={file.id} className="flex flex-wrap items-center gap-3 rounded-md border border-border/60 bg-card px-3 py-2.5">
                  <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{file.name}</div>
                    <div className={`mt-0.5 text-xs ${file.status === 'error' ? 'text-rose-600' : status.color}`}>
                      {file.status === 'error' ? file.error : status.label}
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
                  {file.status === 'pending' && (
                    <button type="button" onClick={() => setFiles((current) => current.filter((entry) => entry.id !== file.id))} className="text-muted-foreground hover:text-rose-600" aria-label={`Remove ${file.name}`}>
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}

function RequiredMark() {
  return <span className="text-rose-600" aria-hidden="true">*</span>;
}

function RequiredTextField({ id, label, value, onChange, placeholder, invalid }) {
  return (
    <div>
      <Label htmlFor={id} className="text-xs">{label} <RequiredMark /></Label>
      <Input id={id} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} required aria-invalid={invalid} className="mt-1" />
      {invalid && <p className="mt-1 text-xs text-rose-600">{label} is required.</p>}
    </div>
  );
}
