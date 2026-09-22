import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Upload, Lightbulb, FolderCheck, Map, ClipboardCheck, ListChecks, LogOut, Menu, X, UsersRound, ArrowUpRight, KeyRound } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/upload', label: 'Upload Manuscripts', icon: Upload },
  { to: '/innovations', label: 'All Innovations', icon: Lightbulb },
  { to: '/evaluations', label: 'Assessments', icon: ListChecks },
  { to: '/scalable-library', label: 'Scalable Library', icon: FolderCheck },
  { to: '/strategy-map', label: 'Strategy Map 2030', icon: Map },
  { to: '/criteria', label: 'Scalability Framework', icon: ClipboardCheck },
];

export default function Layout() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const SidebarContent = () => (
    <>
      <div className="border-b border-white/10 px-5 py-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white p-1 shadow-sm">
            <img
              src="/deped-bulacan-logo.png"
              alt="DepEd Bulacan"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-bold leading-tight tracking-tight">Project ASCEND</div>
            <div className="mt-1 text-[11px] leading-tight text-white/60">SDO Bulacan</div>
          </div>
        </div>
      </div>

      <nav className="scrollbar-thin flex-1 space-y-1 overflow-y-auto px-3 py-5" aria-label="Main navigation">
        <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white/45">Workspace</p>
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = location.pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setMobileOpen(false)}
              aria-current={active ? 'page' : undefined}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                active
                  ? 'bg-white/15 font-semibold text-white shadow-sm'
                  : 'text-white/72 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
        {user?.role === 'admin' && <>
          <p className="px-3 pb-2 pt-6 text-[10px] font-bold uppercase tracking-[0.2em] text-white/45">Administration</p>
          <Link to="/admin/users" onClick={() => setMobileOpen(false)} aria-current={location.pathname === '/admin/users' ? 'page' : undefined} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${location.pathname === '/admin/users' ? 'bg-white/15 font-semibold text-white shadow-sm' : 'text-white/72 hover:bg-white/10 hover:text-white'}`}><UsersRound className="h-4 w-4" />User accounts</Link>
        </>}
        <p className="px-3 pb-2 pt-6 text-[10px] font-bold uppercase tracking-[0.2em] text-white/45">Account</p>
        <Link to="/change-password" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/72 transition-colors hover:bg-white/10 hover:text-white"><KeyRound className="h-4 w-4" /> Change password</Link>
      </nav>

      <div className="border-t border-white/10 p-4">
        <div className="rounded-xl bg-white/[0.07] p-3">
        <div className="flex items-center justify-between gap-2 text-xs text-white/80">
          <div className="min-w-0"><div className="truncate font-semibold text-white">{user?.name || user?.email}</div><div className="mt-1 capitalize text-white/50">{user?.role || 'User'} account</div></div>
          <button onClick={() => logout()} className="rounded-lg p-2 hover:bg-white/10" aria-label="Log out" title="Log out">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
        </div>
      </div>
    </>
  );

  return (
    <div className="flex h-dvh w-full min-w-0 overflow-hidden bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 flex-shrink-0 flex-col bg-[#173e4b] text-white sm:flex">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <>
          <div
            className="sm:hidden fixed inset-0 bg-black/40 z-40"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 z-50 flex w-[min(18rem,86vw)] flex-col bg-[#173e4b] text-white shadow-2xl animate-in slide-in-from-left sm:hidden">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-3 right-3 text-primary-foreground/70 hover:text-primary-foreground"
              aria-label="Close navigation menu"
            >
              <X className="w-5 h-5" />
            </button>
            <SidebarContent />
          </aside>
        </>
      )}

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Mobile header */}
        <div className="flex items-center gap-3 border-b border-white/10 bg-[#173e4b] px-4 py-3 text-white sm:hidden">
          <button onClick={() => setMobileOpen(true)} aria-label="Open navigation menu">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center overflow-hidden">
              <img
                src="/deped-bulacan-logo.png"
                alt="DepEd Bulacan"
                className="w-full h-full object-contain"
              />
            </div>
            <span className="font-bold text-sm">Project ASCEND</span>
          </div>
        </div>

        <main className="scrollbar-thin min-w-0 flex-1 overflow-x-hidden overflow-y-auto">
          <Outlet />
          <footer className="page-shell flex flex-wrap items-center justify-between gap-2 !pt-0 pb-6 text-xs text-muted-foreground"><span>Project ASCEND · Schools Division Office of Bulacan</span><span className="inline-flex items-center gap-1">Innovation to scale <ArrowUpRight className="h-3 w-3" /></span></footer>
        </main>
      </div>
    </div>
  );
}
