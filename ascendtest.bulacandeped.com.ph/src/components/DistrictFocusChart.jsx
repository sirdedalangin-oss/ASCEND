import { Card } from '@/components/ui/card';
import { ArrowRight, MapPinned } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const NUMERACY_COLOR = '#177b88';
const LITERACY_COLOR = '#7665a8';

export default function DistrictFocusChart({ innovations, onOpenResults, loading = false }) {
  const districtMap = {};
  innovations.forEach((i) => {
    const district = i.district?.trim() || 'Unspecified';
    if (!districtMap[district]) {
      districtMap[district] = { district, numeracy: 0, literacy: 0 };
    }
    if (i.learning_focus === 'literacy') {
      districtMap[district].literacy += 1;
    } else {
      districtMap[district].numeracy += 1;
    }
  });

  const data = Object.values(districtMap).sort((a, b) =>
    (b.numeracy + b.literacy) - (a.numeracy + a.literacy)
  );

  const hasData = data.some((d) => d.numeracy > 0 || d.literacy > 0);
  const chartHeight = Math.max(280, data.length * 38 + 32);

  return (
    <Card role="button" tabIndex={loading ? -1 : 0} aria-haspopup="dialog" aria-label="View innovations by district results" onClick={() => !loading && onOpenResults?.()} onKeyDown={(event) => { if (event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); if (!loading) onOpenResults?.(); } }} className="min-w-0 cursor-pointer overflow-hidden border-border/70 p-5 shadow-[0_10px_28px_-24px_rgba(21,56,67,0.55)] transition-colors hover:border-primary/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><MapPinned className="h-5 w-5" aria-hidden="true" /></span><div><h3 className="text-base font-semibold">Innovations by district</h3><p className="mt-1 text-xs text-muted-foreground">Learning focus across submitted manuscripts</p></div></div>
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground" aria-label="Chart legend"><span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: NUMERACY_COLOR }} />Numeracy</span><span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: LITERACY_COLOR }} />Literacy</span></div>
      </div>
      {hasData ? (
        <div className="max-h-[500px] overflow-auto scrollbar-thin">
          <div className="min-w-[430px]" style={{ height: chartHeight }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} layout="vertical" margin={{ top: 4, right: 18, bottom: 4, left: 4 }} barCategoryGap="28%">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="district" width={128} tick={{ fontSize: 11, fill: '#475569' }} tickFormatter={(value) => value.length > 19 ? `${value.slice(0, 18)}…` : value} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, borderColor: '#dbe4e8', fontSize: 12 }} />
                <Bar dataKey="numeracy" name="Numeracy" stackId="a" fill={NUMERACY_COLOR} maxBarSize={18} />
                <Bar dataKey="literacy" name="Literacy" stackId="a" fill={LITERACY_COLOR} radius={[4, 4, 4, 4]} maxBarSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <div className="flex h-[240px] items-center justify-center rounded-xl border border-dashed bg-muted/20 text-sm text-muted-foreground">No district data yet</div>
      )}
      <div className="mt-3 flex items-center justify-between border-t pt-3 text-xs font-semibold text-primary"><span>View district innovations</span><ArrowRight className="h-4 w-4" aria-hidden="true" /></div>
    </Card>
  );
}
