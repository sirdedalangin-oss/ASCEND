import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserPlus, Mail, Loader2, CheckCircle2 } from 'lucide-react';
import AuthLayout from '@/components/AuthLayout';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [delivery, setDelivery] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await api.auth.register({ name, email });
      setDelivery(result.mail_delivery);
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      icon={UserPlus}
      title="Create your account"
      subtitle="Use your Gmail address to join the Project ASCEND workspace."
      footer={<>Already have an account? <Link to="/login" className="text-primary font-medium hover:underline">Log in</Link></>}
    >
      {delivery ? (
        <div className="space-y-5 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-primary" aria-hidden="true" />
          <div>
            <h2 className="text-lg font-semibold">Account created</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {delivery === 'development_log'
                ? 'Email delivery is in local development mode. An administrator must configure SMTP before temporary passwords can arrive in Gmail.'
                : `We sent a temporary password to ${email}. Use it to log in, then create your own password.`}
            </p>
          </div>
          <Button asChild className="w-full h-11"><Link to="/login">Go to log in</Link></Button>
        </div>
      ) : <>
      {error && <div role="alert" className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="h-12" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@gmail.com" pattern="[a-zA-Z0-9._%+\-]+@gmail\.com" title="Use a Gmail address" className="pl-10 h-12" required />
          </div>
        </div>
        <p className="rounded-lg border border-primary/15 bg-primary/5 p-3 text-sm leading-6 text-muted-foreground">We will email a temporary password. You will replace it immediately after your first log in.</p>
        <Button type="submit" className="w-full h-12 font-medium" disabled={loading}>
          {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating account...</> : 'Create account & email password'}
        </Button>
      </form>
      </>}
    </AuthLayout>
  );
}
