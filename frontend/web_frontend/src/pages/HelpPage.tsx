import React, { useState } from 'react';

export const HelpPage: React.FC = () => {
  const [queryName, setQueryName] = useState('');
  const [queryEmail, setQueryEmail] = useState('');
  const [queryMessage, setQueryMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmitQuery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!queryName || !queryEmail || !queryMessage) return;
    setSubmitted(true);
    setTimeout(() => {
      setQueryName('');
      setQueryEmail('');
      setQueryMessage('');
      setSubmitted(false);
    }, 4000);
  };

  const faqs = [
    {
      q: 'How does real-time Indian Sign Language translation work?',
      a: 'SAMBHAV uses speech recognition to capture spoken text, processes grammar through an AI intermediate representation, and streams sequential verified sign video clips on the recipient’s avatar view.',
    },
    {
      q: 'What happens if a call host disconnects unexpectedly?',
      a: 'The room initiates a 3-minute grace period countdown. If the host rejoins within 3 minutes, the session continues seamlessly. Otherwise, the call is cleanly disjoined.',
    },
    {
      q: 'Can I use SAMBHAV without an internet connection?',
      a: 'Yes, the Real-Time Translation module features on-device hardware-accelerated synthesis and speech processing.',
    },
  ];

  return (
    <div className="flex flex-col gap-8 w-full animate-fadeIn font-['Inter',sans-serif]">
      
      {/* Header */}
      <header className="border-b border-[#e0e3e5] dark:border-[#2d3133] pb-4">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[#fe9832] text-[28px]">help</span>
          <h1 className="text-3xl font-bold text-[#030813] dark:text-white tracking-tight">Help & Community Support</h1>
        </div>
        <p className="text-sm text-[#45474c] dark:text-[#c1c6d7] mt-1">
          Have questions or want to partner with us? Reach out to our team or submit a query.
        </p>
      </header>

      {/* Main Grid: Contact Info + Query Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Contact Info Cards (5 cols) */}
        <section className="lg:col-span-5 flex flex-col gap-4">
          <div className="bg-[#1a202c] text-white rounded-[24px] p-6 shadow-sm flex flex-col gap-5">
            <h2 className="text-lg font-bold text-white border-b border-white/10 pb-3">
              Direct Contact Information
            </h2>

            <div className="flex flex-col gap-4 text-xs">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center text-[#fe9832] shrink-0">
                  <span className="material-symbols-outlined text-[20px]">mail</span>
                </div>
                <div>
                  <p className="font-bold text-white">Support & Inquiries Email</p>
                  <a href="mailto:support@sambhav-isl.org" className="text-[#8dfc75] hover:underline">
                    support@sambhav-isl.org
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center text-[#fe9832] shrink-0">
                  <span className="material-symbols-outlined text-[20px]">call</span>
                </div>
                <div>
                  <p className="font-bold text-white">Accessibility Helpline</p>
                  <p className="text-[#c1c6d7]">+91 (080) 4567-8900 (Toll Free)</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center text-[#fe9832] shrink-0">
                  <span className="material-symbols-outlined text-[20px]">groups</span>
                </div>
                <div>
                  <p className="font-bold text-white">Community & Partner Network</p>
                  <p className="text-[#c1c6d7]">Join our open community of deaf educators, sign interpreters, and developers.</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-white/5 rounded-xl border border-white/10 text-xs text-[#c1c6d7]">
              📍 SAMBHAV ISL Initiative, Tech for Accessibility Foundation, India.
            </div>
          </div>
        </section>

        {/* Query Submission Form (7 cols) */}
        <section className="lg:col-span-7 bg-white dark:bg-[#1a202c] rounded-[24px] p-6 md:p-8 border border-[#e0e3e5] dark:border-[#2d3133] shadow-sm flex flex-col justify-between gap-6">
          <div>
            <h2 className="text-xl font-bold text-[#030813] dark:text-white mb-1">Submit an Inquiry</h2>
            <p className="text-xs text-[#45474c] dark:text-[#c1c6d7] mb-6">
              Our team typically responds within 24 business hours.
            </p>

            {submitted ? (
              <div className="p-6 bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 rounded-2xl text-center flex flex-col items-center gap-2 animate-fadeIn">
                <span className="material-symbols-outlined text-green-600 text-3xl">check_circle</span>
                <p className="font-bold text-sm text-green-800 dark:text-green-300">Thank you! Your message has been sent.</p>
                <p className="text-xs text-green-700 dark:text-green-400">A member of our team will contact you shortly.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmitQuery} className="flex flex-col gap-4 text-xs">
                <div>
                  <label className="font-bold text-[#181c1e] dark:text-white block mb-1">Your Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Priyanshu Sharma"
                    value={queryName}
                    onChange={(e) => setQueryName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#f7fafc] dark:bg-[#030813] border border-[#c6c6cc] dark:border-[#2d3133] rounded-xl text-[#030813] dark:text-white focus:border-[#fe9832] outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#181c1e] dark:text-white block mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. priyanshu@example.com"
                    value={queryEmail}
                    onChange={(e) => setQueryEmail(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#f7fafc] dark:bg-[#030813] border border-[#c6c6cc] dark:border-[#2d3133] rounded-xl text-[#030813] dark:text-white focus:border-[#fe9832] outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#181c1e] dark:text-white block mb-1">Message / Question</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="How can we assist you or collaborate?"
                    value={queryMessage}
                    onChange={(e) => setQueryMessage(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#f7fafc] dark:bg-[#030813] border border-[#c6c6cc] dark:border-[#2d3133] rounded-xl text-[#030813] dark:text-white focus:border-[#fe9832] outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="mt-2 py-3 px-6 bg-[#fe9832] hover:bg-[#e8872b] text-[#683700] font-bold text-xs rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
                >
                  <span>Submit Inquiry</span>
                  <span className="material-symbols-outlined text-[16px]">send</span>
                </button>
              </form>
            )}
          </div>
        </section>

      </div>

      {/* Frequently Asked Questions */}
      <section className="bg-white dark:bg-[#1a202c] rounded-[24px] p-6 md:p-8 border border-[#e0e3e5] dark:border-[#2d3133] shadow-sm flex flex-col gap-4">
        <h2 className="text-xl font-bold text-[#030813] dark:text-white border-b border-[#e0e3e5] dark:border-[#2d3133] pb-3">
          Frequently Asked Questions
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {faqs.map((faq, idx) => (
            <div key={idx} className="p-4 bg-[#f7fafc] dark:bg-[#030813] rounded-2xl border border-[#e0e3e5] dark:border-[#2d3133] flex flex-col gap-2">
              <h3 className="font-bold text-sm text-[#181c1e] dark:text-white leading-snug">{faq.q}</h3>
              <p className="text-xs text-[#45474c] dark:text-[#c1c6d7] leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
};

export default HelpPage;
