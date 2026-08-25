import React from 'react';

export const NewsPage: React.FC = () => {
  const articles = [
    {
      id: 1,
      title: 'National ISL Standardization Framework Announced by Education Ministry',
      category: 'Policy & Inclusion',
      date: 'August 14, 2026',
      readTime: '4 min read',
      summary: 'New guidelines aim to standardize 10,000+ technical and higher-education terms in Indian Sign Language across universities.',
      imageUrl: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?w=600&auto=format&fit=crop&q=80',
    },
    {
      id: 2,
      title: 'AI-Powered Assistive Technology Reaches Rural Schools in Karnataka & Maharashtra',
      category: 'Technology',
      date: 'August 10, 2026',
      readTime: '3 min read',
      summary: 'Pilot programs deploying real-time sign language synthesis and live classroom captioning report a 40% increase in student engagement.',
      imageUrl: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=600&auto=format&fit=crop&q=80',
    },
    {
      id: 3,
      title: 'Global Deaf Youth Leadership Summit 2026 Highlights Accessible Communication Tools',
      category: 'Community',
      date: 'July 28, 2026',
      readTime: '5 min read',
      summary: 'Delegates from 20+ countries gathered to share open-source accessibility software and advocacy strategies.',
      imageUrl: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=600&auto=format&fit=crop&q=80',
    },
  ];

  return (
    <div className="flex flex-col gap-8 w-full animate-fadeIn font-['Inter',sans-serif]">
      
      {/* Header */}
      <header className="border-b border-[#e0e3e5] dark:border-[#2d3133] pb-4">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[#fe9832] text-[28px]">newspaper</span>
          <h1 className="text-3xl font-bold text-[#030813] dark:text-white tracking-tight">Accessibility & ISL News</h1>
        </div>
        <p className="text-sm text-[#45474c] dark:text-[#c1c6d7] mt-1">
          Stay informed on the latest developments in sign language technology, policies, and community events.
        </p>
      </header>

      {/* Featured News Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {articles.map((item) => (
          <article
            key={item.id}
            className="bg-white dark:bg-[#1a202c] rounded-[24px] overflow-hidden border border-[#e0e3e5] dark:border-[#2d3133] shadow-sm hover:shadow-md hover:-translate-y-1 transition-all flex flex-col justify-between"
          >
            <div className="aspect-video bg-[#030813] overflow-hidden">
              <img
                src={item.imageUrl}
                alt={item.title}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              />
            </div>

            <div className="p-5 flex flex-col flex-1 justify-between gap-3">
              <div>
                <div className="flex items-center justify-between text-[11px] font-bold text-[#8f4e00] dark:text-[#fe9832] mb-2">
                  <span className="bg-[#ffdcc2] dark:bg-[#fe9832]/20 text-[#2e1500] dark:text-[#fe9832] px-2 py-0.5 rounded-full font-bold">{item.category}</span>
                  <span className="text-[#45474c] dark:text-[#828796]">{item.date}</span>
                </div>
                <h2 className="text-base font-bold text-[#181c1e] dark:text-white leading-snug mb-2">
                  {item.title}
                </h2>
                <p className="text-xs text-[#45474c] dark:text-[#c1c6d7] leading-relaxed line-clamp-3">
                  {item.summary}
                </p>
              </div>

              <div className="pt-3 border-t border-[#e0e3e5] dark:border-[#2d3133] flex items-center justify-between text-xs">
                <span className="text-[#45474c] dark:text-[#828796]">{item.readTime}</span>
                <span className="text-[#fe9832] font-bold hover:underline cursor-pointer flex items-center gap-0.5">
                  Read Article
                  <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                </span>
              </div>
            </div>
          </article>
        ))}
      </div>

    </div>
  );
};

export default NewsPage;
