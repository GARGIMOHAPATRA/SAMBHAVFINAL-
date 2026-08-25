import React from 'react';

export const ExplorePage: React.FC = () => {
  const updates = [
    {
      version: 'v1.2.0 (Latest Release)',
      date: 'August 15, 2026',
      tag: 'New Features',
      title: 'Speech-to-Sign Pipeline Optimization & Live Captions',
      description: 'Upgraded translation engine with lower latency Web Speech integration and bidirectional real-time preview.',
    },
    {
      version: 'v1.1.0',
      date: 'August 01, 2026',
      tag: 'Security & Telemetry',
      title: 'Automated 3-Minute Host Disconnect & Session Guardrails',
      description: 'Strengthened LiveKit WebRTC security, automatic call cleanup on dual disconnect, and append-only audit trails.',
    },
    {
      version: 'v1.0.0',
      date: 'July 15, 2026',
      tag: 'Core Platform',
      title: 'SAMBHAV Platform Public Launch',
      description: 'Official introduction of AI-powered Indian Sign Language interpretation, interactive avatars, and dual user workspaces.',
    },
  ];

  const features = [
    {
      icon: 'videocam',
      title: 'Real-Time Remote Calling',
      description: 'Ultra-low latency audio/video calling powered by LiveKit WebRTC with synchronized multi-participant sign rendering.',
    },
    {
      icon: 'auto_stories',
      title: 'Standardized ISL Grammar Rules',
      description: 'Built-in semantic conversion adhering to natural ISL grammatical conventions (TIME → PERSON → ACTION → OBJECT).',
    },
    {
      icon: 'accessibility_new',
      title: 'Inclusive Accessibility Defaults',
      description: 'Tailored for Deaf and Hard-of-Hearing individuals with customizable text scaling and screen reader labels.',
    },
    {
      icon: 'lock',
      title: 'Zero-Leak Security Architecture',
      description: 'Stateless JWTs, rotated SHA-256 refresh tokens, and strict room-level token isolation prevent unauthorized eavesdropping.',
    },
  ];

  return (
    <div className="flex flex-col gap-8 w-full animate-fadeIn font-['Inter',sans-serif]">
      
      {/* Header Banner */}
      <header className="relative bg-gradient-to-br from-[#030813] via-[#1a202c] to-[#181c1e] text-white rounded-[28px] p-8 md:p-12 shadow-md overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#fe9832]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl flex flex-col gap-3">
          <span className="text-xs font-extrabold uppercase tracking-widest text-[#fe9832]">
            Discover SAMBHAV
          </span>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-tight text-white">
            Bridging India’s Communication Frontier
          </h1>
          <p className="text-sm md:text-base text-[#c1c6d7] leading-relaxed">
            SAMBHAV is dedicated to breaking down communication barriers between the 18+ million Deaf community in India and hearing individuals through cutting-edge AI, real-time WebRTC, and accessible design.
          </p>
        </div>
      </header>

      {/* About Indian Sign Language Section */}
      <section className="bg-white dark:bg-[#1a202c] rounded-[24px] p-6 md:p-8 border border-[#e0e3e5] dark:border-[#2d3133] shadow-sm flex flex-col gap-4">
        <div className="flex items-center gap-2 border-b border-[#e0e3e5] dark:border-[#2d3133] pb-3">
          <span className="material-symbols-outlined text-[#fe9832] text-[26px]">lightbulb</span>
          <h2 className="text-xl font-bold text-[#030813] dark:text-white">About Indian Sign Language (ISL)</h2>
        </div>
        <p className="text-sm text-[#45474c] dark:text-[#c1c6d7] leading-relaxed">
          Indian Sign Language (ISL) is a complete, natural visual-spatial language with its own rich syntax, morphology, and grammar. Unlike spoken English or Hindi which follow Subject-Verb-Object (SVO) structures, ISL emphasizes visual context with Time-First structures and spatial verb directional movement.
        </p>
      </section>

      {/* Key Platform Capabilities */}
      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-bold text-[#030813] dark:text-white">Platform Capabilities</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((f, i) => (
            <div key={i} className="bg-white dark:bg-[#1a202c] rounded-[20px] p-6 border border-[#e0e3e5] dark:border-[#2d3133] shadow-sm hover:shadow-md hover:-translate-y-1 transition-all flex flex-col gap-3">
              <div className="w-12 h-12 rounded-xl bg-[#fe9832]/10 text-[#8f4e00] dark:text-[#fe9832] flex items-center justify-center">
                <span className="material-symbols-outlined text-[26px]">{f.icon}</span>
              </div>
              <h3 className="text-base font-bold text-[#181c1e] dark:text-white">{f.title}</h3>
              <p className="text-xs text-[#45474c] dark:text-[#c1c6d7] leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Latest Updates & Releases Timeline */}
      <section className="bg-white dark:bg-[#1a202c] rounded-[24px] p-6 md:p-8 border border-[#e0e3e5] dark:border-[#2d3133] shadow-sm flex flex-col gap-6">
        <div className="flex items-center justify-between border-b border-[#e0e3e5] dark:border-[#2d3133] pb-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#fe9832] text-[24px]">update</span>
            <h2 className="text-xl font-bold text-[#030813] dark:text-white">Release Timeline & Updates</h2>
          </div>
          <span className="text-xs font-bold text-[#fe9832]">Active Continuous Delivery</span>
        </div>

        <div className="space-y-6">
          {updates.map((item, index) => (
            <div key={index} className="flex gap-4 items-start relative pb-4 border-b border-[#e0e3e5] dark:border-[#2d3133] last:border-0 last:pb-0">
              <div className="w-3 h-3 rounded-full bg-[#fe9832] mt-1.5 shrink-0 ring-4 ring-[#fe9832]/20" />
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="font-mono text-xs font-bold text-[#030813] dark:text-white bg-[#f1f4f6] dark:bg-[#2d3133] px-2 py-0.5 rounded">
                    {item.version}
                  </span>
                  <span className="text-xs text-[#45474c] dark:text-[#828796]">&bull; {item.date}</span>
                  <span className="px-2 py-0.5 bg-[#ffdcc2] dark:bg-[#fe9832]/20 text-[#2e1500] dark:text-[#fe9832] text-[10px] font-bold rounded-full">
                    {item.tag}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-[#181c1e] dark:text-white mt-1">{item.title}</h3>
                <p className="text-xs text-[#45474c] dark:text-[#c1c6d7] mt-1 leading-relaxed">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
};

export default ExplorePage;
