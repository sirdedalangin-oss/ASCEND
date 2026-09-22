import { useState, useEffect } from 'react';
import { api } from '@/api/client';
import { useAuth } from '@/lib/AuthContext';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Search, Loader2 } from 'lucide-react';
import InnovationCard from '@/components/InnovationCard';

export default function Innovations() {
  const { user } = useAuth();
  const [innovations, setInnovations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [focusFilter, setFocusFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.innovations.list({ sort: '-created_at', limit: 200 })
      .then((data) => {
        setInnovations(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = innovations.filter((inv) => {
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
          Browse and search all submitted innovation manuscripts and their evaluation results.
        </p>
      </div>

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
      ) : filtered.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-sm text-muted-foreground">No innovations match your filters.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((inv) => (
            <InnovationCard
              key={inv.id}
              innovation={inv}
              onDelete={user?.role === 'admin' || (inv.framework_score == null && inv.created_by_id === user?.id) ? setDeleteTarget : undefined}
            />
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
