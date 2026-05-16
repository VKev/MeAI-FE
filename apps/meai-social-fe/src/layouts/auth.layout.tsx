import type { ReactNode } from 'react'

function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className='relative min-h-screen overflow-hidden bg-background text-foreground'>
      <div className='pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(15,23,42,0.08),transparent_45%)] dark:bg-[radial-gradient(circle_at_top,rgba(248,250,252,0.06),transparent_45%)]' />
      <div className='pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(15,23,42,0.06)_1px,transparent_1px),linear-gradient(180deg,rgba(15,23,42,0.06)_1px,transparent_1px)] bg-size-[48px_48px] opacity-40 dark:opacity-25' />
      <div className='pointer-events-none absolute -top-32 right-[-10%] h-72 w-72 rounded-full bg-slate-200/60 blur-3xl dark:bg-slate-900/40' />
      <div className='pointer-events-none absolute -bottom-32 left-[-10%] h-72 w-72 rounded-full bg-slate-100/80 blur-3xl dark:bg-slate-950/50' />

      <main className='relative mx-auto flex min-h-screen w-full flex-col px-4 py-8 md:max-w-6xl md:px-6'>
        <div className='flex flex-1 items-center justify-center'>{children}</div>
        <footer className='mt-10 flex flex-wrap items-center justify-center gap-3 text-xs text-muted-foreground'>
          <span className='whitespace-nowrap cursor-default'>&copy; 2026</span>
          <span className='h-1 w-1 rounded-full bg-muted-foreground' aria-hidden='true' />
          <a className='whitespace-nowrap transition-all hover:text-foreground hover:underline' href='#'>
            MeAI Terms and Conditions
          </a>
          <span className='h-1 w-1 rounded-full bg-muted-foreground' aria-hidden='true' />
          <a className='whitespace-nowrap transition-all hover:text-foreground hover:underline' href='#'>
            Privacy Policy
          </a>
          <span className='h-1 w-1 rounded-full bg-muted-foreground' aria-hidden='true' />
          <a className='whitespace-nowrap transition-all hover:text-foreground hover:underline' href='#'>
            Cookie Policy
          </a>
          <span className='h-1 w-1 rounded-full bg-muted-foreground' aria-hidden='true' />
          <a className='whitespace-nowrap transition-all hover:text-foreground hover:underline' href='#'>
            Report a Problem
          </a>
        </footer>
      </main>
    </div>
  )
}

export default AuthLayout
