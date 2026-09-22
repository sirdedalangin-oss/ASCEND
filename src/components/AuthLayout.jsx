import React from "react";

export default function AuthLayout({ icon: Icon, title, subtitle, footer, children }) {
  return (
    <div className="grid min-h-dvh w-full min-w-0 bg-background lg:grid-cols-[minmax(360px,42%)_1fr]">
      <div className="relative hidden min-h-dvh flex-col justify-between overflow-hidden bg-[#173e4b] px-10 py-10 text-white lg:flex xl:px-16">
        <div className="absolute -right-40 top-1/3 h-96 w-96 rounded-full border-[65px] border-white/[0.04]" aria-hidden="true" />
        <div className="relative flex items-center gap-3"><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white p-1"><img src="/deped-bulacan-logo.png" alt="DepEd Bulacan" className="h-full w-full object-contain" /></div><div><div className="font-semibold tracking-tight">Project ASCEND</div><div className="text-xs text-white/60">Schools Division Office of Bulacan</div></div></div>
        <div className="relative max-w-lg"><div className="mb-6 inline-flex items-center rounded-full border border-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white/70">Innovation to scale</div><p className="text-4xl font-semibold leading-tight tracking-tight xl:text-5xl">Every great innovation should go places.</p><p className="mt-6 max-w-md text-base leading-7 text-white/65">A shared workspace to identify promising ideas, assess their evidence, and bring effective practices to more schools.</p></div>
        <div className="relative text-xs text-white/50">Project ASCEND · SDO Bulacan</div>
      </div>
      <div className="flex min-w-0 flex-col items-center justify-center px-4 py-10 sm:px-8 lg:px-12">
      <div className="w-full max-w-[440px]">
        <div className="mb-8 lg:hidden"><div className="flex items-center gap-3"><img src="/deped-bulacan-logo.png" alt="DepEd Bulacan" className="h-11 w-11 rounded-full object-contain" /><div><p className="font-bold text-primary">Project ASCEND</p><p className="text-xs text-muted-foreground">SDO Bulacan</p></div></div></div>
        <div className="mb-7">
          <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Icon className="h-5 w-5" aria-hidden="true" />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">{title}</h1>
          {subtitle && <p className="mt-2 text-sm leading-6 text-muted-foreground">{subtitle}</p>}
        </div>
        <div className="rounded-2xl border border-border bg-card p-6 shadow-[0_12px_35px_-25px_rgba(21,56,67,0.35)] sm:p-8">
          {children}
        </div>
        {footer && (
          <p className="mt-6 text-center text-sm text-muted-foreground">{footer}</p>
        )}
      </div>
      </div>
    </div>
  );
}
