import { useState, useEffect } from 'react';
import { api } from '@/api/client';
import { Card } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { Lightbulb, FolderCheck, Clock, TrendingUp, ArrowRight, Upload } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import StatCard from '@/components/StatCard';
import ASCENDWorkflow from '@/components/ascend/ASCENDWorkflow';
import DistrictFocusChart from '@/components/DistrictFocusChart';

const CHART_COLORS = ['#0d7a8c', '#AA00FF', '#FFAB00', '#EC407A', '#F57C00', '#1976D2'];

export default function Dashboard() {
  const [innovations, setInnovations] = useState([]);
  const [framework, setFramework] = useState(null);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="page-shell space-y-6">
      {/* Header */}
      <div className="page-header">
        <div className="flex items-center gap-4">
          
          <div className="w-14 h-14 rounded-md bg-white border border-border flex items-center justify-center overflow-hidden flex-shrink-0">
            <img
              src="/ascend-logo.png"
              alt="Project ASCEND"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <p className="page-eyebrow">Project ASCEND · SDO Bulacan</p>
            <h1 className="page-title">Innovation-to-Scale System</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Assessment of Scalable Education Novelties and Development
            </p>
          </div>
        </div>
        <Link
          to="/upload"
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Upload className="w-4 h-4" /> Upload Manuscripts
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 min-[440px]:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Lightbulb} label="Total Innovations" value={total} sublabel="All submitted manuscripts" color="teal" />
        <StatCard icon={FolderCheck} label="Determined Scalable" value={scalable} sublabel="Framework score ≥75" color="coral" />
        <StatCard icon={Clock} label="Awaiting Assessment" value={evaluating} sublabel="Needs five panel ratings" color="amber" />
        <StatCard icon={TrendingUp} label="Average Score" value={avgScore} sublabel="Framework score / 100" color="blue" />
      </div>

      {/* Charts */}
      <div className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-2">
        <Card className="min-w-0 p-5">
          <h3 className="font-semibold text-sm mb-4">Learning Focus Distribution</h3>
          {total > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={focusData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                >
                  <Cell fill="#0d7a8c" />
                  <Cell fill="#AA00FF" />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart />
          )}
        </Card>

        <Card className="min-w-0 p-5">
          <h3 className="font-semibold text-sm mb-4">Average Framework Ratings</h3>
          {evaluated.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={criteriaData} margin={{ left: -16, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="criterion" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={50} />
                <YAxis domain={[0, 5]} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                  {criteriaData.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart />
          )}
        </Card>
      </div>

      {/* District & Learning Focus */}
      <DistrictFocusChart innovations={innovations} />

      {/* ASCEND Workflow */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-base">ASCEND — Six-Stage Process</h3>
          <Link to="/criteria" className="text-xs text-primary hover:underline flex items-center gap-1">
            View criteria <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <ASCENDWorkflow />
      </Card>

      {/* Recent Submissions */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-base">Recent Submissions</h3>
          <Link to="/innovations" className="text-xs text-primary hover:underline flex items-center gap-1">
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        {loading ? (
          <LoadingRows />
        ) : recent.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground">
            No innovations submitted yet.{' '}
            <Link to="/upload" className="text-primary hover:underline">Upload manuscripts</Link> to get started.
          </div>
        ) : (
          <div className="space-y-1">
            {recent.map((inv) => (
              <Link
                key={inv.id}
                to={`/innovations/${inv.id}`}
                className="flex items-center justify-between gap-3 py-2.5 px-3 rounded-md hover:bg-muted/50 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-sm text-foreground truncate">{inv.title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {inv.learning_focus?.toUpperCase()} · {inv.author || 'Unknown'} · {inv.school || '—'}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {inv.framework_score != null ? (
                    <span className="text-xs font-medium">{inv.framework_level} · {inv.framework_score}/100</span>
                  ) : <span className="text-xs text-amber-700">Awaiting assessment</span>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function EmptyChart() {
  return <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">No data yet</div>;
}

function LoadingRows() {
  return (
    <div className="space-y-2">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-12 rounded-md bg-muted/50 animate-pulse" />
      ))}
    </div>
  );
}
