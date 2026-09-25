import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight, FileText, MapPin, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const PAGE_SIZE = 10;

function pageNumbers(currentPage, totalPages) {
  if (totalPages <= 5) return Array.from({ length: totalPages }, (_, index) => index + 1);
  const start = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
  return Array.from({ length: 5 }, (_, index) => start + index);
}

export default function DashboardResultsDialog({ collection, onClose }) {
  const [currentPage, setCurrentPage] = useState(1);
  const resultsRef = useRef(null);
  const { title, description, items, icon: Icon } = collection;
  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const page = Math.min(currentPage, totalPages);
  const pageItems = items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function changePage(nextPage) {
    setCurrentPage(nextPage);
    resultsRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex max-h-[92dvh] w-[calc(100vw-2rem)] max-w-4xl flex-col gap-0 overflow-hidden p-0 sm:rounded-2xl">
        <DialogHeader className="shrink-0 border-b bg-card px-5 py-5 pr-12 text-left sm:px-6">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="h-5 w-5" aria-hidden="true" /></span>
            <div className="min-w-0"><DialogTitle className="break-words text-xl">{title}</DialogTitle><DialogDescription className="mt-1 leading-5">{description} · {items.length} {items.length === 1 ? 'innovation' : 'innovations'}</DialogDescription></div>
          </div>
        </DialogHeader>

        <div ref={resultsRef} className="min-h-0 overflow-x-hidden overflow-y-auto px-4 py-4 sm:px-6">
          {pageItems.length === 0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center text-center"><span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary"><FileText className="h-6 w-6" /></span><h3 className="mt-4 font-semibold">No innovations to show</h3><p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">Records will appear here when innovations meet this card&apos;s criteria.</p></div>
          ) : (
            <div className="space-y-3">
              {pageItems.map((innovation) => (
                <article key={innovation.id} className="min-w-0 rounded-xl border bg-card p-4 transition-colors hover:border-primary/30 sm:p-5">
                  <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">{innovation.learning_focus || 'Unspecified focus'}</span><span className="text-xs text-muted-foreground">{innovation.framework_score == null ? 'Awaiting assessment' : innovation.status === 'validated' ? 'Panel validated' : 'Assessed'}</span></div>
                      <h3 className="mt-2 break-words font-semibold leading-6">{innovation.title}</h3>
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground"><span className="inline-flex min-w-0 items-center gap-1"><UserRound className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />{innovation.author || 'Author not provided'}</span><span className="inline-flex min-w-0 items-center gap-1"><MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />{innovation.school || 'School not provided'}</span></div>
                    </div>
                    <div className="flex shrink-0 items-center justify-between gap-3 border-t pt-3 sm:flex-col sm:items-end sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0">
                      {innovation.framework_score != null ? <span className="text-sm font-semibold tabular-nums text-primary">{innovation.framework_score}<span className="font-normal text-muted-foreground"> / 100</span></span> : <span className="text-xs text-amber-700">Pending score</span>}
                      <Button asChild size="sm" variant="outline"><Link to={`/innovations/${innovation.id}`}>Open record <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link></Button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        {items.length > 0 && <footer className="flex shrink-0 flex-col gap-3 border-t bg-muted/30 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"><p className="text-center text-xs text-muted-foreground sm:text-left">Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, items.length)} of {items.length}</p><nav aria-label={`${title} pages`} className="flex flex-wrap items-center justify-center gap-1"><Button type="button" variant="ghost" size="sm" onClick={() => changePage(page - 1)} disabled={page === 1} aria-label="Previous page"><ChevronLeft className="h-4 w-4" /><span className="hidden sm:inline">Previous</span></Button>{pageNumbers(page, totalPages).map((pageNumber) => <Button type="button" key={pageNumber} variant={pageNumber === page ? 'default' : 'ghost'} size="icon" className="h-8 w-8" onClick={() => changePage(pageNumber)} aria-label={`Page ${pageNumber}`} aria-current={pageNumber === page ? 'page' : undefined}>{pageNumber}</Button>)}<Button type="button" variant="ghost" size="sm" onClick={() => changePage(page + 1)} disabled={page === totalPages} aria-label="Next page"><span className="hidden sm:inline">Next</span><ChevronRight className="h-4 w-4" /></Button></nav></footer>}
      </DialogContent>
    </Dialog>
  );
}
