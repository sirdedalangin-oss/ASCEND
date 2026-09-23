import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Award,
  BadgeCheck,
  BookOpenCheck,
  ChevronLeft,
  ChevronRight,
  CircleDot,
  Crown,
  Download,
  FolderCheck,
  Medal,
  SearchX,
  ShieldCheck,
  Sparkles,
  Star,
  UsersRound,
} from 'lucide-react';
import { api } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { manuscriptUrl } from '@/lib/manuscriptUrl';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const PAGE_SIZE = 10;

const levelAppearance = {
  'Platinum Scalable Innovation': {
    icon: Crown, accent: 'text-cyan-800', surface: 'bg-cyan-50', border: 'border-cyan-200', marker: 'bg-cyan-700',
  },
  'Gold Scalable Innovation': {
    icon: Star, accent: 'text-amber-800', surface: 'bg-amber-50', border: 'border-amber-200', marker: 'bg-amber-500',
  },
  'Silver Scalable Innovation': {
    icon: Medal, accent: 'text-slate-700', surface: 'bg-slate-100', border: 'border-slate-300', marker: 'bg-slate-500',
  },
  'Bronze Scalable Innovation': {
    icon: Award, accent: 'text-orange-800', surface: 'bg-orange-50', border: 'border-orange-200', marker: 'bg-orange-600',
  },
  'Qualified Scalable Innovation': {
    icon: BadgeCheck, accent: 'text-teal-800', surface: 'bg-teal-50', border: 'border-teal-200', marker: 'bg-teal-700',
  },
  'Not Yet Recommended for Scaling': {
    icon: CircleDot, accent: 'text-rose-800', surface: 'bg-rose-50', border: 'border-rose-200', marker: 'bg-rose-600',
  },
};

const adoptionTeams = [
  'Instructional Improvement Engine',
  'Coaching and Support Spine',
  'Data, Knowledge & Innovation Backbone',
];

function rangeLabel(level) {
  return level.minimum === 0 ? `Below ${level.maximum + 1}` : `${level.minimum}–${level.maximum}`;
}

function pageNumbers(currentPage, totalPages) {
  if (totalPages <= 5) return Array.from({ length: totalPages }, (_, index) => index + 1);
  const start = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
  return Array.from({ length: 5 }, (_, index) => start + index);
}

