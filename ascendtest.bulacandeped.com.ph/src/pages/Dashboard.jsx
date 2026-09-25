import { useState, useEffect } from 'react';
import { api } from '@/api/client';
import { Card } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { Activity, ArrowRight, BarChart3, BookOpen, Clock, FolderCheck, Lightbulb, MapPin, TrendingUp, Upload, UserRound } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import StatCard from '@/components/StatCard';
import DashboardResultsDialog from '@/components/DashboardResultsDialog';
import ASCENDWorkflow from '@/components/ascend/ASCENDWorkflow';
import DistrictFocusChart from '@/components/DistrictFocusChart';

const FOCUS_COLORS = ['#177b88', '#7665a8'];

export default function Dashboard() {
  const [innovations, setInnovations] = useState([]);
  const [framework, setFramework] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedResults, setSelectedResults] = useState(null);

  useEffect(() => {
    Promise.all([api.innovations.list({ sort: '-created_at', limit: 200 }), api.framework.get()])
      .then(([records, frameworkData]) => {
        setInnovations(records);
        setFramework(frameworkData);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const total = innovations.length;
  const scalable = innovations.filter((i) => i.framework_score != null && i.is_scalable).length;
  const evaluating = innovations.filter((i) => i.framework_score == null).length;
  const evaluated = innovations.filter((i) => i.framework_score != null);
  const avgScore = evaluated.length > 0 ? (evaluated.reduce((s, i) => s + i.framework_score, 0) / evaluated.length).toFixed(1) : '0.0';

  const numeracy = innovations.filter((i) => i.learning_focus === 'numeracy').length;
  const literacy = innovations.filter((i) => i.learning_focus === 'literacy').length;

  const focusData = [
    { name: 'Numeracy', value: numeracy },
    { name: 'Literacy', value: literacy },
  ];
  const focusTotal = numeracy + literacy;

  const criteriaData = framework?.criteria.map(({ key, label }) => ({
    criterion: label.replace(' Across the Division', '').replace(' Across School Contexts', '').replace(' and Implementation', ''),
    score: avg(key),
  })) || [];

  function avg(field) {
    const scored = evaluated.filter((i) => i.framework_ratings?.[field] != null);
    if (scored.length === 0) return 0;
    return Number((scored.reduce((s, i) => s + i.framework_ratings[field], 0) / scored.length).toFixed(1));
  }

  const recent = innovations.slice(0, 6);
  const resultCollections = {
    total: { title: 'Total innovations', description: 'All submitted manuscripts', icon: Lightbulb, items: innovations },
    scalable: { title: 'Determined scalable', description: 'Innovations identified as scalable', icon: FolderCheck, items: innovations.filter((innovation) => innovation.framework_score != null && innovation.is_scalable) },
    pending: { title: 'Awaiting assessment', description: 'Innovations without a framework score', icon: Clock, items: innovations.filter((innovation) => innovation.framework_score == null) },
    assessed: { title: 'Assessed innovations', description: 'Records included in the average score', icon: TrendingUp, items: evaluated },
    focus: { title: 'Learning focus distribution', description: 'Numeracy and literacy innovations', icon: BookOpen, items: innovations.filter((innovation) => ['numeracy', 'literacy'].includes(innovation.learning_focus)) },
    numeracy: { title: 'Numeracy innovations', description: 'Submitted innovations with a numeracy focus', icon: BookOpen, items: innovations.filter((innovation) => innovation.learning_focus === 'numeracy') },
    literacy: { title: 'Literacy innovations', description: 'Submitted innovations with a literacy focus', icon: BookOpen, items: innovations.filter((innovation) => innovation.learning_focus === 'literacy') },
    ratings: { title: 'Framework ratings', description: 'Innovations included in the ratings chart', icon: BarChart3, items: evaluated },
    district: { title: 'Innovations by district', description: 'Submitted innovations represented in the district chart', icon: MapPin, items: innovations },
    workflow: { title: 'Submitted innovations', description: 'ASCEND process stages are guidance; records are not assigned to a process stage', icon: Activity, items: innovations },
    recent: { title: 'Recent submissions', description: 'Submitted innovations, newest first', icon: BookOpen, items: innovations },
  };
  const activeCollection = selectedResults ? resultCollections[selectedResults] : null;

  function openResults(key) {
    if (!loading) setSelectedResults(key);
  }

  function cardInteraction(key, label) {
    return {
      role: 'button',
      tabIndex: loading ? -1 : 0,
      'aria-haspopup': 'dialog',
      'aria-label': `View ${label} results`,
      onClick: (event) => {
        if (!event.target.closest?.('a, button')) openResults(key);
      },
      onKeyDown: (event) => {
        if (event.target !== event.currentTarget) return;
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          openResults(key);
        }
      },
    };
  }

  return (
    <div className="page-shell space-y-7">
      <header className="relative overflow-hidden rounded-2xl bg-[#173e4b] px-5 py-6 text-white shadow-[0_18px_45px_-32px_rgba(14,48,59,0.8)] sm:px-7 sm:py-8">
        <span className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full border-[46px] border-white/[0.04]" aria-hidden="true" />
        <span className="pointer-events-none absolute bottom-0 right-1/3 h-24 w-48 rounded-full bg-cyan-300/[0.06] blur-3xl" aria-hidden="true" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/15 bg-white p-1.5 shadow-sm sm:h-16 sm:w-16"><img src="/ascend-logo.png" alt="Project ASCEND" className="h-full w-full object-contain" /></div>
            <div className="min-w-0">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-cyan-100/75">Project ASCEND · SDO Bulacan</p>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Innovation-to-Scale System</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/70">Assessment of Scalable Education Novelties and Development</p>
            </div>
          </div>
          <Link to="/upload" className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-[#173e4b] shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-cyan-50 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#173e4b] sm:w-auto"><Upload className="h-4 w-4" aria-hidden="true" /> Upload Manuscripts</Link>
        </div>
      </header>

      <section aria-labelledby="dashboard-overview-heading" className="space-y-4">
        <div><p className="page-eyebrow mb-1"><Activity className="h-4 w-4" /> At a glance</p><h2 id="dashboard-overview-heading" className="text-xl font-semibold">Portfolio overview</h2><p className="mt-1 text-sm text-muted-foreground">Current submission and assessment figures</p></div>
        <div className="grid grid-cols-1 gap-4 min-[440px]:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Lightbulb} label="Total Innovations" value={total} sublabel="All submitted manuscripts" color="teal" onClick={() => openResults('total')} disabled={loading} />
        <StatCard icon={FolderCheck} label="Determined Scalable" value={scalable} sublabel="Framework score ≥75" color="coral" onClick={() => openResults('scalable')} disabled={loading} />
        <StatCard icon={Clock} label="Awaiting Assessment" value={evaluating} sublabel="Needs five panel ratings" color="amber" onClick={() => openResults('pending')} disabled={loading} />
        <StatCard icon={TrendingUp} label="Average Score" value={avgScore} sublabel="Framework score / 100" color="blue" onClick={() => openResults('assessed')} disabled={loading} />
        </div>
      </section>

      <section aria-labelledby="dashboard-insights-heading" className="space-y-4">
        <div><p className="page-eyebrow mb-1"><BarChart3 className="h-4 w-4" /> Insights</p><h2 id="dashboard-insights-heading" className="text-xl font-semibold">Portfolio insights</h2><p className="mt-1 text-sm text-muted-foreground">Learning focus and framework rating patterns</p></div>
        <div className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-2">
          <Card onClick={(event) => { if (!event.target.closest?.('button')) openResults('focus'); }} className="min-w-0 cursor-pointer border-border/70 p-5 shadow-[0_10px_28px_-24px_rgba(21,56,67,0.55)] transition-colors hover:border-primary/35 sm:p-6">
            <div><h3 className="text-base font-semibold">Learning focus distribution</h3><p className="mt-1 text-xs text-muted-foreground">Numeracy and literacy submissions</p></div>
            {focusTotal > 0 ? (
              <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
                <div className="relative h-[230px] w-full min-w-0 sm:w-1/2">
                  <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={focusData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={86} paddingAngle={3} stroke="none">{focusData.map((item, index) => <Cell key={item.name} fill={FOCUS_COLORS[index]} />)}</Pie><Tooltip contentStyle={{ borderRadius: 12, borderColor: '#dbe4e8', fontSize: 12 }} /></PieChart></ResponsiveContainer>
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"><span className="text-2xl font-semibold tabular-nums">{focusTotal}</span><span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">categorized</span></div>
                </div>
                <div className="grid w-full gap-3 sm:w-1/2">
                  {focusData.map((item, index) => <button type="button" key={item.name} onClick={() => openResults(item.name.toLowerCase())} className="flex items-center justify-between gap-3 rounded-xl border bg-muted/20 px-3 py-3 text-left transition-colors hover:border-primary/35 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"><span className="flex items-center gap-2 text-sm font-medium"><span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: FOCUS_COLORS[index] }} />{item.name}</span><span className="text-right"><span className="block text-lg font-semibold leading-none tabular-nums">{item.value}</span><span className="mt-1 block text-[10px] text-muted-foreground">{Math.round((item.value / focusTotal) * 100)}%</span></span></button>)}
                </div>
              </div>
            ) : <EmptyChart label="No learning focus data yet" />}
            <button type="button" onClick={() => openResults('focus')} className="mt-3 flex w-full items-center justify-between border-t pt-3 text-left text-xs font-semibold text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"><span>View matching innovations</span><ArrowRight className="h-4 w-4" aria-hidden="true" /></button>
          </Card>

          <Card {...cardInteraction('ratings', 'average framework ratings')} className="min-w-0 cursor-pointer border-border/70 p-5 shadow-[0_10px_28px_-24px_rgba(21,56,67,0.55)] transition-colors hover:border-primary/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:p-6">
            <div><h3 className="text-base font-semibold">Average framework ratings</h3><p className="mt-1 text-xs text-muted-foreground">Average criterion score across assessed innovations · 0 to 5</p></div>
            {evaluated.length > 0 ? (
              <div className="mt-5 h-[270px] w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%"><BarChart data={criteriaData} layout="vertical" margin={{ top: 0, right: 18, bottom: 0, left: 0 }} barCategoryGap="34%"><CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" /><XAxis type="number" domain={[0, 5]} tickCount={6} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} /><YAxis type="category" dataKey="criterion" width={112} tickFormatter={(value) => value.length > 16 ? `${value.slice(0, 15)}…` : value} tick={{ fontSize: 11, fill: '#475569' }} axisLine={false} tickLine={false} /><Tooltip formatter={(value) => [`${value} / 5`, 'Average rating']} contentStyle={{ borderRadius: 12, borderColor: '#dbe4e8', fontSize: 12 }} /><Bar dataKey="score" name="Average rating" fill="#177b88" radius={[0, 5, 5, 0]} maxBarSize={19} /></BarChart></ResponsiveContainer>
              </div>
            ) : <EmptyChart label="No framework ratings yet" />}
            <div className="mt-3 flex items-center justify-between border-t pt-3 text-xs font-semibold text-primary"><span>View assessed innovations</span><ArrowRight className="h-4 w-4" aria-hidden="true" /></div>
          </Card>
        </div>
      </section>

      <DistrictFocusChart innovations={innovations} onOpenResults={() => openResults('district')} loading={loading} />

      <Card onClick={(event) => { if (!event.target.closest?.('a, button')) openResults('workflow'); }} className="min-w-0 cursor-pointer border-border/70 p-5 shadow-[0_10px_28px_-24px_rgba(21,56,67,0.55)] transition-colors hover:border-primary/35 sm:p-6">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3 border-b pb-4">
          <div><p className="page-eyebrow mb-1">How ASCEND works</p><h2 className="text-xl font-semibold">Six-stage process</h2><p className="mt-1 text-sm text-muted-foreground">From identifying promising practices to sustained impact</p></div>
          <div className="flex flex-wrap gap-2"><button type="button" onClick={() => openResults('workflow')} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">View innovations <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" /></button><Link to="/criteria" className="inline-flex items-center gap-1.5 rounded-lg border bg-card px-3 py-2 text-xs font-semibold text-primary transition-colors hover:border-primary/40 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">View criteria <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" /></Link></div>
        </div>
        <ASCENDWorkflow onOpenResults={() => openResults('workflow')} disabled={loading} />
      </Card>

      <Card onClick={(event) => { if (!event.target.closest?.('a, button')) openResults('recent'); }} className="min-w-0 cursor-pointer border-border/70 p-5 shadow-[0_10px_28px_-24px_rgba(21,56,67,0.55)] transition-colors hover:border-primary/35 sm:p-6">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3 border-b pb-4">
          <div><p className="page-eyebrow mb-1"><BookOpen className="h-4 w-4" /> Latest activity</p><h2 className="text-xl font-semibold">Recent submissions</h2><p className="mt-1 text-sm text-muted-foreground">The six most recently submitted innovations</p></div>
          <div className="flex flex-wrap gap-2"><button type="button" onClick={() => openResults('recent')} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">Open results <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" /></button><Link to="/innovations" className="inline-flex items-center gap-1.5 rounded-lg border bg-card px-3 py-2 text-xs font-semibold text-primary transition-colors hover:border-primary/40 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">View all <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" /></Link></div>
        </div>
        {loading ? (
          <LoadingRows />
        ) : recent.length === 0 ? (
          <div className="rounded-xl border border-dashed bg-muted/20 py-10 text-center text-sm text-muted-foreground">
            No innovations submitted yet.{' '}
            <Link to="/upload" className="text-primary hover:underline">Upload manuscripts</Link> to get started.
          </div>
        ) : (
          <div className="divide-y divide-border/70">
            {recent.map((inv) => (
              <Link
                key={inv.id}
                to={`/innovations/${inv.id}`}
                className="group flex min-w-0 flex-col gap-3 rounded-lg px-3 py-3 transition-colors hover:bg-primary/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><Lightbulb className="h-4 w-4" aria-hidden="true" /></span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-foreground transition-colors group-hover:text-primary">{inv.title}</div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      {inv.learning_focus && <span className="rounded-full bg-muted px-2 py-0.5 font-medium capitalize text-foreground">{inv.learning_focus}</span>}
                      <span className="inline-flex min-w-0 items-center gap-1"><UserRound className="h-3 w-3 shrink-0" aria-hidden="true" /><span className="truncate">{inv.author || 'Unknown'}</span></span>
                      <span className="inline-flex min-w-0 items-center gap-1"><MapPin className="h-3 w-3 shrink-0" aria-hidden="true" /><span className="truncate">{inv.school || '—'}</span></span>
                    </div>
                  </div>
                </div>
                <div className="flex shrink-0 items-center justify-between gap-2 pl-12 sm:justify-end sm:pl-0">
                  {inv.framework_score != null ? (
                    <span className="max-w-[220px] rounded-full border border-teal-200 bg-teal-50 px-2.5 py-1 text-right text-xs font-medium text-teal-800">{inv.framework_level} · {inv.framework_score}/100</span>
                  ) : <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800">Awaiting assessment</span>}
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" aria-hidden="true" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>
      {activeCollection && <DashboardResultsDialog key={selectedResults} collection={activeCollection} onClose={() => setSelectedResults(null)} />}
    </div>
  );
}

function EmptyChart({ label }) {
  return <div className="mt-5 flex h-[230px] items-center justify-center rounded-xl border border-dashed bg-muted/20 text-sm text-muted-foreground">{label}</div>;
}

function LoadingRows() {
  return (
    <div className="space-y-2">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-14 animate-pulse rounded-lg bg-muted/50" />
      ))}
    </div>
  );
}
