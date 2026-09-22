const pillars = [
  {
    name: 'Instructional Improvement Engine',
    from: 'Teaching is often one-size-fits-all, with limited use of learner data, resulting in gaps, remediation, and uneven mastery across classrooms.',
    to: 'Teaching, administration, and supervision are guided by real-time learner, teacher and resource data, enabling targeted instruction, timely support and consistent mastery for all learners across schools.',
  },
  {
    name: 'Coaching and Support Spine',
    from: 'Support for teachers and school leaders is inequitable, often reactive, and not consistently matched to their needs or classroom challenges.',
    to: 'Teachers and leaders receive equitable, appropriate targeted coaching and support, responsive to their needs and challenges, resulting in consistent, high-quality teaching practice.',
  },
  {
    name: 'Innovation-to-Scale System',
    from: 'Bright ideas and innovations exist but remain isolated, redundant, inconsistent with the learning outcomes, rarely adopted and scaled to benefit more learners across schools.',
    to: "Effective innovations are identified, validated, and scaled across schools, consistently improving teaching practices and learners' outcomes division-wide.",
  },
  {
    name: 'Data, Knowledge, and Innovation Backbone',
    from: 'Data, processes, and systems are fragmented and disintegrated. Services are less efficient, making decisions and coordination difficult across schools.',
    to: 'Integrated digital systems that provide real-time data and streamlined services, enabling faster and sound decisions, increasing organizational output and coordinated support mechanism across schools.',
  },
];

export default function StrategicChangeAgenda() {
  return (
    <div className="space-y-4">
      <div><p className="page-eyebrow">Division transformation</p><h3 className="text-xl font-semibold">Strategic change agenda</h3></div>
      <div className="grid min-w-0 gap-4 lg:grid-cols-2">
        {pillars.map((pillar, index) => (
          <article key={pillar.name} className="section-card min-w-0 p-5">
            <div className="mb-4 flex items-start gap-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">{String(index + 1).padStart(2, '0')}</span><h4 className="pt-1 text-sm font-semibold leading-5">{pillar.name}</h4></div>
            <div className="space-y-3 text-sm leading-6"><div className="rounded-lg bg-muted/70 p-3"><span className="mb-1 block text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">Current state</span><p className="text-muted-foreground">{pillar.from}</p></div><div className="rounded-lg border border-primary/15 bg-primary/5 p-3"><span className="mb-1 block text-[10px] font-bold uppercase tracking-[0.15em] text-primary">Target state</span><p>{pillar.to}</p></div></div>
          </article>
        ))}
      </div>
    </div>
  );
}