export default function ScalableLibrary() {
  const [innovations, setInnovations] = useState([]);
  const [framework, setFramework] = useState(null);
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api.evaluations.list({ limit: 500 }), api.framework.get()])
      .then(([records, frameworkData]) => {
        setInnovations(records);
        setFramework(frameworkData);
      })
      .catch((requestError) => setError(requestError.message || 'Unable to load the scalable innovations library.'))
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(() => framework?.levels.map((level) => ({
    ...level,
    innovations: innovations.filter((innovation) => innovation.framework_level === level.title),
    appearance: levelAppearance[level.title],
  })) || [], [framework, innovations]);

  const selectedCategory = selectedLevel
    ? categories.find((category) => category.title === selectedLevel)
    : null;
  const selectedInnovations = selectedCategory?.innovations || [];
  const totalPages = Math.max(1, Math.ceil(selectedInnovations.length / PAGE_SIZE));
  const pageItems = selectedInnovations.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const scalableCount = innovations.filter((innovation) => innovation.is_scalable).length;

  function openCategory(title) {
    setCurrentPage(1);
    setSelectedLevel(title);
  }

  function changePage(page) {
    setCurrentPage(page);
    document.querySelector('[data-library-results]')?.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <div className="page-shell space-y-7">
      <header className="relative overflow-hidden rounded-2xl bg-[#173e4b] px-5 py-7 text-white shadow-[0_18px_45px_-32px_rgba(14,48,59,0.8)] sm:px-7 sm:py-8">
        <span className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full border-[46px] border-white/[0.04]" aria-hidden="true" />
        <span className="pointer-events-none absolute bottom-0 right-1/3 h-24 w-48 rounded-full bg-cyan-300/[0.06] blur-3xl" aria-hidden="true" />
        <div className="relative flex min-w-0 flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="mb-3 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-cyan-100/75"><FolderCheck className="h-4 w-4" /> Evidence library</p>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Scalable Innovations Library</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/65">Browse every assessed innovation by its framework classification. Select a level to review its evidence and open the full innovation record.</p>
          </div>
          {!loading && !error && (
            <div className="library-summary flex shrink-0 overflow-hidden rounded-xl border border-white/15 bg-white/[0.07]" aria-label="Library summary">
              <div className="min-w-0 flex-1 px-3 py-3.5 sm:px-4"><div className="text-[9px] font-bold uppercase tracking-[0.16em] text-white/50">Assessed</div><div className="mt-1 text-2xl font-semibold">{innovations.length}</div></div>
              <div className="min-w-0 flex-1 border-x border-white/10 px-3 py-3.5 sm:px-4"><div className="text-[9px] font-bold uppercase tracking-[0.16em] text-white/50">Scalable</div><div className="mt-1 text-2xl font-semibold text-cyan-100">{scalableCount}</div></div>
              <div className="min-w-0 flex-1 px-3 py-3.5 sm:px-4"><div className="text-[9px] font-bold uppercase tracking-[0.16em] text-white/50">Levels</div><div className="mt-1 text-2xl font-semibold">6</div></div>
            </div>
          )}
        </div>
      </header>

      {error && <Card role="alert" className="border-destructive/20 bg-destructive/5 p-5 text-sm text-destructive">{error}</Card>}

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Loading library categories">
          {Array.from({ length: 6 }, (_, index) => <div key={index} className="h-64 animate-pulse rounded-2xl border bg-card" />)}
        </div>
      ) : !error && (
        <section aria-labelledby="level-categories-heading">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div><p className="page-eyebrow mb-1"><ShieldCheck className="h-4 w-4" /> Classification</p><h2 id="level-categories-heading" className="text-xl font-semibold">Framework levels</h2><p className="mt-1 text-sm text-muted-foreground">Six classifications from exemplary models to innovations requiring further development.</p></div>
            <p className="rounded-full border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground">10 results per page</p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category, index) => {
              const appearance = category.appearance;
              const Icon = appearance?.icon || Sparkles;
              return (
                <button
                  type="button"
                  key={category.title}
                  onClick={() => openCategory(category.title)}
                  className={`group relative min-w-0 overflow-hidden rounded-2xl border bg-card p-5 text-left shadow-[0_10px_28px_-24px_rgba(21,56,67,0.5)] transition duration-200 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${appearance?.border || ''}`}
                  aria-label={`Open ${category.title}, ${category.innovations.length} innovations`}
                  data-library-level-card
                >
                  <span className={`absolute inset-x-0 top-0 h-1 ${appearance?.marker || 'bg-primary'}`} aria-hidden="true" />
                  <div className="flex items-start justify-between gap-4">
                    <span className="flex items-center gap-2"><span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${appearance?.surface || 'bg-primary/10'} ${appearance?.accent || 'text-primary'}`}><Icon className="h-5 w-5" aria-hidden="true" /></span><span className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Level {String(index + 1).padStart(2, '0')}</span></span>
                    <span className="text-right"><span className="block text-3xl font-semibold tracking-tight">{category.innovations.length}</span><span className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Innovations</span></span>
                  </div>
                  <div className="mt-5">
                    <div className="mb-2 flex items-start justify-between gap-2"><h3 className="min-w-0 text-base font-semibold leading-5">{category.title}</h3><span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${appearance?.surface || 'bg-primary/10'} ${appearance?.accent || 'text-primary'}`}>{rangeLabel(category)} points</span></div>
                    <p className="line-clamp-3 min-h-[4.5rem] text-sm leading-6 text-muted-foreground">{category.description}</p>
                  </div>
                  <div className="mt-5 flex items-center justify-between border-t pt-4 text-sm font-semibold text-primary"><span>View innovations</span><ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" /></div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      <Card className="border-primary/15 bg-primary/[0.04] p-5 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><UsersRound className="h-5 w-5" /></span><div><h2 className="font-semibold">Adoption pathways</h2><p className="mt-1 max-w-xl text-sm leading-6 text-muted-foreground">Assessment results support the Big Bold Move teams responsible for moving effective practice across the division.</p></div></div>
          <div className="flex flex-wrap gap-2">{adoptionTeams.map((team) => <span key={team} className="rounded-full border bg-card px-3 py-1.5 text-xs font-medium">{team}</span>)}</div>
        </div>
      </Card>

      <Dialog open={Boolean(selectedCategory)} onOpenChange={(open) => !open && setSelectedLevel(null)}>
        {selectedCategory && (
          <DialogContent className="max-h-[92dvh] w-[calc(100vw-2rem)] max-w-5xl gap-0 overflow-hidden p-0 sm:rounded-2xl">
            <DialogHeader className="border-b bg-card px-5 py-5 pr-12 text-left sm:px-6">
              <div className="flex items-start gap-3">
                {(() => {
                  const Icon = selectedCategory.appearance?.icon || ShieldCheck;
                  return <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${selectedCategory.appearance?.surface} ${selectedCategory.appearance?.accent}`}><Icon className="h-5 w-5" /></span>;
                })()}
                <div className="min-w-0"><DialogTitle className="break-words text-xl">{selectedCategory.title}</DialogTitle><DialogDescription className="mt-1 leading-5">Score range {rangeLabel(selectedCategory)} · {selectedInnovations.length} {selectedInnovations.length === 1 ? 'innovation' : 'innovations'}</DialogDescription></div>
              </div>
            </DialogHeader>

            <div data-library-results className="min-h-0 overflow-x-hidden overflow-y-auto px-4 py-4 sm:px-6">
              {pageItems.length === 0 ? (
                <div className="flex min-h-64 flex-col items-center justify-center px-4 text-center"><span className={`flex h-14 w-14 items-center justify-center rounded-2xl ${selectedCategory.appearance?.surface} ${selectedCategory.appearance?.accent}`}><SearchX className="h-6 w-6" /></span><h3 className="mt-4 font-semibold">No innovations in this level yet</h3><p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">Innovations will appear here after an administrator records all five framework ratings and the calculated score falls within this range.</p></div>
              ) : (
                <div className="space-y-3">
                  {pageItems.map((innovation) => (
                    <article key={innovation.id} className="min-w-0 rounded-xl border bg-card p-4 transition hover:border-primary/30 hover:shadow-sm sm:p-5">
                      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${innovation.learning_focus === 'literacy' ? 'bg-violet-50 text-violet-700' : 'bg-teal-50 text-teal-700'}`}>{innovation.learning_focus || 'Unspecified'}</span><span className="text-xs text-muted-foreground">{innovation.status === 'validated' ? 'Panel validated' : 'Assessed'}</span></div><h3 className="mt-2 break-words font-semibold leading-6">{innovation.title}</h3><p className="mt-1 break-words text-sm text-muted-foreground">{[innovation.author, innovation.school, innovation.district].filter(Boolean).join(' · ') || 'Proponent details not provided'}</p>{innovation.summary && <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">{innovation.summary}</p>}</div>
                        <div className="flex shrink-0 items-center justify-between gap-4 border-t pt-3 sm:flex-col sm:items-end sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0">
                          <div className="text-left sm:text-right">
                            <div className={`text-2xl font-semibold ${selectedCategory.appearance?.accent}`}>{innovation.framework_score}<span className="text-xs font-normal text-muted-foreground">/100</span></div>
                            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Final score</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button asChild size="sm" variant="outline"><Link to={`/innovations/${innovation.id}`}>Open record <BookOpenCheck className="h-4 w-4" /></Link></Button>
                            {innovation.manuscript_file_url ? (
                              <Button asChild size="icon" variant="outline">
                                <a href={manuscriptUrl(innovation.manuscript_file_url)} download aria-label={`Download manuscript for ${innovation.title}`} title="Download manuscript"><Download aria-hidden="true" /></a>
                              </Button>
                            ) : (
                              <Button type="button" size="icon" variant="outline" disabled aria-label={`No manuscript available for ${innovation.title}`} title="No manuscript available"><Download aria-hidden="true" /></Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>

            {selectedInnovations.length > 0 && (
              <footer className="flex flex-col gap-3 border-t bg-muted/30 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <p className="text-center text-xs text-muted-foreground sm:text-left">Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, selectedInnovations.length)} of {selectedInnovations.length}</p>
                <nav aria-label={`${selectedCategory.title} pages`} className="flex flex-wrap items-center justify-center gap-1">
                  <Button type="button" variant="ghost" size="sm" onClick={() => changePage(currentPage - 1)} disabled={currentPage === 1} aria-label="Previous page"><ChevronLeft className="h-4 w-4" /><span className="hidden sm:inline">Previous</span></Button>
                  {pageNumbers(currentPage, totalPages).map((page) => <Button type="button" key={page} variant={page === currentPage ? 'default' : 'ghost'} size="icon" className="h-8 w-8" onClick={() => changePage(page)} aria-label={`Page ${page}`} aria-current={page === currentPage ? 'page' : undefined}>{page}</Button>)}
                  <Button type="button" variant="ghost" size="sm" onClick={() => changePage(currentPage + 1)} disabled={currentPage === totalPages} aria-label="Next page"><span className="hidden sm:inline">Next</span><ChevronRight className="h-4 w-4" /></Button>
                </nav>
              </footer>
            )}
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
