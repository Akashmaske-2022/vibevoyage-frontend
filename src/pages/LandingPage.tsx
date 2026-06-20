import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight, Sparkles, MessageSquare, Map, Shield, Zap,
  Star, CheckCircle2, Globe, Brain, Clock, ChevronDown
} from 'lucide-react';
import Navbar from '@/components/Navbar';

const fadeUp = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] as const },
};

const stagger = (i: number) => ({
  ...fadeUp,
  transition: { ...fadeUp.transition, delay: i * 0.1 },
});

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white">
      <Navbar />
      <main>
        <HeroSection />
        <TrustStrip />
        <FeaturesSection />
        <HowItWorksSection />
        <PricingSection />
        <FAQSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}

// ─── Hero ──────────────────────────────────────────────────────────────────
function HeroSection() {
  return (
    <section className="relative overflow-hidden py-20 sm:py-32">
      {/* Animated gradient background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(25,168,143,0.12),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_50%_at_80%_80%,rgba(91,90,199,0.08),transparent_50%)]" />
        {/* Floating grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.03)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)]" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 text-center">
        {/* Badge */}
        <motion.div {...stagger(0)} className="inline-flex items-center gap-2 rounded-full border border-brand-200 dark:border-brand-800 bg-brand-50 dark:bg-brand-900/30 px-4 py-1.5 text-sm font-medium text-brand-700 dark:text-brand-300 mb-8">
          <Sparkles className="h-3.5 w-3.5" />
          Powered by Google Gemini AI
        </motion.div>

        {/* Headline */}
        <motion.h1 {...stagger(1)} className="mx-auto max-w-4xl text-5xl sm:text-7xl font-display font-bold tracking-tight leading-[1.05]">
          Plan your next trip{' '}
          <br />
          <span className="gradient-text">by vibe, not research</span>
        </motion.h1>

        <motion.p {...stagger(2)} className="mx-auto mt-6 max-w-xl text-lg text-gray-500 dark:text-gray-400">
          Tell us how you feel, your budget, and travel style. Our AI crafts a perfect itinerary in seconds — day-by-day activities, cost breakdowns, packing lists.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div {...stagger(3)} className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link to="/auth/signup" id="hero-cta-signup" className="btn-brand px-7 py-3.5 text-base shadow-brand">
            Start planning free <ArrowRight className="h-5 w-5" />
          </Link>
          <a
            href="#how-it-works"
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 px-7 py-3.5 text-base font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            See how it works <ChevronDown className="h-4 w-4" />
          </a>
        </motion.div>

        {/* Hero chat preview */}
        <motion.div
          {...stagger(4)}
          className="mt-16 mx-auto max-w-2xl rounded-3xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.12)] dark:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.4)] overflow-hidden"
        >
          {/* Chat header */}
          <div className="flex items-center gap-3 border-b border-gray-100 dark:border-gray-800 px-5 py-3.5">
            <div className="flex gap-1.5">
              <div className="h-3 w-3 rounded-full bg-red-400" />
              <div className="h-3 w-3 rounded-full bg-yellow-400" />
              <div className="h-3 w-3 rounded-full bg-green-400" />
            </div>
            <div className="flex-1 flex items-center justify-center gap-2 text-xs text-gray-400">
              <MessageSquare className="h-3.5 w-3.5" /> VibeVoyage AI Chat
            </div>
          </div>

          {/* Messages */}
          <div className="p-5 space-y-4">
            <ChatPreviewMsg role="user" text="I'm feeling spontaneous and adventurous! I have $1500 and about 7 days. I want somewhere warm with beaches and good food 🌊" />
            <TypingIndicator />
            <ChatPreviewMsg
              role="ai"
              text="Perfect vibe! 🌴 I'm detecting Adventurous energy. Based on your $1,500 budget for 7 days, I'd suggest Bali, Costa Rica, or Thailand — all offer stunning beaches, vibrant food scenes, and incredible adventures within budget."
            />
            <div className="rounded-2xl border border-brand-100 dark:border-brand-900/50 bg-brand-50 dark:bg-brand-900/20 p-4 text-left">
              <div className="text-xs font-semibold text-brand-600 dark:text-brand-400 mb-3">✨ Detected Travel Preferences</div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <MoodPill label="Mood" value="🤩 Adventurous" />
                <MoodPill label="Budget" value="💰 $1,500" />
                <MoodPill label="Duration" value="📅 7 days" />
                <MoodPill label="Style" value="🏖️ Beach + Food" />
              </div>
              <button className="mt-3 w-full rounded-xl bg-brand-500 py-2 text-sm font-semibold text-white hover:bg-brand-600 transition-colors">
                Generate Itinerary →
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function ChatPreviewMsg({ role, text }: { role: 'user' | 'ai'; text: string }) {
  if (role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="msg-user text-sm text-left">{text}</div>
      </div>
    );
  }
  return (
    <div className="flex items-start gap-2.5">
      <div className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-indigo-DEFAULT text-white text-xs font-bold">AI</div>
      <div className="msg-ai text-sm text-left">{text}</div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-indigo-DEFAULT text-white text-xs font-bold">AI</div>
      <div className="rounded-2xl rounded-tl-sm bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 px-4 py-3 flex gap-1.5 items-center">
        <span className="typing-dot" />
        <span className="typing-dot" />
        <span className="typing-dot" />
      </div>
    </div>
  );
}

function MoodPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 px-3 py-2">
      <div className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">{label}</div>
      <div className="text-sm font-semibold text-gray-800 dark:text-gray-100">{value}</div>
    </div>
  );
}

