import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import {
  Code, Terminal, Layers, ArrowUpRight, Mail, Phone,
  Sparkles, Clock, Eye, Heart, Compass, CheckCircle2, ChevronDown, HardHat
} from 'lucide-react';

// Import client components
import TypewriterText from '@/components/landing/TypewriterText';
import StatsCounters from '@/components/landing/StatsCounters';
import ReviewCarousel from '@/components/landing/ReviewCarousel';
import ContactForm from '@/components/landing/ContactForm';
import AskHamidWidget from '@/components/landing/AskHamidWidget';
import Hero3DWrapper from '@/components/landing/Hero3DWrapper';
import LandingNav from '@/components/landing/LandingNav';
import ShyProfilePicture from '@/components/landing/ShyProfilePicture';
import JellyButton from '@/components/ui/JellyButton';

// Fallback portfolio data in case Database is empty or offline
const FALLBACK_PROJECTS = [
  {
    id: 'f1',
    title: 'OmniTask OS',
    description: 'A Next.js 15 Kanban task manager for company operations featuring real-time Supabase sync, drag-and-drop metrics, and automated email telemetry alerts.',
    tech_stack: ['Next.js', 'Supabase', 'TypeScript', 'Tailwind v4'],
    live_url: 'https://github.com',
    github_url: 'https://github.com',
    slug: 'omnitask-os'
  },
  {
    id: 'f2',
    title: 'VibeChat AI Engine',
    description: 'An AI assistant workspace wrapper utilizing Anthropic Claude Sonnet 3.5 API and vector search embeddings to query local codebase documentation.',
    tech_stack: ['Next.js', 'Claude API', 'Tailwind', 'Vector Search'],
    live_url: 'https://github.com',
    github_url: 'https://github.com',
    slug: 'vibechat-ai-engine'
  },
  {
    id: 'f3',
    title: 'SchemaFlow ERD',
    description: 'A visual web application that parses raw PostgreSQL SQL schemas and maps them onto interactive entity-relationship canvases.',
    tech_stack: ['Next.js', 'Three.js', 'React Three Fiber', 'PostgreSQL'],
    live_url: 'https://github.com',
    github_url: 'https://github.com',
    slug: 'schemaflow-erd'
  }
];

const FALLBACK_POSTS = [
  {
    id: 'p1',
    title: 'Building haaamid.art: Architecting a Portfolio OS',
    excerpt: 'An in-depth breakdown of how I configured Next.js 16, Supabase, and R3F into a single, cohesive dashboard management system.',
    category: 'build_log',
    read_time: 8,
    published_at: '2026-06-25T12:00:00Z',
    slug: 'building-haaamid-art-portfolio-os',
    views: 124,
    likes: 42
  },
  {
    id: 'p2',
    title: 'The Rise of Vibe Coding: Human Agency in AI Codebases',
    excerpt: 'Exploring the transition from writing syntax to guiding intent: how to leverage modern LLMs without losing software architecture integrity.',
    category: 'opinion',
    read_time: 6,
    published_at: '2026-06-20T12:00:00Z',
    slug: 'rise-of-vibe-coding-human-agency',
    views: 98,
    likes: 31
  },
  {
    id: 'p3',
    title: 'Mastering Parallax Cam Rigs in React Three Fiber',
    excerpt: 'A technical guide on how to build performance-optimized 3D hero sections that track visitor cursor coordinates at 60fps on mobile browsers.',
    category: 'tutorial',
    read_time: 10,
    published_at: '2026-06-15T12:00:00Z',
    slug: 'parallax-camera-rigs-react-three-fiber',
    views: 156,
    likes: 64
  }
];



