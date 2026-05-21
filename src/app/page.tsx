import Link from 'next/link'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { FloatingAiAssistant } from '@/components/FloatingAiAssistant'
import { Zap, FileText, CheckSquare, ArrowRight, Upload, Sparkles } from 'lucide-react'
import { BorderBeam } from '@/components/ui/border-beam'

export default async function LandingPage() {
  const { userId } = await auth()
  if (userId) redirect('/dashboard')

  return (
    <div style={{ background: 'var(--background)', minHeight: '100vh' }}>
      <Navbar />

      {/* Hero */}
      <section className="relative pt-36 pb-28 px-6 text-center overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 -z-10"
          style={{ background: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(100,74,64,0.12) 0%, transparent 70%)' }}
        />
        <div className="max-w-3xl mx-auto">
          <div
            className="inline-flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-full mb-6 border"
            style={{ color: 'var(--primary)', borderColor: 'rgba(100,74,64,0.3)', background: 'rgba(100,74,64,0.06)' }}
          >
            <Zap size={13} fill="currentColor" />
            Powered by PEAK AI
          </div>
          <h1 className="text-5xl font-extrabold tracking-tighter mb-5 leading-tight" style={{ color: 'var(--foreground)' }}>
            Study smarter.<br />Reach your peak.
          </h1>
          <p className="text-lg mb-10 max-w-xl mx-auto" style={{ color: 'var(--muted-foreground)', lineHeight: '1.75' }}>
            Drop a PDF, paste your notes, or enter any topic — PEAK AI instantly builds you structured notes and quizzes so you can focus on actually learning.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link
              href="/sign-up"
              className="inline-flex items-center gap-2 px-7 py-3 rounded-lg font-semibold text-white transition-all hover:opacity-90 hover:-translate-y-0.5"
              style={{ background: 'var(--primary)', boxShadow: '0 0 24px rgba(100,74,64,0.3)' }}
            >
              Start for free <ArrowRight size={16} />
            </Link>
            <Link
              href="/sign-in"
              className="inline-flex items-center gap-2 px-7 py-3 rounded-lg font-medium border transition-all hover:bg-muted"
              style={{ color: 'var(--foreground)', borderColor: 'var(--border)' }}
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* Exam tags */}
      <div className="pb-16 px-6">
        <p className="text-xs font-semibold tracking-widest uppercase text-center mb-3" style={{ color: 'var(--muted-foreground)' }}>
          Built for students preparing for
        </p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          {['SAT', 'AP Bio', 'AP Calc', 'AP History', 'AP Chemistry', 'ACT'].map((label) => (
            <span key={label} className="text-xs font-semibold px-3 py-1 rounded-full border" style={{ color: 'var(--muted-foreground)', borderColor: 'var(--border)', background: 'var(--card)' }}>
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* Features */}
      <section className="pb-24 px-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-semibold tracking-widest uppercase text-center mb-10" style={{ color: 'var(--muted-foreground)' }}>What PEAK does</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { icon: <Upload size={20} />, title: 'Upload anything', desc: 'PDF, plain text, or just a topic name. PEAK handles it all.' },
              { icon: <FileText size={20} />, title: 'AI-generated notes', desc: 'Clean, structured notes organized by concept. Study-ready content.' },
              { icon: <CheckSquare size={20} />, title: 'Instant quizzes', desc: 'Multiple choice questions generated from your material. Track your score.' },
            ].map((f) => (
              <div key={f.title} className="relative p-6 rounded-card border transition-all hover:-translate-y-1 overflow-hidden" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
                <BorderBeam size={120} duration={12} colorFrom="var(--primary)" colorTo="var(--secondary)" />
                <div className="mb-4 w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'rgba(100,74,64,0.1)', color: 'var(--primary)' }}>
                  {f.icon}
                </div>
                <h3 className="font-semibold text-base mb-2" style={{ color: 'var(--foreground)' }}>{f.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="pb-28 px-6">
        <div className="relative max-w-2xl mx-auto text-center p-10 rounded-card border overflow-hidden" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
          <BorderBeam size={200} duration={18} colorFrom="var(--primary)" colorTo="var(--secondary)" />
          <Sparkles size={32} className="mx-auto mb-4" style={{ color: 'var(--primary)' }} />
          <h2 className="text-3xl font-extrabold tracking-tight mb-3" style={{ color: 'var(--foreground)' }}>Ready to study smarter?</h2>
          <p className="mb-6" style={{ color: 'var(--muted-foreground)' }}>Join students already using PEAK to study faster and retain more.</p>
          <Link href="/sign-up" className="inline-flex items-center gap-2 px-7 py-3 rounded-lg font-semibold text-white transition-all hover:opacity-90" style={{ background: 'var(--primary)' }}>
            Get started free <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <footer className="border-t py-8 text-center text-sm" style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}>
        © {new Date().getFullYear()} PEAK. All rights reserved.
      </footer>

      <FloatingAiAssistant />
    </div>
  )
}
