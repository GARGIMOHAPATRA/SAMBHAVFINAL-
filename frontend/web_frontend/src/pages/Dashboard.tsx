import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const firstName = user?.name ? user.name.split(' ')[0] : 'Friend';

  const featureCards = [
    {
      id: 'video',
      title: '1-on-1 Video Call',
      desc: 'Start or join a private online video call with room codes, rejoin recovery, and live ISL avatar translation.',
      icon: 'forum',
      iconBg: 'bg-[#fe9832]',
      iconColor: 'text-[#683700]',
      hoverBorder: 'hover:border-[#fe9832]',
      image: 'https://images.unsplash.com/photo-1588196749597-9ff075ee6b5b?auto=format&fit=crop&w=600&q=80',
      badge: 'Live',
      badgeColor: 'bg-green-500',
      route: '/communicate',
    },
    {
      id: 'translate',
      title: 'Translate',
      desc: 'Real-time 2-way translation across Speech ↔ ISL, Text → ISL, and Camera gesture recognition.',
      icon: 'translate',
      iconBg: 'bg-[#fe9832]/20 border border-[#fe9832]/30',
      iconColor: 'text-[#8f4e00] dark:text-[#fe9832]',
      hoverBorder: 'hover:border-[#fe9832]',
      image: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=600&q=80',
      badge: 'AI',
      badgeColor: 'bg-[#fe9832]',
      route: '/translate',
    },
    {
      id: 'learn',
      title: 'Learn ISL',
      desc: 'Curated video lessons, vocabulary tutorials, and personal watch progress tracking.',
      icon: 'sign_language',
      iconBg: 'bg-[#012700] dark:bg-[#8dfc75]/20',
      iconColor: 'text-[#8dfc75]',
      hoverBorder: 'hover:border-[#8dfc75]',
      image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=600&q=80',
      badge: 'ISL',
      badgeColor: 'bg-[#012700]',
      route: '/learn-isl',
    },
    {
      id: 'explore',
      title: 'Explore',
      desc: 'Discover ISL platform features, architecture documentation, and system updates.',
      icon: 'explore',
      iconBg: 'bg-[#f1f4f6] dark:bg-[#2d3133]',
      iconColor: 'text-[#181c1e] dark:text-white',
      hoverBorder: 'hover:border-[#030813] dark:hover:border-white',
      image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=600&q=80',
      badge: 'New',
      badgeColor: 'bg-blue-600',
      route: '/explore',
    },
  ];

  const latestNews = [
    {
      id: 'news-1',
      title: 'National ISL Curriculum Standard 2026 Announced by Education Ministry',
      category: 'Education & Policy',
      date: 'Today',
      image: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'news-2',
      title: 'SAMBHAV 2.0 Launches Offline Hardware-Accelerated Translation Pipeline',
      category: 'Tech & Platform',
      date: 'Yesterday',
      image: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=600&q=80',
    },
  ];

  return (
    <div className="flex flex-col gap-8 w-full animate-fadeIn font-['Inter',sans-serif]">

      {/* Header Section */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="relative">
          <div className="absolute -inset-4 bg-[#ffdcc2]/20 dark:bg-[#ffdcc2]/5 blur-3xl rounded-full -z-10" />
          <p className="text-xs font-semibold uppercase tracking-wider text-[#45474c] dark:text-[#828796] mb-1">
            Overview
          </p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-[#030813] dark:text-white flex items-center gap-3">
            {getGreeting()}, {firstName} <span className="animate-bounce">👋</span>
          </h2>
          <p className="text-sm text-[#45474c] dark:text-[#c1c6d7] mt-1">
            Welcome to SAMBHAV — your accessible communication and ISL translation hub.
          </p>
        </div>
      </header>

      {/* Main Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left: Feature Cards (8 cols) */}
        <section className="lg:col-span-8 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-[#030813] dark:text-white">What would you like to do?</h3>
            <button
              onClick={() => navigate('/explore')}
              className="text-[#8f4e00] dark:text-[#fe9832] text-sm font-semibold hover:underline"
            >
              Explore All Features
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {featureCards.map((card) => (
              <div
                key={card.id}
                onClick={() => navigate(card.route)}
                onKeyDown={(e) => e.key === 'Enter' && navigate(card.route)}
                tabIndex={0}
                role="button"
                aria-label={card.title}
                className={`group bg-white dark:bg-[#1a202c] rounded-[24px] shadow-sm hover:shadow-lg hover:-translate-y-1 cursor-pointer flex flex-col border border-[#e0e3e5] dark:border-[#2d3133] ${card.hoverBorder} transition-all duration-200 overflow-hidden`}
              >
                {/* Image Banner */}
                <div className="relative h-36 overflow-hidden rounded-t-[24px]">
                  <img
                    src={card.image}
                    alt={card.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/60" />
                  {/* Badge */}
                  <span className={`absolute top-3 left-3 ${card.badgeColor} text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow`}>
                    {card.badge}
                  </span>
                </div>

                {/* Content */}
                <div className="p-5 flex flex-col gap-3 flex-1">
                  <div className="flex items-center gap-3">
                    <div className={`${card.iconBg} ${card.iconColor} w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm`}>
                      <span className="material-symbols-outlined text-[20px]">{card.icon}</span>
                    </div>
                    <h4 className="text-base font-bold text-[#181c1e] dark:text-white">{card.title}</h4>
                  </div>
                  <p className="text-sm text-[#45474c] dark:text-[#c1c6d7] leading-relaxed">{card.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Right: News (4 cols) */}
        <section className="lg:col-span-4 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-[#030813] dark:text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-[#fe9832]">newspaper</span>
              <span>Latest News</span>
            </h3>
            <button
              onClick={() => navigate('/news')}
              className="text-[#8f4e00] dark:text-[#fe9832] text-xs font-bold hover:underline"
            >
              View All &rarr;
            </button>
          </div>

          <div className="bg-white dark:bg-[#1a202c] rounded-[24px] p-5 shadow-sm border border-[#e0e3e5] dark:border-[#2d3133] flex flex-col gap-4">
            {latestNews.map((item) => (
              <div
                key={item.id}
                onClick={() => navigate('/news')}
                className="group cursor-pointer flex flex-col gap-2.5 pb-4 border-b border-[#e0e3e5] dark:border-[#2d3133] last:border-0 last:pb-0 hover:opacity-95 transition-all"
              >
                <div className="w-full h-36 rounded-xl overflow-hidden relative shadow-sm border border-[#e0e3e5] dark:border-[#2d3133]">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <span className="absolute top-2 left-2 px-2.5 py-0.5 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold rounded-full">
                    {item.category}
                  </span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#181c1e] dark:text-white line-clamp-2 group-hover:text-[#fe9832] transition-colors leading-snug">
                    {item.title}
                  </h4>
                  <span className="text-[11px] text-[#45474c] dark:text-[#828796] font-medium mt-1 inline-block">
                    {item.date}
                  </span>
                </div>
              </div>
            ))}

            <button
              onClick={() => navigate('/news')}
              className="w-full py-2.5 mt-1 bg-[#f1f4f6] dark:bg-[#2d3133] hover:bg-[#e0e3e5] dark:hover:bg-[#3d4346] text-[#030813] dark:text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
            >
              <span>Explore Accessibility News</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          </div>
        </section>

      </div>
    </div>
  );
};

export default Dashboard;