export default async function LandingPage() {
  let profile = {
    name: 'Hamid U V',
    role: 'Web & Software Developer',
    location: 'Muscat, Oman',
    available: true,
    bio: 'I craft fast, beautiful, and highly functional full-stack web applications. With an emphasis on performance and premium visual aesthetics, I turn strategic visions into high-impact software.'
  };

  let projects = FALLBACK_PROJECTS;
  let reviews = [];
  let posts = FALLBACK_POSTS;
  let visitorCount = 142; // default fun stat

  // Attempt dynamic fetches from Supabase
  try {
    const supabase = await createClient();
    const [profileRes, projectsRes, reviewsRes, postsRes, visitorsRes] = await Promise.allSettled([
      supabase.from('profiles').select('*').limit(1).maybeSingle(),
      supabase.from('projects').select('*').eq('status', 'published').order('sort_order', { ascending: true }).limit(3),
      supabase.from('reviews').select('*').eq('status', 'approved').limit(5),
      supabase.from('posts').select('*').eq('status', 'published').order('published_at', { ascending: false }).limit(3),
      supabase.from('visitors').select('id', { count: 'exact', head: true })
    ]);

    if (profileRes.status === 'fulfilled' && profileRes.value.data) {
      profile = { ...profile, ...profileRes.value.data };
    }
    if (projectsRes.status === 'fulfilled' && projectsRes.value.data && projectsRes.value.data.length > 0) {
      projects = projectsRes.value.data;
    }
    if (reviewsRes.status === 'fulfilled' && reviewsRes.value.data) {
      reviews = reviewsRes.value.data;
    }
    if (postsRes.status === 'fulfilled' && postsRes.value.data && postsRes.value.data.length > 0) {
      posts = postsRes.value.data;
    }
    if (visitorsRes.status === 'fulfilled' && visitorsRes.value.count !== null) {
      // Add a base offset to make metrics look established
      visitorCount = visitorsRes.value.count + 142;
    }
  } catch (err) {
    console.warn('Supabase DB connection skipped during landing build, using premium fallback mockups:', err);
  }

  // -------------------------
  // GOD MODE: Maintenance Check
  // -------------------------
  let isMaintenance = false;
  try {
    const adminSupabase = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { data: settings } = await adminSupabase
      .from('global_settings')
      .select('maintenance_mode')
      .eq('id', 1)
      .single();

    if (settings && settings.maintenance_mode) {
      isMaintenance = true;
    }
  } catch (err) {
    // Ignore error
  }

  if (isMaintenance) {
    return (
      <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-black text-white selection:bg-white/30">
        {/* Full-screen Video Background */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-60"
        >
          <source src="/rest.mp4" type="video/mp4" />
        </video>

        {/* Gradient Overlay for Text Readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/10 to-black/80" />

        <div className="relative z-10 flex flex-col items-center justify-center text-center px-6 max-w-4xl space-y-8">

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs font-bold uppercase tracking-widest shadow-2xl">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
            </span>
            OFFLINE
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-8xl lg:text-[7rem] font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-white/70 drop-shadow-2xl pb-6">
            System Update in Progress
          </h1>

          {/* <p className="text-base sm:text-lg md:text-2xl text-zinc-300 font-medium tracking-wide max-w-2xl leading-relaxed drop-shadow-lg">
            Too much code, not enough nature. The website is under maintenance while I rest my eyes. See you soon!
          </p> */}

          {/* <div className="mt-8 flex flex-wrap justify-center gap-4">
            <a
              href="tel:+917306658947"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md text-sm font-bold text-white transition-all hover:scale-105 active:scale-95"
            >
              <Phone className="h-4 w-4" />
              +91 7306658947
            </a>
            <a
              href="mailto:connect@haamid.art"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md text-sm font-bold text-white transition-all hover:scale-105 active:scale-95"
            >
              <Mail className="h-4 w-4" />
              connect@haamid.art
            </a>
          </div> */}
        </div>
      </div>
    );
  }

  // Schema for SEO structured data Person format
  const personSchema = {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": "Hamid U V",
    "alternateName": "Hamid",
    "url": "https://haaamid.art",
    "jobTitle": "Web & Software Developer",
    "description": "Full-stack developer specialising in Next.js, React, and Supabase. Based in Muscat, Oman.",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Muscat",
      "addressCountry": "OM"
    },
    "sameAs": [
      "https://github.com",
      "https://linkedin.com"
    ],
    "knowsAbout": ["Next.js", "React", "TypeScript", "Supabase", "Tailwind CSS", "Node.js"]
  };

  return (
    <div className="relative w-full overflow-x-hidden bg-[#0a0a0a] text-zinc-100 selection:bg-purple-600/30 selection:text-purple-300">

      {/* Inject SEO JSON-LD Person Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
      />

      {/* Dynamic 3D Hero Viewport Canvas */}
      <Hero3DWrapper />

      {/* Floating Interactive Widget */}
      <AskHamidWidget />

      {/* -------------------- 1. HERO SECTION -------------------- */}
      <header className="relative flex min-h-screen flex-col items-center justify-between px-6 py-12 text-center">

        {/* Navigation Header */}
        <LandingNav />

        {/* Hero Middle Content */}
        <div className="flex flex-col items-center max-w-4xl z-10 mt-auto mb-auto">
          {/* Availability Pill Badge */}
          <div className="mb-8 inline-flex items-center gap-2.5 rounded-full border border-zinc-800 bg-zinc-950/60 px-4 py-1.5 text-xs font-semibold backdrop-blur-md">
            <span className={`relative flex h-2 w-2`}>
              <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${profile.available ? 'bg-emerald-400' : 'bg-rose-400'}`} />
              <span className={`relative inline-flex h-2 w-2 rounded-full ${profile.available ? 'bg-emerald-500' : 'bg-rose-500'}`} />
            </span>
            <span className="text-zinc-300 tracking-wider">
              {profile.available ? 'Available for new projects' : 'Currently fully booked'}
            </span>
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white select-none">
            Hamid U V
          </h1>

          <h2 className="mt-4 text-xl sm:text-2xl font-bold tracking-tight text-zinc-300">
            <TypewriterText words={['Web & Software Developer', 'Next.js & Supabase Engineer', 'Creative UI Specialist', 'Creative Technologist']} />
          </h2>

          <p className="mt-6 text-sm sm:text-base leading-relaxed text-zinc-400 max-w-xl">
            Crafting premium interactive digital experiences out of Muscat, Oman. Focused on robust full-stack software and visually compelling frontends.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center gap-4 w-full justify-center">
            <JellyButton
              href="#work"
              className="flex items-center justify-center w-full sm:w-auto rounded-xl bg-white px-8 py-3.5 text-sm font-bold text-[#0a0a0a] hover:bg-zinc-200"
            >
              See my work
            </JellyButton>
            <JellyButton
              href="#contact"
              className="flex items-center justify-center w-full sm:w-auto rounded-xl border border-zinc-800 bg-zinc-950/60 px-8 py-3.5 text-sm font-bold text-zinc-300 hover:bg-zinc-900 hover:border-zinc-700 backdrop-blur-md"
            >
              Let's talk
            </JellyButton>
            <JellyButton
              href="/api/cv"
              className="flex items-center justify-center w-full sm:w-auto rounded-xl border border-zinc-800 bg-purple-950/20 px-8 py-3.5 text-sm font-bold text-purple-300 hover:bg-purple-900/40 hover:border-purple-500/30 backdrop-blur-md"
            >
              Download CV
            </JellyButton>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="z-10 animate-[bounce_2s_infinite] flex flex-col items-center gap-2 mt-auto text-zinc-500">
          <span className="text-xs uppercase font-bold tracking-widest">Scroll</span>
          <ChevronDown className="h-5 w-5" />
        </div>
      </header>

      {/* -------------------- 3. ABOUT SECTION -------------------- */}
      <section id="about" className="relative max-w-6xl mx-auto px-6 py-24 border-t border-zinc-900">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

          {/* Left: Bio Text */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 text-purple-400 bg-purple-950/30 border border-purple-500/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              <Compass className="h-3.5 w-3.5" />
              <span>About Hamid</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Vibe + Web: Software coded with intention
            </h2>

            <p className="text-zinc-400 leading-relaxed text-base">
              {profile.bio}
            </p>
            <p className="text-zinc-400 leading-relaxed text-base">
              My engineering philosophy focuses on extreme speed, clean database architectures, and intuitive micro-interactions. Every site I construct is optimized to look pristine, work flawlessly, and convert visitors into loyal clients.
            </p>

            {/* Skills Grid */}
            <div className="pt-4 space-y-3">
              <h3 className="text-sm font-bold tracking-wider text-zinc-300 uppercase">Core Competencies</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  'Next.js 15/16', 'Supabase Realtime', 'TypeScript',
                  'Tailwind CSS v4', 'React Three Fiber', 'PostgreSQL',
                  'Node.js REST APIs', 'Claude SDK Integration', 'Figma Design'
                ].map((skill, index) => (
                  <div key={index} className="flex items-center gap-2 text-xs font-semibold text-zinc-300 bg-zinc-900/40 border border-zinc-800/80 px-3.5 py-2.5 rounded-xl">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>{skill}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Premium Interactive Tilt Card */}
          <div className="lg:col-span-5 flex justify-center">
            <div
              style={{
                transition: 'transform 0.3s ease',
                transformStyle: 'preserve-3d',
              }}
              className="relative w-full max-w-[320px] aspect-[4/5] rounded-2xl border border-zinc-800 bg-gradient-to-br from-purple-900/10 to-emerald-950/10 p-6 flex flex-col justify-between shadow-2xl backdrop-blur-md hover:perspective-[1000px] hover:rotateX-[6deg] hover:rotateY-[-6deg] hover:-translate-y-2 group cursor-default"
            >
              {/* Inner ambient card glow */}
              <div className="absolute inset-0 -z-10 rounded-2xl bg-gradient-to-br from-purple-500/5 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              <div className="flex justify-between items-start">
                <Terminal className="h-8 w-8 text-purple-400" />
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-500/20 px-2.5 py-0.5 rounded-full uppercase">System Ready</span>
              </div>

              <div className="space-y-2">
                <div className="text-zinc-500 font-mono text-xs">d:\Hamid\haaamid-art&gt; run profile</div>
                <div className="text-zinc-200 font-mono text-xs leading-relaxed">
                  Initializing Portfolio OS...<br />
                  Host: Muscat, Oman<br />
                  Status: Available for Remote Work<br />
                  Mindset: Let's build something exceptional.
                </div>
              </div>

              <ShyProfilePicture>
                <div className="border-t border-zinc-800/60 pt-4 flex items-center gap-3 w-full">
                  <div className="h-9 w-9 rounded-full bg-purple-950 flex items-center justify-center text-sm font-bold text-purple-400 border border-purple-500/20">
                    H
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-zinc-100">Hamid U V</h4>
                    <p className="text-[10px] text-zinc-500">Developer & Designer</p>
                  </div>
                </div>
              </ShyProfilePicture>
            </div>
          </div>

        </div>
      </section>

      {/* -------------------- 4. SELECTED WORK -------------------- */}
      <section id="work" className="max-w-6xl mx-auto px-6 py-24 border-t border-zinc-900">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 text-purple-400 bg-purple-950/30 border border-purple-500/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              <Layers className="h-3.5 w-3.5" />
              <span>Selected Projects</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Case studies & shipped software
            </h2>
          </div>
          <Link
            href="/work"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-purple-400 hover:text-purple-300 transition-colors"
          >
            <span>View all projects</span>
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div
              key={project.id}
              style={{
                transition: 'transform 0.3s ease',
                transformStyle: 'preserve-3d'
              }}
              className="flex flex-col justify-between rounded-2xl border border-zinc-800/80 bg-zinc-900/10 p-6 backdrop-blur-sm shadow-xl hover:-translate-y-2 hover:border-purple-500/20 group cursor-default"
            >
              <div>
                {/* Title & Icon link */}
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-white group-hover:text-purple-400 transition-colors">
                    {project.title}
                  </h3>
                  <a
                    href={project.live_url || '#'}
                    target="_blank"
                    rel="noreferrer"
                    className="text-zinc-500 hover:text-zinc-100 transition-colors"
                  >
                    <ArrowUpRight className="h-5 w-5" />
                  </a>
                </div>

                <p className="text-zinc-400 text-sm leading-relaxed mb-6">
                  {project.description}
                </p>
              </div>

              <div>
                {/* Tech Pills */}
                <div className="flex flex-wrap gap-1.5 mb-5">
                  {project.tech_stack.map((tech, i) => (
                    <span key={i} className="text-[10px] font-semibold text-zinc-300 bg-zinc-900 px-2 py-0.5 rounded-md border border-zinc-800">
                      {tech}
                    </span>
                  ))}
                </div>

                {/* View Details Link */}
                <Link
                  href={`/work/${project.slug}`}
                  className="text-xs font-bold text-zinc-300 hover:text-white flex items-center gap-1 group/btn"
                >
                  <span>Read case study</span>
                  <ArrowUpRight className="h-3 w-3 transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* -------------------- 5. STATS SECTION -------------------- */}
      <section className="relative max-w-6xl mx-auto px-6 py-20 border-t border-zinc-900">
        <StatsCounters />
      </section>

      {/* -------------------- 6. REVIEWS SECTION -------------------- */}
      <section className="max-w-6xl mx-auto px-6 py-24 border-t border-zinc-900">
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-4">
          <div className="inline-flex items-center gap-2 text-purple-400 bg-purple-950/30 border border-purple-500/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Testimonials</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            What clients say about Hamid
          </h2>
        </div>
        <ReviewCarousel reviews={reviews} />
      </section>

      {/* -------------------- 7. BLOG SECTION -------------------- */}
      <section className="max-w-6xl mx-auto px-6 py-24 border-t border-zinc-900">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 text-purple-400 bg-purple-950/30 border border-purple-500/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              <Code className="h-3.5 w-3.5" />
              <span>Insights & Write-ups</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Latest from the build log
            </h2>
          </div>
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-purple-400 hover:text-purple-300 transition-colors"
          >
            <span>Read all posts</span>
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Blog Post cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <div
              key={post.id}
              className="flex flex-col justify-between rounded-2xl border border-zinc-800 bg-zinc-950/20 p-6 shadow-xl transition-all duration-300 hover:-translate-y-1.5 hover:border-purple-500/20 group cursor-default"
            >
              <div>
                {/* Meta details */}
                <div className="flex items-center justify-between text-zinc-500 text-xs mb-4">
                  <span className="font-bold text-purple-400 uppercase tracking-wider text-[10px] bg-purple-950/40 border border-purple-500/20 px-2 py-0.5 rounded-full">
                    {post.category.replace('_', ' ')}
                  </span>
                  <div className="flex items-center gap-1 font-semibold">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{post.read_time} min read</span>
                  </div>
                </div>

                <h3 className="text-base font-bold text-zinc-100 group-hover:text-purple-400 transition-colors leading-snug">
                  <Link href={`/blog/${post.slug}`} className="hover:underline">
                    {post.title}
                  </Link>
                </h3>

                <p className="text-zinc-400 text-sm leading-relaxed mt-3 mb-6">
                  {post.excerpt}
                </p>
              </div>

              {/* Footer Engagement Metrics */}
              <div className="border-t border-zinc-900/60 pt-4 flex items-center justify-between text-zinc-500 text-xs font-semibold">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <Eye className="h-4 w-4 text-zinc-600" />
                    <span>{post.views}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Heart className="h-4 w-4 text-rose-800/80" />
                    <span>{post.likes}</span>
                  </span>
                </div>
                <span>{new Date(post.published_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              </div>

            </div>
          ))}
        </div>
      </section>

      {/* -------------------- 9. CONTACT SECTION -------------------- */}
      <section id="contact" className="max-w-6xl mx-auto px-6 py-24 border-t border-zinc-900">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 text-purple-400 bg-purple-950/30 border border-purple-500/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
            <Mail className="h-3.5 w-3.5" />
            <span>Get in Touch</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Let's build something beautiful together
          </h2>
          <p className="text-sm text-zinc-400">
            Have a project in mind, want to discuss a partnership, or just looking to say hello? Drop a message or book directly on my calendar.
          </p>
        </div>

        <ContactForm />
      </section>

      {/* -------------------- 10. FOOTER -------------------- */}
      <footer className="border-t border-zinc-900 bg-zinc-950/60 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 py-12 space-y-8">

          <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-b border-zinc-900 pb-8">
            <Link href="/" className="text-lg font-black tracking-widest text-white">
              HAAAMID<span className="text-purple-500">.ART</span>
            </Link>

            {/* Footer Navigation */}
            <div className="flex flex-wrap justify-center gap-x-8 gap-y-3 text-xs font-bold text-zinc-400">
              <Link href="#work" className="hover:text-white transition-colors">Work</Link>
              <Link href="/blog" className="hover:text-white transition-colors">Blog</Link>
              <Link href="/now" className="hover:text-white transition-colors">Now</Link>
              <Link href="/stats" className="hover:text-white transition-colors">Stats</Link>
              <Link href="/tools" className="hover:text-white transition-colors">Tools</Link>
              <Link href="/snippets" className="hover:text-white transition-colors">Snippets</Link>
              <Link href="#contact" className="hover:text-white transition-colors">Contact</Link>
            </div>

            {/* Social Links */}
            <div className="flex items-center gap-4">
              <a href="https://github.com" target="_blank" rel="noreferrer" className="p-2 rounded-lg border border-zinc-800 bg-zinc-900/30 text-zinc-400 hover:text-white hover:border-zinc-700 transition-all" aria-label="GitHub">
                <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" /><path d="M9 18c-4.51 2-5-2-7-2" /></svg>
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="p-2 rounded-lg border border-zinc-800 bg-zinc-900/30 text-zinc-400 hover:text-white hover:border-zinc-700 transition-all" aria-label="LinkedIn">
                <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" /><rect width="4" height="12" x="2" y="9" /><circle cx="4" cy="4" r="2" /></svg>
              </a>
              <a href="https://twitter.com" target="_blank" rel="noreferrer" className="p-2 rounded-lg border border-zinc-800 bg-zinc-900/30 text-zinc-400 hover:text-white hover:border-zinc-700 transition-all" aria-label="Twitter">
                <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" /></svg>
              </a>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-zinc-500 font-semibold">
            <p>© {new Date().getFullYear()} Hamid U V. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <span>Built with Next.js + Supabase</span>
              <span className="h-1.5 w-1.5 rounded-full bg-zinc-700" />
              <span className="text-purple-400 font-bold">{visitorCount.toLocaleString()} developers visited this month</span>
            </div>
          </div>

        </div>
      </footer>
    </div>
  );
}
