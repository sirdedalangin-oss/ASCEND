import { useState } from 'react';
import { KeyRound, Loader2 } from 'lucide-react';
import { api } from '@/api/client';
import AuthLayout from '@/components/AuthLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/AuthContext';

export default function ChangePassword() {
  const { logout, user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError('');
    if (password !== confirmation) {
      setError('New passwords do not match.');
      return;
    }
    setSaving(true);
    try {
      await api.auth.changePassword({
        current_password: currentPassword,
        password,
        password_confirmation: confirmation,
      });
      window.location.href = '/';
    } catch (requestError) {
      setError(requestError.message || 'Unable to change password.');
      setSaving(false);
    }
  }

  return (
    <AuthLayout
      icon={KeyRound}
      title={user?.must_change_password ? 'Secure your account' : 'Change your password'}
      subtitle={user?.must_change_password ? 'Replace your temporary password before entering the workspace.' : 'Keep your ASCEND account secure with a new password.'}
      footer={<button type="button" onClick={() => logout()} className="font-medium text-primary hover:underline">Log out</button>}
    >
      {error && <div role="alert" className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-2"><Label htmlFor="temporary-password">Temporary password</Label><Input id="temporary-password" type="password" autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} required className="h-11" /></div>
        <div className="space-y-2"><Label htmlFor="new-password">New password</Label><Input id="new-password" type="password" autoComplete="new-password" minLength={12} value={password} onChange={(event) => setPassword(event.target.value)} required className="h-11" /><p className="text-xs text-muted-foreground">At least 12 characters with uppercase, lowercase, and a number.</p></div>
        <div className="space-y-2"><Label htmlFor="confirm-password">Confirm new password</Label><Input id="confirm-password" type="password" autoComplete="new-password" minLength={12} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} required className="h-11" /></div>
        <Button type="submit" className="h-11 w-full" disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin" />}Set password and continue</Button>
      </form>
    </AuthLayout>
  );
}
