import { Card } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const NUMERACY_COLOR = '#0d7a8c';
const LITERACY_COLOR = '#AA00FF';

export default function DistrictFocusChart({ innovations }) {
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

  return (
    <Card className="p-5">
      <h3 className="font-semibold text-sm mb-4">Innovations by District & Learning Focus</h3>
      {hasData ? (
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data} margin={{ left: -16, right: 8 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
            <XAxis dataKey="district" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" height={60} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="numeracy" name="Numeracy" stackId="a" fill={NUMERACY_COLOR} radius={[0, 0, 0, 0]} />
            <Bar dataKey="literacy" name="Literacy" stackId="a" fill={LITERACY_COLOR} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-[260px] flex items-center justify-center text-sm text-muted-foreground">No data yet</div>
      )}
    </Card>
  );
}
