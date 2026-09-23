import { Card } from '@/components/ui/card';

const colorMap = {
  teal: { bg: 'bg-teal-50', text: 'text-teal-700', ring: 'ring-teal-100' },
  coral: { bg: 'bg-rose-50', text: 'text-rose-600', ring: 'ring-rose-100' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-600', ring: 'ring-amber-100' },
  blue: { bg: 'bg-sky-50', text: 'text-sky-700', ring: 'ring-sky-100' },
  purple: { bg: 'bg-purple-50', text: 'text-purple-600', ring: 'ring-purple-100' },
};

export default function StatCard({ icon: Icon, label, value, sublabel, color = 'teal' }) {
  const c = colorMap[color] || colorMap.teal;
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground font-medium">{label}</p>
          <p className="text-3xl font-bold mt-1.5 tracking-tight">{value}</p>
          {sublabel && <p className="text-xs text-muted-foreground mt-1">{sublabel}</p>}
        </div>
        <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${c.bg} ring-1 ${c.ring} flex-shrink-0`}>
          <Icon className={`w-5 h-5 ${c.text}`} />
        </div>
      </div>
    </Card>
  );
}
