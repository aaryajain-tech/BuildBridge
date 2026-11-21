import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, BookOpen, CheckCircle2, GraduationCap, ShieldCheck, Sparkles } from 'lucide-react';
import { BuildJourneyPreview } from '@/components/BuildJourneyPreview';
import { LandingExperience, LandingScene } from '@/components/LandingExperience';

export default function LandingPage() {
  return (
    <LandingExperience>
    <main className="landing-page">
      <header className="landing-header">
        <Link href="/" className="landing-brand" aria-label="BuildBridge home">
          <Image src="/buildbridge-logo-new.png" alt="BuildBridge" width={178} height={58} priority />
        </Link>
        <nav aria-label="Main navigation">
          <a href="#how-it-works">How it works</a>
          <a href="#for-organizations">For organizations</a>
          <Link className="landing-signin" href="/auth/sign-in">Sign in</Link>
          <Link className="landing-signin" href="/demo">Explore demo</Link>
          <Link className="primary" href="/auth/sign-up">Get started <ArrowRight size={16}/></Link>
        </nav>
      </header>
      <section className="landing-hero">
        <div className="landing-copy">
          <span className="landing-kicker"><Sparkles size={15}/> LEARN WITH A PURPOSE</span>
          <h1>Turn what you learn into work you can <em>show.</em></h1>
          <p>BuildBridge connects career-focused learning with practical projects, evidence of your skills and relevant opportunities.</p>
          <div className="landing-actions">
            <Link className="primary" href="/auth/sign-up">Start your journey <ArrowRight size={16}/></Link>
            <a className="landing-secondary" href="#how-it-works">Explore the platform <span aria-hidden="true">↓</span></a>
          </div>
          <div className="landing-proof"><span><CheckCircle2 size={16}/> Work at your pace</span><span><ShieldCheck size={16}/> Clear, verifiable records</span></div>
          <div className="landing-metrics" aria-label="BuildBridge experience highlights">
            <div><b>4</b><span>Connected stages</span></div>
            <div><b>3</b><span>Role workspaces</span></div>
            <div><b>1</b><span>Proof of work journey</span></div>
          </div>
        </div>
        <LandingScene />
      </section>
      <section className="landing-trust" aria-label="BuildBridge core benefits">
        <span>Built around evidence</span>
        <div><CheckCircle2 size={16}/> Career-focused learning</div>
        <div><CheckCircle2 size={16}/> Real project practice</div>
        <div><CheckCircle2 size={16}/> Verified credentials</div>
      </section>
      <section className="landing-features" aria-label="Platform highlights">
        <div className="landing-section-heading"><span><Sparkles size={14}/> FROM LEARNING TO OPPORTUNITY</span><h2>Every step becomes visible progress.</h2><p>BuildBridge turns study, application and feedback into a clear, connected story.</p></div>
        <div className="landing-feature-grid">
          <article className="landing-feature"><span><GraduationCap size={20}/></span><h3>Learn with direction</h3><p>Follow a career-specific path shaped around skills you need to demonstrate.</p></article>
          <article className="landing-feature"><span><BookOpen size={20}/></span><h3>Build real evidence</h3><p>Complete practical work, preserve submissions and show what you can actually do.</p></article>
          <article className="landing-feature"><span><ShieldCheck size={20}/></span><h3>Earn meaningful trust</h3><p>Turn project outcomes and applicable approvals into verifiable achievements.</p></article>
        </div>
      </section>
      <BuildJourneyPreview/>
      <section className="landing-callout" id="for-organizations"><div><span>FOR STUDENTS AND ORGANIZATIONS</span><h2>Build skills around real goals.</h2><p>Students can shape a learning journey. Organizations can participate through verified company workflows.</p></div><Link className="outline" href="/auth/sign-up">Create an account <ArrowRight size={15}/></Link></section>
      <footer className="landing-footer"><Link href="/" className="landing-brand"><Image src="/buildbridge-logo-new.png" alt="BuildBridge" width={145} height={45}/></Link><span>Bridging traditional learning to real-world work.</span><Link href="/auth/sign-in">Sign in</Link></footer>
    </main>
    </LandingExperience>
  );
}
