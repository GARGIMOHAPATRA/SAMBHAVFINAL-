import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Contact Form State
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formMessage, setFormMessage] = useState('');
  const [formSubmitted, setFormSubmitted] = useState(false);

  // IntersectionObserver for animated gauges
  useEffect(() => {
    const statObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const target = entry.target as HTMLElement;
            if (target.classList.contains('gauge-ring')) {
              const percent = parseFloat(target.getAttribute('data-percent') || '0');
              const circumference = 2 * Math.PI * 40;
              const offset = circumference - (percent / 100) * circumference;
              target.style.transition = 'stroke-dashoffset 1.2s ease-out';
              target.style.strokeDashoffset = offset.toString();
            }
          }
        });
      },
      { threshold: 0.2 }
    );

    const statElements = document.querySelectorAll('.gauge-ring');
    statElements.forEach((el) => statObserver.observe(el));

    return () => {
      statObserver.disconnect();
    };
  }, []);

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formEmail) return;
    setFormSubmitted(true);
    setTimeout(() => {
      setFormName('');
      setFormEmail('');
      setFormMessage('');
      setFormSubmitted(false);
    }, 4000);
  };

  const scrollTo = (elementId: string) => {
    const el = document.getElementById(elementId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="page-bg text-[#1E293B] antialiased min-h-screen font-['Inter',sans-serif]">
      
      {/* ========================================================================= */}
      {/* HEADER                                                                    */}
      {/* ========================================================================= */}
      <header className="fixed top-0 w-full bg-[#EAE7E2]/95 backdrop-blur-md z-50 border-b border-[#D0CCC5] left-0 transition-all duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center">
              <button
                type="button"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="flex items-center space-x-2.5 text-left cursor-pointer"
              >
                <img
                  alt="Sambhav Logo"
                  className="h-8 w-8 rounded-full object-cover shadow-xs border border-[#D0CCC5]"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBTg0HBcA_4tr0W91LDkwqOnVSfSNqNLfncEA1PPwyGzu5JLTBXpp_wsXkZjo9tzLvf4KFNyaXk060fIQSGUovqRqh34LlLcrxxAUa5VojHfDfu4jRQJGk6QxnzQbHigwRz16MDMj2DwoCRu_i77QAzKuRLVJ8e2mLUwC7-UvMJ_JB5sui2SpIRfZM5c9yAP4gD3yTYgJBzlXm_PtIyr70gHi3MkHGC95pbUZ_Mid5Kj_my4OpeXflK15WPybnDecsYaov545CM4kLxeQ"
                />
                <span className="text-xl sm:text-2xl font-bold tracking-tight text-[#0C1322] font-headline">Sambhav</span>
              </button>
            </div>

            {/* Navigation Links */}
            <nav className="hidden md:flex space-x-8 text-sm font-medium">
              <button
                type="button"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="text-[#1E293B] hover:text-[#4046A8] transition-colors cursor-pointer"
              >
                Home
              </button>
              <button
                type="button"
                onClick={() => scrollTo('problem-section')}
                className="text-[#1E293B] hover:text-[#4046A8] transition-colors cursor-pointer"
              >
                Problem
              </button>
              <button
                type="button"
                onClick={() => scrollTo('features-section')}
                className="text-[#1E293B] hover:text-[#4046A8] transition-colors cursor-pointer"
              >
                Features
              </button>
              <button
                type="button"
                onClick={() => scrollTo('contact-section')}
                className="text-[#1E293B] hover:text-[#4046A8] transition-colors cursor-pointer"
              >
                Contact Us
              </button>
            </nav>

            {/* CTA Buttons */}
            <div className="flex items-center space-x-3 sm:space-x-4">
              {user ? (
                <button
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  className="bg-[#4046A8] text-white px-5 py-2 rounded-full text-xs sm:text-sm font-semibold hover:bg-[#353A8F] transition-colors shadow-sm pulse-btn cursor-pointer"
                >
                  Dashboard
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => navigate('/login')}
                    className="text-[#1E293B] hover:text-[#4046A8] text-xs sm:text-sm font-semibold px-2 py-1.5 cursor-pointer transition-colors"
                  >
                    Login
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/register')}
                    className="bg-[#4046A8] text-white px-4 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-semibold hover:bg-[#353A8F] transition-colors shadow-sm pulse-btn cursor-pointer"
                  >
                    Sign Up
                  </button>
                </>
              )}
            </div>

          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* MAIN CONTENT                                                              */}
      {/* ========================================================================= */}
      <main className="pt-16">
        
        {/* ------------------------------------------------------------------------- */}
        {/* 1. HERO SECTION (ORGANIZED 2-COLUMN STUDIO LAYOUT)                        */}
        {/* ------------------------------------------------------------------------- */}
        <section className="relative pt-10 pb-12 sm:pt-14 sm:pb-16 lg:pt-20 lg:pb-20 hero-bg overflow-hidden">
          {/* Subtle Gradient Orbs */}
          <div className="absolute top-[-80px] right-[-120px] w-[500px] h-[500px] bg-[#4046A8]/15 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute bottom-[-60px] left-[10%] w-[380px] h-[380px] bg-[#7C3AED]/10 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute top-[30%] left-[-80px] w-[260px] h-[260px] bg-[#06B6D4]/10 rounded-full blur-[80px] pointer-events-none" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
              
              {/* Left Column: Hero Content (7 cols) */}
              <div className="lg:col-span-7 text-center lg:text-left flex flex-col items-center lg:items-start">
                
                {/* Top Status Badge */}
                <div className="inline-flex items-center space-x-2 bg-[#ECEEFF]/90 backdrop-blur-xs border border-[#D8DBFF] text-[#343890] px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold mb-4 sm:mb-5 shadow-xs">
                  <span className="w-2 h-2 rounded-full bg-[#343890] animate-ping" />
                  <span>Empowering Indian Sign Language Communication</span>
                </div>

                {/* Main Headline */}
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-[#0C1322] mb-4 sm:mb-5 leading-[1.15] sm:leading-[1.12] font-headline">
                  Bridging worlds with accessible AI.
                </h1>

                {/* Subtext */}
                <p className="text-base sm:text-lg md:text-xl text-[#1E293B] mb-7 sm:mb-8 leading-relaxed font-body-lg max-w-2xl">
                  India's leading AI-powered accessibility platform, enabling seamless bidirectional communication through Indian Sign Language (ISL), 3D Avatars, and live speech translation.
                </p>

                {/* Action CTA Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start space-y-3 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => navigate('/communicate')}
                    className="w-full sm:w-auto bg-[#4046A8] text-white px-7 sm:px-8 py-3.5 rounded-xl text-sm sm:text-base font-semibold hover:bg-[#353A8F] hover:-translate-y-0.5 transition-all duration-200 shadow-[0_4px_24px_rgba(64,70,168,0.45)] hover:shadow-[0_8px_32px_rgba(64,70,168,0.65)] text-center pulse-btn cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[20px]">videocam</span>
                    <span>Try Sambhav Now</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollTo('how-it-works-section')}
                    className="w-full sm:w-auto bg-[#E2E0DC] text-[#1E293B] border border-[#BDB9B0] px-7 sm:px-8 py-3.5 rounded-xl text-sm sm:text-base font-semibold hover:bg-[#D5D2CD] hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center space-x-2 shadow-xs hover:shadow-md cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[#4046A8] text-[20px]">info</span>
                    <span>How it Works</span>
                  </button>
                </div>

                {/* Bottom Feature Pills */}
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2.5 sm:gap-3 mt-7 sm:mt-8 pt-5 border-t border-[#D0CCC5]/80 text-xs sm:text-sm font-semibold text-[#334155]">
                  <span className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FFFFFF]/90 rounded-full border border-[#D0CCC5] shadow-xs">
                    <span className="w-2 h-2 rounded-full bg-[#4046A8]" />
                    Real-time 3D ISL Avatar
                  </span>
                  <span className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FFFFFF]/90 rounded-full border border-[#D0CCC5] shadow-xs">
                    <span className="w-2 h-2 rounded-full bg-[#0D9488]" />
                    Live Speech &amp; Subtitles
                  </span>
                  <span className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FFFFFF]/90 rounded-full border border-[#D0CCC5] shadow-xs">
                    <span className="w-2 h-2 rounded-full bg-[#D97706]" />
                    End-to-End Encrypted WebRTC
                  </span>
                </div>

              </div>

              {/* Right Column: Clean Live Preview Card (5 cols) */}
              <div className="lg:col-span-5 relative mt-4 lg:mt-0">
                <div className="bg-[#FFFFFF]/95 backdrop-blur-md rounded-3xl p-5 sm:p-6 border border-[#D0CCC5] shadow-xl space-y-4 text-left">
                  
                  {/* Card Header */}
                  <div className="flex items-center justify-between border-b border-[#E2E0DC] pb-3">
                    <div className="flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-xs font-bold uppercase tracking-wider text-[#0C1322]">
                        SAMBHAV LIVE STUDIO
                      </span>
                    </div>
                    <span className="px-2.5 py-0.5 bg-[#ECEEFF] text-[#343890] rounded-full text-[10px] font-bold">
                      WebRTC Active
                    </span>
                  </div>

                  {/* Hearing Speaker Preview */}
                  <div className="bg-[#F5F3EF] p-3.5 rounded-2xl border border-[#E2E0DC] flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-[#4046A8] text-white flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-xl">mic</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold text-[#4046A8] uppercase tracking-wider">Hearing Participant</p>
                      <p className="text-xs font-semibold text-[#0C1322] truncate">
                        "Namaste! Welcome to SAMBHAV AI."
                      </p>
                    </div>
                  </div>

                  {/* Central Pipeline Indicator */}
                  <div className="flex items-center justify-center space-x-2 py-0.5">
                    <span className="h-px flex-1 bg-[#D0CCC5]" />
                    <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider px-2 bg-[#F5F3EF] py-0.5 rounded-full border border-[#D0CCC5]">
                      ⚡ AI Translation Pipeline
                    </span>
                    <span className="h-px flex-1 bg-[#D0CCC5]" />
                  </div>

                  {/* Deaf Participant 3D Avatar Preview */}
                  <div className="bg-[#F5F3EF] p-3.5 rounded-2xl border border-[#E2E0DC] flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-[#343890] text-white flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-xl">sign_language</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold text-[#343890] uppercase tracking-wider">3D ISL Avatar Output</p>
                      <p className="text-xs font-semibold text-[#0C1322] truncate">
                        [ISL Gesture: नमस्ते / Welcome]
                      </p>
                    </div>
                  </div>

                  {/* Live Caption Bar */}
                  <div className="bg-[#0C1322] text-white p-3 rounded-xl flex items-center justify-between text-xs font-mono">
                    <div className="flex items-center space-x-2 truncate">
                      <span className="text-green-400 font-bold">CC:</span>
                      <span className="truncate text-slate-300">Live subtitles stream active in real-time...</span>
                    </div>
                    <span className="text-[9px] bg-green-500/20 text-green-300 px-1.5 py-0.5 rounded font-bold">
                      LIVE
                    </span>
                  </div>

                  {/* Quick Action Buttons */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => navigate('/communicate')}
                      className="bg-[#4046A8] hover:bg-[#353A8F] text-white py-2 px-3 rounded-xl text-xs font-semibold transition text-center cursor-pointer flex items-center justify-center gap-1"
                    >
                      <span className="material-symbols-outlined text-sm">meeting_room</span>
                      <span>Start Call</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate('/translate')}
                      className="bg-[#E2E0DC] hover:bg-[#D5D2CD] text-[#1E293B] border border-[#BDB9B0] py-2 px-3 rounded-xl text-xs font-semibold transition text-center cursor-pointer flex items-center justify-center gap-1"
                    >
                      <span className="material-symbols-outlined text-sm">translate</span>
                      <span>Translate</span>
                    </button>
                  </div>

                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------------------- */}
        {/* 2. PROBLEM: COMMUNICATION CHALLENGES IN INDIA                             */}
        {/* ------------------------------------------------------------------------- */}
        <section id="problem-section" className="py-10 sm:py-14 lg:py-16 relative bg-[#FFFFFF]/95 rounded-[2rem] sm:rounded-[2.5rem] mx-3 sm:mx-6 lg:mx-8 border border-[#D0CCC5] shadow-lg my-8 sm:my-12">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
            <div className="text-center mb-8 sm:mb-10">
              <span className="px-3 py-1 bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs font-bold rounded-full mb-3 inline-block">
                The Accessibility Gap
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0C1322] mb-2 sm:mb-3 font-headline">
                Communication Challenges in India
              </h2>
              <p className="text-sm sm:text-base text-[#1E293B] max-w-2xl mx-auto font-body-lg leading-relaxed">
                The communication gap in India affects millions, with a critical shortage of resources leaving the Deaf and hard-of-hearing community with limited access to essential information and services.
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-8 items-center max-w-2xl mx-auto">
              
              {/* 63M+ Stat Gauge */}
              <div className="flex flex-col items-center text-center space-y-3 bg-[#F8F9FF] p-6 sm:p-7 rounded-2xl sm:rounded-3xl border border-indigo-200/80 shadow-xs">
                <div className="relative w-28 h-28 sm:w-32 sm:h-32">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" fill="none" r="40" stroke="#E0E3F5" strokeWidth="8" />
                    <circle
                      className="gauge-ring"
                      cx="50"
                      cy="50"
                      data-percent="85"
                      fill="none"
                      r="40"
                      stroke="#4046A8"
                      strokeDasharray="251.2"
                      strokeDashoffset="37.6991"
                      strokeLinecap="round"
                      strokeWidth="8"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[#0C1322] font-extrabold text-xl sm:text-2xl font-headline">63M+</span>
                  </div>
                </div>
                <h3 className="text-[#0C1322] font-bold text-sm sm:text-base font-headline">Significant Hearing Loss</h3>
                <p className="text-[#475569] text-xs leading-relaxed">Individuals facing daily communication barriers.</p>
                <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100/70 px-2 py-0.5 rounded-full">Source: WHO</span>
              </div>

              {/* <1% Stat Gauge */}
              <div className="flex flex-col items-center text-center space-y-3 bg-[#FFFBF5] p-6 sm:p-7 rounded-2xl sm:rounded-3xl border border-amber-200/80 shadow-xs">
                <div className="relative w-28 h-28 sm:w-32 sm:h-32">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" fill="none" r="40" stroke="#FDE8D0" strokeWidth="8" />
                    <circle
                      className="gauge-ring"
                      cx="50"
                      cy="50"
                      data-percent="1"
                      fill="none"
                      r="40"
                      stroke="#EA580C"
                      strokeDasharray="251.2"
                      strokeDashoffset="248.814"
                      strokeLinecap="round"
                      strokeWidth="8"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[#0C1322] font-extrabold text-xl sm:text-2xl font-headline">&lt;1%</span>
                  </div>
                </div>
                <h3 className="text-[#0C1322] font-bold text-sm sm:text-base font-headline">Access to ISL Education</h3>
                <p className="text-[#475569] text-xs leading-relaxed">Deaf individuals with access to formal ISL education.</p>
                <span className="text-[10px] font-bold text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded-full">Source: Census of India</span>
              </div>

            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------------------- */}
        {/* 3. ABOUT ISL: UNDERSTANDING THE POWER OF ISL                             */}
        {/* ------------------------------------------------------------------------- */}
        <section className="py-10 sm:py-14 lg:py-16">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="bg-[#FFFFFF]/95 backdrop-blur-md rounded-[28px] sm:rounded-[36px] border border-[#D0CCC5] shadow-lg p-6 sm:p-10 lg:p-12 flex flex-col lg:flex-row items-center gap-8 lg:gap-14">
              
              {/* Text Content */}
              <div className="lg:w-1/2 flex flex-col items-start text-left">
                <div className="inline-flex items-center space-x-2 bg-[#ECEEFF] border border-[#D8DBFF] text-[#343890] px-3.5 py-1.5 rounded-full text-xs font-bold mb-4 shadow-xs">
                  <span className="material-symbols-outlined text-sm">visibility</span>
                  <span>Visual Linguistic Expression</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0C1322] mb-4 leading-tight font-headline">
                  Understanding the Power of ISL
                </h2>
                <ul className="space-y-3 sm:space-y-3.5 text-sm sm:text-base text-[#1E293B] font-body-lg">
                  <li className="flex items-start">
                    <span className="material-symbols-outlined text-[#4046A8] mr-3 mt-1 text-lg">check_circle</span>
                    <span><strong>ISL is a complete language</strong> with its own grammatical structure and spatial syntax.</span>
                  </li>
                  <li className="flex items-start">
                    <span className="material-symbols-outlined text-[#4046A8] mr-3 mt-1 text-lg">check_circle</span>
                    <span>Sign language provides <strong>depth, emotion, and nuance</strong> that plain text captions cannot convey alone.</span>
                  </li>
                  <li className="flex items-start">
                    <span className="material-symbols-outlined text-[#4046A8] mr-3 mt-1 text-lg">check_circle</span>
                    <span><strong>True accessibility</strong> means full linguistic inclusion in workplaces, schools, and hospitals.</span>
                  </li>
                </ul>
              </div>

              {/* Interactive Hub Grid */}
              <div className="lg:w-1/2 w-full grid grid-cols-2 gap-4 sm:gap-5 items-center">
                {/* Column 1 */}
                <div className="space-y-4 sm:space-y-5 transform translate-y-3 sm:translate-y-4">
                  <div className="group relative bg-[#F5F3EF] p-2.5 sm:p-3 rounded-2xl border border-[#D0CCC5] shadow-xs hover:shadow-md transition-all duration-200">
                    <img alt="ISL Sign for School" className="w-full h-auto rounded-xl object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuB1IcuoSACwI4jLwg5ueh1IRcEnYPJ9hL-_WOYW3xxZ_aSu5j7uXg8E83JXK-ucoCcYtFjZAFtyw4aoQEl92qFC00LButAPA2tTxOK7u3j50wJs2327MOc0Bxxoq-7mwvY-I6Hsefs28YpImFo2WzVVkJri53VFomxBuw0fACOZ-6UNCZ2F5W6IzBnW855EVYs7ZCx7M3-WymBja7oTiFonw9OFYyi9cTbk-PZgwG7J1TlNP-MK4pI5Tt8lyQbTMYfTwQ" />
                  </div>
                  <div className="group relative bg-[#F5F3EF] p-2.5 sm:p-3 rounded-2xl border border-[#D0CCC5] shadow-xs hover:shadow-md transition-all duration-200">
                    <img alt="ISL Sign for Rain" className="w-full h-auto rounded-xl object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBtkIhmMBsu_7H0TjvzfJobxk2ep83U12cA7AambsZvc8DzEesef49vBBlQv8CNTcyNMt08nYqSbqsB-c62u0DuYAY28ObttmRpZbWPpSM8IfouAMBfmHvMok7KE_ksMqSS4ORio25uvrAfXPjpAkTMFgclUWzbHQEmH25tUIyySS568buNZLZ40wKHHj8ZkUgJDAyOFlGrEcEB6bi4mGg8sAFpM6Zibs-AXBJhRrOUk1eQtDYJFwsfrpt9cLWNRf4nMg" />
                  </div>
                </div>

                {/* Column 2 */}
                <div className="space-y-4 sm:space-y-5 transform -translate-y-3 sm:-translate-y-4">
                  <div className="group relative bg-[#F5F3EF] p-2.5 sm:p-3 rounded-2xl border border-[#D0CCC5] shadow-xs hover:shadow-md transition-all duration-200">
                    <img alt="ISL Sign for Yes" className="w-full h-auto rounded-xl object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBxpn70XLRKG_xL1NH6Vg89QATa-gu3kc1hp5C5BxTumnInxuKVWCC2LLoklqqCt5PPGTlt6qQCmyilDYPaKvlnKlkHxYEZ1Q9rUaAJMKj7L-VIeorTCdMeVGbWRxX0qlJG6LE_IrsZV9hIaK-h7tnBAg-JcIVN0WjsEcDsYH00ZO2B36I_K210p9zXym1QML5UzSO6PkXcq_pHcoaOWQs1swxQ4rI-BfnJSQBN0MfD7QP2szCmltTf1bDUNXNCJuAstg" />
                  </div>
                  <div className="group relative bg-[#F5F3EF] p-2.5 sm:p-3 rounded-2xl border border-[#D0CCC5] shadow-xs hover:shadow-md transition-all duration-200">
                    <img alt="ISL Sign for Hello" className="w-full h-auto rounded-xl object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDK3L7OCQX9pJpt8UwNZLEKILyEQ4hOJ5NZIiDpbYNRjIjYPVnP-Yb61h8KYXQlIpPNxessVa_PwRdsWM7MjamdXt4sEOzggLqaZkGawnlppGeRlB4Is0Yh8sKjUkzgLj0-iMlf2FFXXiVkuQJMfGllkdkXAE5AtFkMiTMsqjR0ODNJVGxiK-ZC7Jj91yzUZ67Df7gr-FnEMLuqulRb29c6cudvdTTpcON6z1niRTlhFuu9Cgke02M5Kru1dv2r7F84fU4MpQPGb1sO4g" />
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------------------- */}
        {/* 4. SOLUTION: MISSION STATEMENT                                           */}
        {/* ------------------------------------------------------------------------- */}
        <section className="py-10 sm:py-14 lg:py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
            <div className="w-10 h-1 bg-[#4046A8] mx-auto mb-6 rounded-full opacity-80"></div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0C1322] mb-4 max-w-3xl mx-auto leading-tight tracking-tight font-headline">
              We are on a mission to make communication universal, regardless of ability.
            </h2>
            <p className="text-sm sm:text-base text-[#1E293B] max-w-2xl mx-auto leading-relaxed font-body-lg">
              SAMBHAV is not just an app; it's a movement. By leveraging advanced computer vision and natural language processing, we are building a seamless bridge between Indian Sign Language and spoken languages.
            </p>
          </div>
        </section>

        {/* ------------------------------------------------------------------------- */}
        {/* 5. HOW IT WORKS                                                          */}
        {/* ------------------------------------------------------------------------- */}
        <section id="how-it-works-section" className="py-10 sm:py-14 lg:py-16">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-8 sm:mb-10">
              <span className="px-3 py-1 bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs font-bold rounded-full mb-3 inline-block">
                System Architecture
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0C1322] font-headline">How it Works</h2>
            </div>
            <div className="rounded-2xl sm:rounded-3xl shadow-lg border border-[#D0CCC5] bg-[#FFFFFF]/90 p-3 sm:p-4 flow-arrow max-w-4xl mx-auto">
              <img
                alt="SAMBHAV: The Bidirectional Bridge - How it Works"
                className="w-full h-auto object-cover rounded-xl sm:rounded-2xl relative z-10"
                src="/assets/how_it_works_diagram.jpg"
              />
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------------------- */}
        {/* 6. FEATURES: WHY CHOOSE US                                               */}
        {/* ------------------------------------------------------------------------- */}
        <section id="features-section" className="py-10 sm:py-14 lg:py-16">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-8 sm:mb-10">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0C1322] mb-2 font-headline">
                Why Choose <span className="text-[#4046A8]">SAMBHAV?</span>
              </h2>
              <p className="text-sm sm:text-base text-[#1E293B] max-w-2xl mx-auto">
                Next-generation accessibility features designed for seamless and instant interaction.
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
              
              {/* Feature 1 */}
              <div className="bg-[#FFFFFF]/95 p-5 rounded-2xl border border-indigo-100 shadow-xs flex flex-col h-full transition-all duration-200 hover:shadow-md hover:-translate-y-1 text-left">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center mb-3">
                  <span className="material-symbols-outlined text-[#4046A8] text-xl">translate</span>
                </div>
                <h3 className="text-base font-bold text-[#0C1322] mb-1.5 font-headline">Real-time Translation</h3>
                <p className="text-[#475569] text-xs leading-relaxed">Instant ISL-to-text conversion with minimal latency.</p>
              </div>

              {/* Feature 2 */}
              <div className="bg-[#FFFFFF]/95 p-5 rounded-2xl border border-emerald-100 shadow-xs flex flex-col h-full transition-all duration-200 hover:shadow-md hover:-translate-y-1 text-left">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mb-3">
                  <span className="material-symbols-outlined text-[#059669] text-xl">verified</span>
                </div>
                <h3 className="text-base font-bold text-[#0C1322] mb-1.5 font-headline">High Precision</h3>
                <p className="text-[#475569] text-xs leading-relaxed">Accurate gesture recognition for clear communication.</p>
              </div>

              {/* Feature 3 */}
              <div className="bg-[#FFFFFF]/95 p-5 rounded-2xl border border-amber-100 shadow-xs flex flex-col h-full transition-all duration-200 hover:shadow-md hover:-translate-y-1 text-left">
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center mb-3">
                  <span className="material-symbols-outlined text-[#D97706] text-xl">bolt</span>
                </div>
                <h3 className="text-base font-bold text-[#0C1322] mb-1.5 font-headline">Fast Processing</h3>
                <p className="text-[#475569] text-xs leading-relaxed">Lightning-fast response times for smooth interaction.</p>
              </div>

              {/* Feature 4 */}
              <div className="bg-[#FFFFFF]/95 p-5 rounded-2xl border border-orange-100 shadow-xs flex flex-col h-full transition-all duration-200 hover:shadow-md hover:-translate-y-1 text-left">
                <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center mb-3">
                  <span className="material-symbols-outlined text-[#EA580C] text-xl">sentiment_satisfied</span>
                </div>
                <h3 className="text-base font-bold text-[#0C1322] mb-1.5 font-headline">User-Friendly</h3>
                <p className="text-[#475569] text-xs leading-relaxed">Simple interface designed for everyone to use.</p>
              </div>

              {/* Feature 5 */}
              <div className="bg-[#FFFFFF]/95 p-5 rounded-2xl border border-indigo-100 shadow-xs flex flex-col h-full transition-all duration-200 hover:shadow-md hover:-translate-y-1 text-left">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center mb-3">
                  <span className="material-symbols-outlined text-[#4F46E5] text-xl">auto_awesome</span>
                </div>
                <h3 className="text-base font-bold text-[#0C1322] mb-1.5 font-headline">AI Intelligence</h3>
                <p className="text-[#475569] text-xs leading-relaxed">Advanced learning models for superior sign recognition.</p>
              </div>

              {/* Feature 6 */}
              <div className="bg-[#FFFFFF]/95 p-5 rounded-2xl border border-teal-100 shadow-xs flex flex-col h-full transition-all duration-200 hover:shadow-md hover:-translate-y-1 text-left">
                <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center mb-3">
                  <span className="material-symbols-outlined text-[#0D9488] text-xl">menu_book</span>
                </div>
                <h3 className="text-base font-bold text-[#0C1322] mb-1.5 font-headline">Educational Tools</h3>
                <p className="text-[#475569] text-xs leading-relaxed">Easy lessons to help you learn and master ISL.</p>
              </div>

              {/* Feature 7 */}
              <div className="bg-[#FFFFFF]/95 p-5 rounded-2xl border border-blue-100 shadow-xs flex flex-col h-full transition-all duration-200 hover:shadow-md hover:-translate-y-1 text-left">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center mb-3">
                  <span className="material-symbols-outlined text-[#2563EB] text-xl">verified_user</span>
                </div>
                <h3 className="text-base font-bold text-[#0C1322] mb-1.5 font-headline">Secure Platform</h3>
                <p className="text-[#475569] text-xs leading-relaxed">Your data and privacy are always protected.</p>
              </div>

              {/* Feature 8 */}
              <div className="bg-[#FFFFFF]/95 p-5 rounded-2xl border border-purple-100 shadow-xs flex flex-col h-full transition-all duration-200 hover:shadow-md hover:-translate-y-1 text-left">
                <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center mb-3">
                  <span className="material-symbols-outlined text-[#9333EA] text-xl">diversity_3</span>
                </div>
                <h3 className="text-base font-bold text-[#0C1322] mb-1.5 font-headline">Community Focused</h3>
                <p className="text-[#475569] text-xs leading-relaxed">Built to connect deaf and hearing people everywhere.</p>
              </div>

            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------------------- */}
        {/* 7. WHERE WE CAN MAKE A DIFFERENCE                                         */}
        {/* ------------------------------------------------------------------------- */}
        <section className="py-12 sm:py-16 lg:py-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-10 sm:mb-12">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#0C1322] mb-3 font-headline">
                Where We Can Make a <span className="text-[#4046A8]">Difference</span>
              </h2>
              <p className="text-sm sm:text-base md:text-lg text-[#1E293B] max-w-2xl mx-auto">A unified platform for accessibility across every environment.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 relative z-20">
              
              {/* Schools & Colleges */}
              <div className="relative h-52 sm:h-60 rounded-2xl overflow-hidden card-shadow transition-all duration-200 hover:-translate-y-1 hover:shadow-lg group border border-[#D0CCC5]">
                <img
                  alt="Schools & Colleges"
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDj35VlzhIT0WNloL6o-GP375DwoFP5BuoW2OHI4O-ieBylYnBDETldOKUqxF25jpJ1-FscykYx4-7ZwtTbJETxOGQuYEHjgJz5NClpnCa6BvC1U3R6KVeWnWau2HhQmZot3KXlDTE9N_zLUqOjBrKO_zI7tqbI3E4UYANpnevl-wSK7ANLAW2iBnFCIYC9HTMM83JmdEq6__M8MbfoWC2AwDPcJC0YW9Z2jLhMlp0xeJBFm-3wuhnm30ttfphiWtYaJfGcxST16dW5kQ"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0C1322]/95 via-[#0C1322]/60 to-transparent group-hover:from-[#0C1322]/90 transition-colors"></div>
                <div className="relative z-10 p-6 h-full flex flex-col justify-end text-left">
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-1.5 font-headline">Schools &amp; Colleges</h3>
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">Accessible learning environments.</p>
                </div>
              </div>

              {/* Hospitals & Healthcare */}
              <div className="relative h-52 sm:h-60 rounded-2xl overflow-hidden card-shadow transition-all duration-200 hover:-translate-y-1 hover:shadow-lg group border border-[#D0CCC5]">
                <img
                  alt="Hospitals & Healthcare"
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDM7sQ1JnyOZxJH_lzGy4OIN2PAO8LSCO1u0STXXT0PkrEdKT3ihi1R3CdYONk5pootivIVMGj48rYzO8AdNDzv_RO8AZ3DySvAyZPGLc1pWey9RCWR7fH44B6neK9Nyl8_dejLr9jcJFsvXgPT1Aj8iXHaUtsC2csbTCLCfh8c8ISDU8et50xKGSq0i0l-dpJssJFGvk7maMIe99s-IhP-vmkosXtyR3soYqpVuxiEvRwVeVrGbpVZEQ6-s3ZJzVulZJNmdm3Inzbedg"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0C1322]/95 via-[#0C1322]/60 to-transparent group-hover:from-[#0C1322]/90 transition-colors"></div>
                <div className="relative z-10 p-6 h-full flex flex-col justify-end text-left">
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-1.5 font-headline">Hospitals &amp; Healthcare</h3>
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">Clear patient-staff communication.</p>
                </div>
              </div>

              {/* Offices & Workplaces */}
              <div className="relative h-52 sm:h-60 rounded-2xl overflow-hidden card-shadow transition-all duration-200 hover:-translate-y-1 hover:shadow-lg group border border-[#D0CCC5]">
                <img
                  alt="Offices & Workplaces"
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCQl0Mze-e_ofaHXmslRnaSo_JL3ZDy3ZmuyVC69DXU6xwt1DIx7UC0fpIQ0RCyFVRx3ZIj3gw3pooQokZbJ0AuzSseGVj9FvKJLAg3mEEe2NpSd_l6_kJr-TdxguvfLWUkBnqEKTTs2_DcwNo6sgtJ4pV5tBX40HWb0ajpibSztmZCHbo_8-5cDfe0WdtEl-vkSGjSUjfmpP2dtPrTJoj-INAPPWumPhTsbHQ_JkL2gy4CTcgcHb41WZgcO245TnZhPOW-5Y5J-TyiQg"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0C1322]/95 via-[#0C1322]/60 to-transparent group-hover:from-[#0C1322]/90 transition-colors"></div>
                <div className="relative z-10 p-6 h-full flex flex-col justify-end text-left">
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-1.5 font-headline">Offices &amp; Workplaces</h3>
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">Inclusive professional interactions.</p>
                </div>
              </div>

              {/* Communities & Public Spaces */}
              <div className="relative h-52 sm:h-60 rounded-2xl overflow-hidden card-shadow transition-all duration-200 hover:-translate-y-1 hover:shadow-lg group border border-[#D0CCC5]">
                <img
                  alt="Communities & Public Spaces"
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuC9OWW7PlGXb13POAmqna6ZhX10V90VFN7gexxYokwspDiBIM_dBWsLk0WWfMCU3r6pFTxiR8W8mHySXBoatqI6Ju1m5F6-847lIulgXgiEtzkEm0JG1VbgA08lqBngp-RsN8lXthpLXZox25-lwfG_Y3784W7WzisURC2d7j6-izpdg3Mm7MwGASmC8Zo3rTEW95dfAgHvFnpjs7p4MEfEedC-ajdl3UVmXFLGccKunM-TBqveQ1TX"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0C1322]/95 via-[#0C1322]/60 to-transparent group-hover:from-[#0C1322]/90 transition-colors"></div>
                <div className="relative z-10 p-6 h-full flex flex-col justify-end text-left">
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-1.5 font-headline">Public Services</h3>
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">Access to essential citizen information.</p>
                </div>
              </div>

              {/* Businesses */}
              <div className="relative h-52 sm:h-60 rounded-2xl overflow-hidden card-shadow transition-all duration-200 hover:-translate-y-1 hover:shadow-lg group border border-[#D0CCC5]">
                <img
                  alt="Businesses"
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDxMo8OdcyymvVyXrMeQEiIHc1_gW2zFcdRALbk4CCnz4QMdL7h7cHXSA5WVEyfeiggiFducQXjcchfOM_sVaYT0W_3UIw91Dg1iFbgLd4imgyHnl_nMmz3QOiIz4ZSk_BdREYjMjwuAikLaCs9lyj4VGUc6tkr-oXlsFAOUYCrN5fYkkPPzKWwtkkpeAAdM7AiCFoLZB9O7ks6NjLTQqkxE0y9dxQslsXIOHC0pF5WZaswg7UGWtiz-1QDACXuynyiHC9gc_NH7n0cKw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0C1322]/95 via-[#0C1322]/60 to-transparent group-hover:from-[#0C1322]/90 transition-colors"></div>
                <div className="relative z-10 p-6 h-full flex flex-col justify-end text-left">
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-1.5 font-headline">Businesses</h3>
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">Accessible customer service.</p>
                </div>
              </div>

              {/* Everyday Life */}
              <div className="relative h-52 sm:h-60 rounded-2xl overflow-hidden card-shadow transition-all duration-200 hover:-translate-y-1 hover:shadow-lg group border border-[#D0CCC5]">
                <img
                  alt="Everyday Life"
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuATJpQ_TUsB-ig8zrXOg8LGl5v1VKmxt4H6IT50ScEVL7lTXt4IWAutZbse5kml2bMFOoD330-aYgM_hECSX2e8JzEOP7YRL-53Aq-P7XK-8A9HyrjdAp7KKdDxdntkNf8kY0VyCk3Z6zQB-7LaRUk5x9G1is6MoH8b3b3UPBlwfA7Z_ulc_zRS0den3U9l1xDCATlzDFHk4x3AHHDRHkov_aYxBIourrrBK-R-o1y7EohCg_VUKqOvSOiRAXUQ5bQX7x8p4CKR7zVIZg"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0C1322]/95 via-[#0C1322]/60 to-transparent group-hover:from-[#0C1322]/90 transition-colors"></div>
                <div className="relative z-10 p-6 h-full flex flex-col justify-end text-left">
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-1.5 font-headline">Everyday Life</h3>
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">Making common interactions seamless.</p>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------------------- */}
        {/* 8. TESTIMONIALS                                                           */}
        {/* ------------------------------------------------------------------------- */}
        <section className="py-12 sm:py-16 lg:py-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-10 sm:mb-12">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#0C1322] mb-2.5 font-headline">Beta Tester Feedback</h2>
              <p className="text-sm sm:text-base text-[#1E293B] font-body-lg">What our community is saying about the prototype.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
              
              {/* Card 1 */}
              <div className="bg-[#FFFFFF]/90 rounded-2xl shadow-md overflow-hidden flex flex-col h-full border border-[#D0CCC5]">
                <div className="p-6 pb-14 flex-grow relative flex items-center justify-center text-center">
                  <p className="text-[#1E293B] text-sm sm:text-base italic leading-relaxed font-body-md">
                    “Sambhav makes communication much easier and more inclusive. The ISL avatar is simple and helpful.”
                  </p>
                </div>
                <div className="relative">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                    <img
                      alt="Avishek Raul"
                      className="w-14 h-14 rounded-full border-3 border-white object-cover shadow-sm"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuAih-oeqLEzKEh5v1aD3o_vNApE-lnTw886yVND8nuDVCv76S3TaslpmDBHOIWhBDiGJckGkj4NfQUBX3LEU_6Oo2YidVrzNiX7jrGARDouQ5J-vb03EyUf__Pf7UWH4mWC3aJ_ho138XCdy3akTWfIlGmUMESRSYNO-l-j1U6WVSA6-d7ipoqmiirmMEx_sHV1anwI8fJewhSmfDP87TtRu1dbNr8WMN1TZfqlPG72L7m683A7r1bh"
                    />
                  </div>
                  <div className="bg-[#059669] pt-9 pb-5 text-center text-white relative">
                    <svg className="absolute top-0 left-0 w-full -translate-y-[99%]" preserveAspectRatio="none" viewBox="0 0 1440 320">
                      <path d="M0,160L48,176C96,192,192,224,288,224C384,224,480,192,576,165.3C672,139,768,117,864,128C960,139,1056,181,1152,197.3C1248,213,1344,203,1392,197.3L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z" fill="#059669"></path>
                    </svg>
                    <h4 className="font-bold text-sm sm:text-base mb-0.5 font-headline">Avishek Raul</h4>
                    <p className="text-[11px] text-white/90 uppercase tracking-wide">Community Beta Tester</p>
                  </div>
                </div>
              </div>

              {/* Card 2 */}
              <div className="bg-[#FFFFFF]/90 rounded-2xl shadow-md overflow-hidden flex flex-col h-full border border-[#D0CCC5]">
                <div className="p-6 pb-14 flex-grow relative flex items-center justify-center text-center">
                  <p className="text-[#1E293B] text-sm sm:text-base italic leading-relaxed font-body-md">
                    “I love how Sambhav turns information into Indian Sign Language. It makes technology feel accessible to everyone.”
                  </p>
                </div>
                <div className="relative">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                    <img
                      alt="Subham Nayak"
                      className="w-14 h-14 rounded-full border-3 border-white object-cover shadow-sm"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuAgBIarNZp3rQ9e4dKmX9UrQTP1s-rz_gS8JvJX0c7xif7GauNnuUVYc165mn80xbLD5qzjpYMxT7-ZMWMIT-V_bYOv8KQp5p8I_69RoIRNybgOx4JDtMFRvPlnXHUWTZRVmjlzuczNdEryunkZkS-Q8Yv68bEWhIvnj3aKeHkurSG2_MF-Sl8GLlJKz6dTuUQzIzaodLo_9kWR8hfZts7043wPbU4t6tebdTKPiIIUkqTfZbO-CxvJ"
                    />
                  </div>
                  <div className="bg-[#4046A8] pt-9 pb-5 text-center text-white relative">
                    <svg className="absolute top-0 left-0 w-full -translate-y-[99%]" preserveAspectRatio="none" viewBox="0 0 1440 320">
                      <path d="M0,160L48,176C96,192,192,224,288,224C384,224,480,192,576,165.3C672,139,768,117,864,128C960,139,1056,181,1152,197.3C1248,213,1344,203,1392,197.3L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z" fill="#4046A8"></path>
                    </svg>
                    <h4 className="font-bold text-sm sm:text-base mb-0.5 font-headline">Subham Nayak</h4>
                    <p className="text-[11px] text-white/90 uppercase tracking-wide">Community Beta Tester</p>
                  </div>
                </div>
              </div>

              {/* Card 3 */}
              <div className="bg-[#FFFFFF]/90 rounded-2xl shadow-md overflow-hidden flex flex-col h-full border border-[#D0CCC5]">
                <div className="p-6 pb-14 flex-grow relative flex items-center justify-center text-center">
                  <p className="text-[#1E293B] text-sm sm:text-base italic leading-relaxed font-body-md">
                    “Sambhav shows how technology can bring people closer by making communication more accessible for everyone.”
                  </p>
                </div>
                <div className="relative">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                    <img
                      alt="Ananya Sharma"
                      className="w-14 h-14 rounded-full border-3 border-white object-cover shadow-sm"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuA7zSAMdsHUBEh-OdUAeCWwrIg_LjSF-LErlS6pSMJyVq_hX99WZ9PX7tP2dAzxoL05TyRlo2fYQs46fxSFvvA5uYjoiSC_7rgiBE2TOy9Xb7FCBVezVt8xiQ9yc4dHLiEoSMNoHCq3ShvRGzAmzg9ljH4zcRHt6IrJ_1qCfXBRy4WL69v93wJ1EgmzmAcguix_8lxWQCjG2DTHto2964JWkeYHrzgAR1aN6Ge-1jAE9R2OADwbV0Qs"
                    />
                  </div>
                  <div className="bg-[#1F3252] pt-9 pb-5 text-center text-white relative">
                    <svg className="absolute top-0 left-0 w-full -translate-y-[99%]" preserveAspectRatio="none" viewBox="0 0 1440 320">
                      <path d="M0,160L48,176C96,192,192,224,288,224C384,224,480,192,576,165.3C672,139,768,117,864,128C960,139,1056,181,1152,197.3C1248,213,1344,203,1392,197.3L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z" fill="#1F3252"></path>
                    </svg>
                    <h4 className="font-bold text-sm sm:text-base mb-0.5 font-headline">Ananya Sharma</h4>
                    <p className="text-[11px] text-white/90 uppercase tracking-wide">Community Beta Tester</p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------------------- */}
        {/* 9. MEET OUR TEAM                                                          */}
        {/* ------------------------------------------------------------------------- */}
        <section className="py-12 sm:py-16 lg:py-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 items-center">
              <div className="text-left">
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#0C1322] mb-4 font-headline">Meet Our Team</h2>
                <p className="text-sm sm:text-base md:text-lg text-[#1E293B] leading-relaxed mb-4 font-body-lg">
                  We are a passionate team of engineers, designers, and accessibility advocates dedicated to bridging the communication gap. Together, we combine our expertise in AI and deep understanding of the Deaf community to create Sambhav.
                </p>
              </div>
              <div className="relative rounded-2xl sm:rounded-3xl shadow-md border-3 border-white/60 max-w-lg mx-auto lg:max-w-none">
                <img
                  alt="Sambhav Team"
                  className="w-full h-auto object-cover rounded-2xl sm:rounded-3xl"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAR619udVh9TPr_uBuvwKPp2bMl9fMZ_hXnbJ4MnlpkFWGtRfwx9tW25FuZH3JJ5eI8O14ezBV9oXODCaXqYCJMPykR0gpQSUJTQ4wwt8c_Fwn0NjuhKkjibExPA5coorqz0UWbIqyLkQO9LRxq59cJv-PzxnhoRA7kOqGwbAmsMQ5S-SjPuqoyuepDUr5V5c-IdxuJizQ1iu8Tz1B8jr1dsYdo4H8NUWqLL1GxN2QW4xuqDXMrb7XSDH1Qitk4eUMT9Q"
                />
              </div>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------------------- */}
        {/* 10. SUPPORT & CONTACT US                                                  */}
        {/* ------------------------------------------------------------------------- */}
        <section id="contact-section" className="py-12 sm:py-16 lg:py-20 bg-[#FFFFFF]/40 border-t border-[#D0CCC5]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-10 sm:mb-12">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0C1322] mb-3 font-headline">We're here to help</h2>
              <p className="text-sm sm:text-base text-[#1E293B] max-w-2xl mx-auto">Reach out to our team for support with Sambhav's accessibility ecosystem.</p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
              
              {/* Left Column: Contact Details */}
              <div className="bg-[#FFFFFF]/90 p-6 sm:p-8 rounded-2xl sm:rounded-3xl border border-[#D0CCC5] shadow-xs text-left">
                <h3 className="text-lg sm:text-xl font-bold text-[#0C1322] mb-6 font-headline">Contact Details</h3>
                <div className="space-y-6">
                  <div className="flex items-start space-x-3.5 sm:space-x-4">
                    <div className="w-10 h-10 rounded-full bg-[#ECEEFF] flex items-center justify-center flex-shrink-0 border border-[#D8DBFF]">
                      <span className="material-symbols-outlined text-[#4046A8] text-xl">mail</span>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-[#0C1322]">E-mail</p>
                      <a className="block text-xs sm:text-sm text-[#475569] hover:text-[#4046A8] transition" href="mailto:support@sambhav.ai">support@sambhav.ai</a>
                      <a className="block text-xs sm:text-sm text-[#475569] hover:text-[#4046A8] transition" href="mailto:partnership@sambhav.ai">partnership@sambhav.ai</a>
                      <a className="block text-xs sm:text-sm text-[#475569] hover:text-[#4046A8] transition" href="mailto:info@sambhav.ai">info@sambhav.ai</a>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3.5 sm:space-x-4">
                    <div className="w-10 h-10 rounded-full bg-[#ECEEFF] flex items-center justify-center flex-shrink-0 border border-[#D8DBFF]">
                      <span className="material-symbols-outlined text-[#4046A8] text-xl">call</span>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-[#0C1322]">Contact</p>
                      <p className="text-xs sm:text-sm text-[#475569]">+91 7488152499</p>
                      <p className="text-xs sm:text-sm text-[#475569]">+91 9348682617</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Send a Message Form */}
              <div className="bg-[#FFFFFF]/90 p-6 sm:p-8 rounded-2xl sm:rounded-3xl border border-[#D0CCC5] shadow-xs text-left">
                <h3 className="text-lg sm:text-xl font-bold text-[#0C1322] mb-6 font-headline">Send a Message</h3>
                {formSubmitted ? (
                  <div className="p-6 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-center flex flex-col items-center gap-2 animate-fadeIn">
                    <span className="material-symbols-outlined text-4xl text-emerald-600">check_circle</span>
                    <h4 className="font-bold text-base font-headline">Message Sent Successfully!</h4>
                    <p className="text-xs text-emerald-700">Thank you for reaching out. Our accessibility team will contact you shortly.</p>
                  </div>
                ) : (
                  <form onSubmit={handleContactSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-[#1E293B] mb-1.5">Name</label>
                      <input
                        required
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#D0CCC5] focus:ring-2 focus:ring-[#4046A8] focus:border-transparent outline-none transition bg-white text-xs sm:text-sm"
                        placeholder="Your Name"
                        type="text"
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-[#1E293B] mb-1.5">Email</label>
                      <input
                        required
                        value={formEmail}
                        onChange={(e) => setFormEmail(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#D0CCC5] focus:ring-2 focus:ring-[#4046A8] focus:border-transparent outline-none transition bg-white text-xs sm:text-sm"
                        placeholder="your@email.com"
                        type="email"
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-[#1E293B] mb-1.5">Message</label>
                      <textarea
                        required
                        value={formMessage}
                        onChange={(e) => setFormMessage(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#D0CCC5] focus:ring-2 focus:ring-[#4046A8] focus:border-transparent outline-none transition resize-none bg-white text-xs sm:text-sm"
                        placeholder="How can we help you?"
                        rows={3}
                      />
                    </div>
                    <button
                      className="w-full bg-[#4046A8] text-white font-semibold py-3 rounded-xl hover:bg-[#353A8F] transition-colors shadow-xs cursor-pointer text-xs sm:text-sm"
                      type="submit"
                    >
                      Send Message
                    </button>
                  </form>
                )}
              </div>

            </div>
          </div>
        </section>

      </main>

      {/* ========================================================================= */}
      {/* 11. FOOTER                                                                */}
      {/* ========================================================================= */}
      <footer className="bg-[#E4E1DC]/95 border-t border-[#D0CCC5] pt-12 sm:pt-14 pb-8 text-left">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-8 sm:gap-10 mb-10">
            
            <div className="md:col-span-2">
              <button
                type="button"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="flex items-center space-x-2.5 mb-4 cursor-pointer text-left"
              >
                <img
                  alt="SAMBHAV Circular Logo Icon"
                  className="h-8 w-8 rounded-full object-contain border border-[#D0CCC5]"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBTg0HBcA_4tr0W91LDkwqOnVSfSNqNLfncEA1PPwyGzu5JLTBXpp_wsXkZjo9tzLvf4KFNyaXk060fIQSGUovqRqh34LlLcrxxAUa5VojHfDfu4jRQJGk6QxnzQbHigwRz16MDMj2DwoCRu_i77QAzKuRLVJ8e2mLUwC7-UvMJ_JB5sui2SpIRfZM5c9yAP4gD3yTYgJBzlXm_PtIyr70gHi3MkHGC95pbUZ_Mid5Kj_my4OpeXflK15WPybnDecsYaov545CM4kLxeQ"
                />
                <span className="text-xl font-bold tracking-tight text-[#0C1322] font-headline">Sambhav</span>
              </button>
              <p className="text-xs sm:text-sm text-[#475569] mb-4 leading-relaxed max-w-sm">
                Helping students and teachers communicate easily in classrooms and learning centers.
              </p>
              <div className="mb-6">
                <p className="text-[10px] font-semibold text-gray-500 mb-2 uppercase tracking-widest">Connect with us</p>
                <div className="flex flex-col space-y-2">
                  <a className="flex items-center text-xs sm:text-sm text-[#475569] hover:text-[#4046A8] transition-colors" href="https://linkedin.com" target="_blank" rel="noopener noreferrer">
                    <svg className="w-3.5 h-3.5 mr-1.5" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"></path></svg>
                    LinkedIn
                  </a>
                  <a className="flex items-center text-xs sm:text-sm text-[#475569] hover:text-[#4046A8] transition-colors" href="https://instagram.com" target="_blank" rel="noopener noreferrer">
                    <span className="material-symbols-outlined text-base mr-2">photo_camera</span>
                    Instagram
                  </a>
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="space-y-0.5">
                  <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">LOCATION</p>
                  <p className="text-xs sm:text-sm text-[#475569] leading-relaxed max-w-xs">Institute of Technical Education &amp; Research, Jagamara, Bhubaneswar - 751030</p>
                </div>
              </div>
            </div>

            {/* Product Links */}
            <div>
              <h3 className="text-xs font-bold text-gray-500 tracking-widest uppercase mb-3 sm:mb-4">Product</h3>
              <ul className="space-y-2.5">
                <li>
                  <button type="button" onClick={() => scrollTo('how-it-works-section')} className="text-xs sm:text-sm text-[#475569] hover:text-[#0C1322] cursor-pointer">
                    How it Works ?
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => navigate('/explore')} className="text-xs sm:text-sm text-[#475569] hover:text-[#0C1322] cursor-pointer">
                    Community
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => navigate('/history')} className="text-xs sm:text-sm text-[#475569] hover:text-[#0C1322] cursor-pointer">
                    Testimonials
                  </button>
                </li>
              </ul>
            </div>

            {/* Solutions Links */}
            <div>
              <h3 className="text-xs font-bold text-gray-500 tracking-widest uppercase mb-3 sm:mb-4">Solutions</h3>
              <ul className="space-y-2.5">
                <li>
                  <button type="button" onClick={() => navigate('/learn-isl')} className="text-xs sm:text-sm text-[#475569] hover:text-[#0C1322] cursor-pointer">
                    Educational Institutions
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => navigate('/explore')} className="text-xs sm:text-sm text-[#475569] hover:text-[#0C1322] cursor-pointer">
                    Public Services
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => navigate('/communicate')} className="text-xs sm:text-sm text-[#475569] hover:text-[#0C1322] cursor-pointer">
                    Healthcare
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => navigate('/translate')} className="text-xs sm:text-sm text-[#475569] hover:text-[#0C1322] cursor-pointer">
                    Enterprise
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => navigate('/dashboard')} className="text-xs sm:text-sm text-[#475569] hover:text-[#0C1322] cursor-pointer">
                    Digital Platforms
                  </button>
                </li>
              </ul>
            </div>

            {/* Resources Links */}
            <div>
              <h3 className="text-xs font-bold text-gray-500 tracking-widest uppercase mb-3 sm:mb-4">Resources</h3>
              <ul className="space-y-2.5">
                <li>
                  <button type="button" onClick={() => navigate('/learn-isl')} className="text-xs sm:text-sm text-[#475569] hover:text-[#0C1322] cursor-pointer">
                    ISL Learning
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => scrollTo('problem-section')} className="text-xs sm:text-sm text-[#475569] hover:text-[#0C1322] cursor-pointer">
                    Challenges People Face
                  </button>
                </li>
              </ul>
            </div>

            {/* Company Links */}
            <div>
              <h3 className="text-xs font-bold text-gray-500 tracking-widest uppercase mb-3 sm:mb-4">Company</h3>
              <ul className="space-y-2.5">
                <li>
                  <button type="button" onClick={() => scrollTo('problem-section')} className="text-xs sm:text-sm text-[#475569] hover:text-[#0C1322] cursor-pointer">
                    Our Mission
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => scrollTo('contact-section')} className="text-xs sm:text-sm text-[#475569] hover:text-[#0C1322] cursor-pointer">
                    Contact Us
                  </button>
                </li>
              </ul>
            </div>

          </div>

          {/* Large background watermark */}
          <div className="pt-6 border-t border-[#D0CCC5] text-center">
            <p className="text-xs sm:text-sm text-gray-500">© 2026 Sambhav Accessibility AI. All rights reserved.</p>
          </div>
          
          <div className="mt-8 select-none relative md:h-32 flex items-center justify-center h-20 opacity-10 pointer-events-none">
            <span className="text-[56px] sm:text-[80px] font-extrabold tracking-widest md:text-[150px] text-[#0C1322] font-headline" style={{ letterSpacing: '-0.05em' }}>
              Sambhav
            </span>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default LandingPage;
