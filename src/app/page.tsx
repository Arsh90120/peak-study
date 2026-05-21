import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { Zap, FileText, Brain, CheckSquare, ArrowRight, Upload } from 'lucide-react'

export default function LandingPage() {
  return (
    <div style={{ background: 'var(--background)', minHeight: '100vh' }}>
      <Navbar />

      {/* Hero */}
      <section className="pt-32 pb-24 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-full mb-6 border" style={{ color: 'var(--accent)', borderColor: 'var(--accent)', background: 'rgba(79,110,247,0.08)' }}>
            <Zap size={13} fill="currentColor" />
            Powered by PEAK AI
          </div>
          <h1 className="text-5xl font-bold tracking-tight mb-5 leading-tight" style={{ color: 'var(--text-primary)' }}>
            Study smarter.<br />Reach your peak.
          </h1>
          <p className="text-lg mb-8 max-w-xl mx-auto" style={{ color: 'var(--text-muted)', lineHeight: '1.7' }}>
            Drop a PDF, paste your notes, or enter any topic — PEAK AI instantly builds you structured notes and quizzes so you can focus on actually learning.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link href="/sign-up" className="inline-flex items-center gap-2 px-6 py-3 rounded-btn font-semibold text-white transition-all hover:opacity-90 hover:-translate-y-0.5" style={{ background: 'var(--accent)' }}>
              Start for free <ArrowRight size={16} />
            </Link>
            <Link href="/sign-in" className="inline-flex items-center gap-2 px-6 py-3 rounded-btn font-medium border transition-all hover:opacity-70" style={{ color: 'var(--text-primary)', borderColor: 'var(--border)' }}>
              Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="pb-24 px-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-semibold tracking-widest uppercase text-center mb-10" style={{ color: 'var(--text-muted)' }}>What PEAK does</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                icon: <Upload size={20} />,
                title: 'Upload anything',
                desc: 'PDF, plain text, or just a topic name. PEAK handles it all and pulls out what matters.',
              },
              {
                icon: <FileText size={20} />,
                title: 'AI-generated notes',
                desc: 'Clean, structured notes organized by concept. Not a summary — actual study-ready content.',
              },
              {
                icon: <CheckSquare size={20} />,
                title: 'Instant quizzes',
                desc: 'Multiple choice questions generated from your material. Test yourself, track your score.',
              },
            ].map((f) => (
              <div key={f.title} className="p-6 rounded-card border transition-all hover:-translate-y-1" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                <div className="mb-4 w-10 h-10 rounded-btn flex items-center justify-center" style={{ background: 'rgba(79,110,247,0.1)', color: 'var(--accent)' }}>
                  {f.icon}
                </div>
                <h3 className="font-semibold text-base mb-2" style={{ color: 'var(--text-primary)' }}>{f.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="pb-28 px-6">
        <div className="max-w-2xl mx-auto text-center p-10 rounded-card border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <Brain size={32} className="mx-auto mb-4" style={{ color: 'var(--accent)' }} />
          <h2 className="text-3xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>Ready to study smarter?</h2>
          <p className="mb-6" style={{ color: 'var(--text-muted)' }}>Join students already using PEAK to study faster and retain more.</p>
          <Link href="/sign-up" className="inline-flex items-center gap-2 px-6 py-3 rounded-btn font-semibold text-white transition-all hover:opacity-90" style={{ background: 'var(--accent)' }}>
            Get started free <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <footer className="border-t py-8 text-center text-sm" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
        © {new Date().getFullYear()} PEAK. All rights reserved.
      </footer>
    </div>
  )
}