// ─── Trust Strip ───────────────────────────────────────────────────────────
function TrustStrip() {
  const stats = [
    { k: '50,000+', v: 'Trips planned' },
    { k: '4.9★', v: 'Average rating' },
    { k: '120+', v: 'Destinations' },
    { k: '<10s', v: 'Itinerary generation' },
  ];
  return (
    <section className="border-y border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {stats.map((s) => (
            <div key={s.v} className="text-center">
              <div className="text-3xl font-display font-bold gradient-text">{s.k}</div>
              <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">{s.v}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Features ─────────────────────────────────────────────────────────────
function FeaturesSection() {
  const features = [
    {
      icon: Brain,
      title: 'AI Mood Detection',
      desc: 'Just describe how you feel — adventurous, romantic, chill, spontaneous. Our Gemini AI extracts your perfect trip profile from natural conversation.',
      color: 'from-brand-500 to-brand-400',
    },
    {
      icon: Map,
      title: 'Instant Itineraries',
      desc: 'Get a complete day-by-day plan with activities, times, estimated costs, local tips, packing lists, and best travel dates in seconds.',
      color: 'from-indigo-DEFAULT to-purple-500',
    },
    {
      icon: Globe,
      title: '120+ Destinations',
      desc: 'From hidden gems to bucket-list classics. Our AI recommends destinations tailored to your exact vibe, budget, and travel style.',
      color: 'from-amber-500 to-orange-500',
    },
    {
      icon: Shield,
      title: 'Save & Export',
      desc: 'Save unlimited itineraries (Premium), export as PDF or JSON, share with travel companions, and access them anywhere.',
      color: 'from-green-500 to-emerald-400',
    },
    {
      icon: Clock,
      title: 'Real-Time Chat',
      desc: 'Refine your trip through natural conversation. Change destinations, adjust budget, add dietary needs — the AI adapts instantly.',
      color: 'from-pink-500 to-rose-400',
    },
    {
      icon: Zap,
      title: 'Freemium SaaS',
      desc: '5 free itineraries daily. Upgrade to Premium for unlimited generations, multi-city routing, and advanced filters. $9.99/month.',
      color: 'from-sky-500 to-blue-500',
    },
  ];

  return (
    <section id="features" className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <motion.div {...fadeUp} className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-brand-500">What we do</p>
          <h2 className="mt-3 text-4xl font-display font-bold sm:text-5xl">
            Travel planning, <span className="gradient-text">reimagined</span>
          </h2>
        </motion.div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              {...stagger(i * 0.05)}
              className="group relative rounded-3xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-7 transition-all hover:-translate-y-1 hover:shadow-card dark:hover:shadow-card-dark"
            >
              <div className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${f.color} text-white shadow-lg mb-5`}>
                <f.icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-display font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── How It Works ──────────────────────────────────────────────────────────
function HowItWorksSection() {
  const steps = [
    { n: '01', title: 'Tell us your vibe', desc: 'Type naturally: "I want a romantic beach trip for 2, $2000, 5 days, somewhere in Europe"' },
    { n: '02', title: 'AI extracts your profile', desc: 'Gemini analyzes your mood, budget, style preferences, and suggests matching destinations' },
    { n: '03', title: 'Generate your itinerary', desc: 'One click creates a complete day-by-day plan with costs, activities, and packing list' },
    { n: '04', title: 'Save, export, go!', desc: 'Save to your account, export as PDF, or share with travel companions — then pack your bags' },
  ];

  return (
    <section id="how-it-works" className="py-24 bg-gray-50 dark:bg-gray-900/50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <motion.div {...fadeUp} className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-brand-500">The process</p>
          <h2 className="mt-3 text-4xl font-display font-bold sm:text-5xl">
            From vibe to itinerary in <span className="gradient-text">minutes</span>
          </h2>
        </motion.div>

        <div className="mt-16 grid gap-8 md:grid-cols-4">
          {steps.map((step, i) => (
            <motion.div key={step.n} {...stagger(i * 0.1)} className="relative">
              {i < steps.length - 1 && (
                <div className="absolute top-8 left-1/2 hidden h-px w-full bg-gradient-to-r from-brand-300 to-transparent md:block" />
              )}
              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-brand-500 to-indigo-DEFAULT text-white text-xl font-display font-bold shadow-brand">
                  {step.n}
                </div>
                <h3 className="mt-4 text-lg font-display font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{step.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Pricing ───────────────────────────────────────────────────────────────
function PricingSection() {
  const tiers = [
    {
      name: 'Free',
      price: '$0',
      period: '/month',
      desc: 'Perfect for occasional travelers',
      features: [
        '5 AI itinerary generations/day',
        '10 saved itineraries',
        'Single-destination planning',
        'Export as JSON',
        'Chat history (last 10)',
      ],
      cta: 'Get started free',
      href: '/auth/signup',
      featured: false,
    },
    {
      name: 'Premium',
      price: '$9.99',
      period: '/month',
      desc: 'For serious travel enthusiasts',
      features: [
        'Unlimited AI generations',
        'Unlimited saved itineraries',
        'Multi-city routing',
        'PDF + JSON export',
        'Advanced filters (eco, luxury, budget)',
        'Priority AI processing',
        'Full chat history',
      ],
      cta: 'Start Premium',
      href: '/auth/signup?plan=premium',
      featured: true,
    },
    {
      name: 'Annual',
      price: '$99',
      period: '/year',
      desc: 'Save 17% vs monthly',
      features: [
        'Everything in Premium',
        '2 months free vs monthly',
        'Priority support',
        'Early access to new features',
      ],
      cta: 'Save with Annual',
      href: '/auth/signup?plan=annual',
      featured: false,
    },
  ];

  return (
    <section id="pricing" className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <motion.div {...fadeUp} className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-brand-500">Pricing</p>
          <h2 className="mt-3 text-4xl font-display font-bold sm:text-5xl">Simple, transparent pricing</h2>
          <p className="mt-4 text-gray-500 dark:text-gray-400">No surprise charges. Cancel anytime.</p>
        </motion.div>

        <div className="mt-16 grid gap-6 md:grid-cols-3 items-start">
          {tiers.map((tier, i) => (
            <motion.div
              key={tier.name}
              {...stagger(i * 0.1)}
              className={`relative rounded-3xl border p-8 transition-all ${
                tier.featured
                  ? 'border-brand-400 dark:border-brand-500 bg-gradient-to-b from-brand-50 to-white dark:from-brand-950/30 dark:to-gray-900 shadow-elevated md:-translate-y-3'
                  : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900'
              }`}
            >
              {tier.featured && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-brand-500 px-4 py-1 text-xs font-bold text-white">
                  Most Popular
                </div>
              )}
              <div className="text-sm font-semibold text-gray-500 dark:text-gray-400">{tier.name}</div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-4xl font-display font-bold">{tier.price}</span>
                <span className="text-sm text-gray-400">{tier.period}</span>
              </div>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{tier.desc}</p>
              <ul className="mt-6 space-y-3">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 flex-none text-brand-500" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                to={tier.href}
                className={`mt-8 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
                  tier.featured
                    ? 'bg-brand-500 text-white hover:bg-brand-600 shadow-brand'
                    : 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:opacity-90'
                }`}
              >
                {tier.cta} <ArrowRight className="h-4 w-4" />
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── FAQ ───────────────────────────────────────────────────────────────────
function FAQSection() {
  const faqs = [
    { q: 'How does the AI understand my travel vibe?', a: "VibeVoyage uses Google Gemini to analyze your natural language messages and extract structured data: mood, budget, duration, destination preferences, and travel style. The more you chat, the more refined your profile becomes." },
    { q: 'Is my data secure?', a: "Yes. All data is encrypted in transit and at rest. We use JWT authentication with httpOnly cookies, row-level security on our database, and never share your data with third parties." },
    { q: 'Can I use it for free?', a: "Absolutely! The free tier gives you 5 AI itinerary generations per day, 10 saved itineraries, and access to all core features. Upgrade to Premium for unlimited access." },
    { q: 'How accurate are the cost estimates?', a: "Cost estimates are generated by AI based on typical prices for each destination. They're good ballpark figures for planning, but actual costs can vary. We always recommend confirming with booking platforms." },
    { q: 'Can I export my itinerary?', a: "Free users can export as JSON. Premium users get PDF export and can share itineraries via a shareable link." },
  ];

  return (
    <section id="faq" className="py-24 bg-gray-50 dark:bg-gray-900/50">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <motion.div {...fadeUp} className="text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-brand-500">FAQ</p>
          <h2 className="mt-3 text-4xl font-display font-bold sm:text-5xl">Questions answered</h2>
        </motion.div>
        <div className="mt-12 space-y-3">
          {faqs.map((faq, i) => (
            <motion.details
              key={faq.q}
              {...stagger(i * 0.05)}
              className="group rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-6 py-5 [&_summary::-webkit-details-marker]:hidden"
            >
              <summary className="flex cursor-pointer items-center justify-between gap-4 text-left font-semibold">
                {faq.q}
                <span className="grid h-7 w-7 flex-none place-items-center rounded-full border border-gray-200 dark:border-gray-700 text-gray-400 transition group-open:rotate-45">+</span>
              </summary>
              <p className="mt-4 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{faq.a}</p>
            </motion.details>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── CTA ───────────────────────────────────────────────────────────────────
function CTASection() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <motion.div
          {...fadeUp}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-500 via-brand-600 to-indigo-DEFAULT p-12 text-white sm:p-16 text-center"
        >
          <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-indigo-DEFAULT/30 blur-3xl" />
          <div className="relative">
            <Star className="mx-auto h-10 w-10 text-yellow-300 mb-4" />
            <h2 className="text-4xl font-display font-bold sm:text-5xl">Ready to vibe your way to adventure?</h2>
            <p className="mt-4 text-lg text-white/80 max-w-xl mx-auto">
              Join 50,000+ travelers who plan smarter with VibeVoyage AI. Start free, no credit card required.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link to="/auth/signup" id="cta-signup" className="inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3.5 text-base font-semibold text-brand-600 hover:bg-brand-50 transition-colors shadow-lg">
                Start planning free <ArrowRight className="h-5 w-5" />
              </Link>
              <Link to="/auth/login" className="inline-flex items-center gap-2 rounded-xl border border-white/30 px-7 py-3.5 text-base font-semibold text-white hover:bg-white/10 transition-colors">
                Sign in
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Footer ────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-indigo-DEFAULT text-white font-bold text-sm">✈</div>
              <span className="font-display font-bold text-lg">Vibe<span className="gradient-text">Voyage</span></span>
            </div>
            <p className="mt-3 max-w-xs text-sm text-gray-500 dark:text-gray-400">
              AI-powered travel planning. Tell us your vibe, we'll plan the perfect trip.
            </p>
          </div>
          {[
            { h: 'Product', links: ['Features', 'Pricing', 'FAQ', 'Changelog'] },
            { h: 'Legal', links: ['Privacy Policy', 'Terms of Service', 'Cookie Policy'] },
          ].map((g) => (
            <div key={g.h}>
              <div className="text-sm font-semibold">{g.h}</div>
              <ul className="mt-3 space-y-2">
                {g.links.map((l) => (
                  <li key={l}><a href="#" className="text-sm text-gray-500 dark:text-gray-400 hover:text-brand-500 transition-colors">{l}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 border-t border-gray-100 dark:border-gray-800 pt-8 flex flex-wrap items-center justify-between gap-3 text-xs text-gray-400">
          <div>© {new Date().getFullYear()} VibeVoyage AI. All rights reserved.</div>
          <div className="flex gap-5">
            <a href="#" className="hover:text-brand-500 transition-colors">Privacy</a>
            <a href="#" className="hover:text-brand-500 transition-colors">Terms</a>
            <a href="#" className="hover:text-brand-500 transition-colors">Contact</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
