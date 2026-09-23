import { useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { KeyRound, Loader2, Mail, Pencil, Plus, Search, ShieldCheck, UsersRound } from 'lucide-react';
import { api } from '@/api/client';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

const emptyForm = { name: '', email: '', role: 'user', is_active: true };

export default function AdminUsers() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [resettingId, setResettingId] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (user?.role !== 'admin') return;
    api.adminUsers.list().then(setAccounts).catch((requestError) => setError(requestError.message)).finally(() => setLoading(false));
  }, [user?.role]);

  const filtered = useMemo(() => accounts.filter((account) =>
    `${account.name} ${account.email} ${account.role}`.toLowerCase().includes(query.trim().toLowerCase()),
  ), [accounts, query]);

  if (user?.role !== 'admin') return <Navigate to="/" replace />;

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setError('');
    setDialogOpen(true);
  }

  function openEdit(account) {
    setEditing(account);
    setForm({ name: account.name, email: account.email, role: account.role, is_active: account.is_active });
    setError('');
    setDialogOpen(true);
  }

  async function save(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const result = editing
        ? await api.adminUsers.update(editing.id, form)
        : await api.adminUsers.create(form);
      setAccounts((current) => editing
        ? current.map((account) => account.id === editing.id ? result.user : account)
        : [...current, result.user].sort((a, b) => a.name.localeCompare(b.name)));
      setDialogOpen(false);
      setNotice(result.mail_delivery === 'development_log'
        ? 'Account saved. Email is logged locally; configure SMTP for inbox delivery.'
        : editing ? 'Account updated.' : 'Account created and temporary password emailed.');
    } catch (requestError) {
      setError(requestError.message || 'Unable to save account.');
    } finally {
      setSaving(false);
    }
  }

  async function resetPassword(account) {
    setResettingId(account.id);
    setError('');
    try {
      const result = await api.adminUsers.resetPassword(account.id);
      setAccounts((current) => current.map((item) => item.id === account.id ? { ...item, must_change_password: true } : item));
      setNotice(result.mail_delivery === 'development_log'
        ? 'Temporary password reset. Email is logged locally; configure SMTP for inbox delivery.'
        : `A new temporary password was emailed to ${account.email}.`);
    } catch (requestError) {
      setError(requestError.message || 'Unable to reset password.');
    } finally {
      setResettingId(null);
    }
  }

  return (
    <div className="page-shell space-y-6">
      <header className="page-header">
        <div>
          <p className="page-eyebrow"><ShieldCheck className="h-4 w-4" /> Administration</p>
          <h1 className="page-title">User accounts</h1>
          <p className="page-description">Create access, manage roles, and issue temporary passwords for the ASCEND workspace.</p>
        </div>
        <Button onClick={openCreate} className="shrink-0"><Plus className="h-4 w-4" /> Create user</Button>
      </header>

      {notice && <div role="status" className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary">{notice}</div>}
      {error && !dialogOpen && <div role="alert" className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">{error}</div>}

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-5"><p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Accounts</p><p className="mt-2 text-3xl font-semibold">{accounts.length}</p></Card>
        <Card className="p-5"><p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Active</p><p className="mt-2 text-3xl font-semibold text-primary">{accounts.filter((account) => account.is_active).length}</p></Card>
        <Card className="p-5"><p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Administrators</p><p className="mt-2 text-3xl font-semibold">{accounts.filter((account) => account.role === 'admin' && account.is_active).length}</p></Card>
      </div>

      <div className="relative max-w-xl">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, email, or role" aria-label="Search accounts" className="h-11 pl-10" />
      </div>

      <div className="space-y-3">
        {loading ? <Card className="flex items-center justify-center p-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></Card>
          : filtered.length === 0 ? <Card className="flex flex-col items-center p-12 text-center"><UsersRound className="h-9 w-9 text-muted-foreground" /><p className="mt-3 font-medium">No accounts found</p><p className="mt-1 text-sm text-muted-foreground">Try another search or create a user.</p></Card>
            : filtered.map((account) => (
              <Card key={account.id} className="flex min-w-0 flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-bold text-primary">{account.name.slice(0, 2).toUpperCase()}</div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2"><h2 className="break-words font-semibold">{account.name}</h2>{account.id === user.id && <span className="text-xs text-muted-foreground">You</span>}</div>
                    <p className="break-all text-sm text-muted-foreground">{account.email}</p>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs">
                      <span className="rounded-full bg-secondary px-2.5 py-1 font-medium capitalize">{account.role}</span>
                      <span className={`rounded-full px-2.5 py-1 font-medium ${account.is_active ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>{account.is_active ? 'Active' : 'Inactive'}</span>
                      {account.must_change_password && <span className="rounded-full bg-amber-50 px-2.5 py-1 font-medium text-amber-800">Password change due</span>}
                    </div>
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2 pl-14 sm:pl-0">
                  <Button variant="outline" size="sm" onClick={() => openEdit(account)}><Pencil className="h-4 w-4" /> Edit</Button>
                  {account.id !== user.id && <Button variant="outline" size="sm" onClick={() => resetPassword(account)} disabled={resettingId === account.id}>{resettingId === account.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />} Reset password</Button>}
                </div>
              </Card>
            ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90dvh] w-[calc(100vw-2rem)] max-w-lg overflow-y-auto">
          <form onSubmit={save} className="space-y-5">
            <DialogHeader><DialogTitle>{editing ? 'Edit user' : 'Create user'}</DialogTitle><DialogDescription>{editing ? 'Update account details and access.' : 'A temporary password will be emailed to the new user.'}</DialogDescription></DialogHeader>
            {error && <div role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
            <div className="space-y-2"><Label htmlFor="account-name">Full name</Label><Input id="account-name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required maxLength={255} /></div>
            <div className="space-y-2"><Label htmlFor="account-email">Email address</Label><div className="relative"><Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input id="account-email" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="pl-10" required /></div>{editing && <p className="text-xs text-muted-foreground">Changing the address sends a new temporary password.</p>}</div>
            <div className="space-y-2"><Label>Role</Label><Select value={form.role} onValueChange={(role) => setForm({ ...form, role })} disabled={editing?.id === user.id}><SelectTrigger aria-label="Account role"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="user">User</SelectItem><SelectItem value="admin">Administrator</SelectItem></SelectContent></Select></div>
            {editing && <div className="flex items-center justify-between gap-4 rounded-xl border p-4"><div><Label htmlFor="account-active">Active account</Label><p className="text-xs text-muted-foreground">Inactive users cannot sign in.</p></div><Switch id="account-active" checked={form.is_active} onCheckedChange={(is_active) => setForm({ ...form, is_active })} disabled={editing.id === user.id} /></div>}
            <DialogFooter className="gap-2"><Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button><Button type="submit" disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin" />}{editing ? 'Save changes' : 'Create and email'}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
