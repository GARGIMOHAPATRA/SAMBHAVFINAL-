import React, { useState } from 'react';

interface VideoLesson {
  id: string;
  title: string;
  category: string;
  duration: string;
  creator: string;
  youtubeLink: string;
  thumbnail: string;
  watched: boolean;
}

export const LearnISLPage: React.FC = () => {
  const [activeVideo, setActiveVideo] = useState<VideoLesson | null>(null);
  const [lessons, setLessons] = useState<VideoLesson[]>([
    {
      id: 'lesson-1',
      title: 'Indian Sign Language 101 (Complete Series)',
      category: 'Playlist',
      duration: 'Series',
      creator: 'Pragya Gupta',
      youtubeLink: 'https://youtube.com/playlist?list=PLxYMaKXKMMcMgg4f47WkG7AM0bb3AyjTi&si=15iv2Nxfv-M-mFvi',
      thumbnail: 'https://i.ytimg.com/vi/JPV-vboWfhY/hqdefault.jpg',
      watched: true,
    },
    {
      id: 'lesson-2',
      title: 'Basic ISL Course in Self Learning Mode',
      category: 'Course Playlist',
      duration: 'Full Course',
      creator: 'ISLRTC / Deaf Education',
      youtubeLink: 'https://youtube.com/playlist?list=PLFjydPMg4DapfRTBMokl09Ht-fhMOAYf6&si=1WF2zJ8OWbsZZOMY',
      thumbnail: 'https://i.ytimg.com/vi/5PF6JXzYyUI/hqdefault.jpg',
      watched: true,
    },
    {
      id: 'lesson-3',
      title: 'Basic 25 Words in Indian Sign Language (Part I)',
      category: 'Vocabulary',
      duration: '11 mins',
      creator: 'BUMPER CLAP',
      youtubeLink: 'https://youtu.be/OK7ppVdau8M?si=YVxi9LuzJG1m9b1D',
      thumbnail: 'https://i.ytimg.com/vi/OK7ppVdau8M/hqdefault.jpg',
      watched: false,
    },
    {
      id: 'lesson-4',
      title: 'ISL 201: Basic Everyday Conversations 1',
      category: 'Conversations',
      duration: '8 mins',
      creator: 'Pragya Gupta',
      youtubeLink: 'https://youtu.be/aOL-yBRQHmM?si=hVazCvcZGMT5cCCw',
      thumbnail: 'https://i.ytimg.com/vi/aOL-yBRQHmM/hqdefault.jpg',
      watched: false,
    },
    {
      id: 'lesson-5',
      title: 'ISL 201: Grammar & Sentence Formation',
      category: 'Grammar',
      duration: '10 mins',
      creator: 'Pragya Gupta',
      youtubeLink: 'https://youtu.be/LpLM-8Uj1Bc?si=14K2bk8zuYM7Nzgv',
      thumbnail: 'https://i.ytimg.com/vi/LpLM-8Uj1Bc/hqdefault.jpg',
      watched: false,
    },
    {
      id: 'lesson-6',
      title: 'ISL 201: Daily Expressions & Dialogues',
      category: 'Practice',
      duration: '8 mins',
      creator: 'Pragya Gupta',
      youtubeLink: 'https://youtu.be/aOL-yBRQHmM?si=XgR9KaBrwWy572DO',
      thumbnail: 'https://i.ytimg.com/vi/aOL-yBRQHmM/hqdefault.jpg',
      watched: false,
    },
  ]);

  const toggleWatched = (id: string) => {
    setLessons((prev) =>
      prev.map((item) => (item.id === id ? { ...item, watched: !item.watched } : item))
    );
  };

  const getEmbedUrl = (url: string) => {
    if (url.includes('playlist?list=')) {
      const listId = url.split('list=')[1]?.split('&')[0];
      return `https://www.youtube-nocookie.com/embed/videoseries?list=${listId}&autoplay=1`;
    }
    let videoId = '';
    if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1]?.split('?')[0];
    } else if (url.includes('watch?v=')) {
      videoId = url.split('watch?v=')[1]?.split('&')[0];
    }
    return videoId ? `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1` : url;
  };

  const watchedCount = lessons.filter((l) => l.watched).length;
  const progressPercent = Math.round((watchedCount / lessons.length) * 100);

  return (
    <div className="flex flex-col gap-8 w-full animate-fadeIn font-['Inter',sans-serif]">
      
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-[#e0e3e5] dark:border-[#2d3133] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#fe9832] dark:text-[#8dfc75] text-[28px]">sign_language</span>
            <h1 className="text-3xl font-bold text-[#030813] dark:text-white tracking-tight">Learn Indian Sign Language</h1>
          </div>
          <p className="text-sm text-[#45474c] dark:text-[#c1c6d7] mt-1">
            Watch curated video lessons directly inside SAMBHAV, master vocabulary, and track your ISL journey.
          </p>
        </div>

        {/* Global Progress Widget */}
        <div className="bg-white dark:bg-[#1a202c] rounded-2xl p-4 shadow-sm border border-[#e0e3e5] dark:border-[#2d3133] flex items-center gap-4 min-w-[240px]">
          <div className="flex-1">
            <div className="flex justify-between items-center text-xs font-bold mb-1.5">
              <span className="text-[#181c1e] dark:text-white">Course Progress</span>
              <span className="text-[#012700] dark:text-[#8dfc75] font-black">{progressPercent}%</span>
            </div>
            <div className="w-full bg-[#e0e3e5] dark:bg-[#2d3133] rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-[#fe9832] to-[#8dfc75] h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-[10px] text-[#45474c] dark:text-[#828796] mt-1 block">
              {watchedCount} of {lessons.length} lessons completed
            </span>
          </div>
        </div>
      </header>

      {/* Video Lessons Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {lessons.map((lesson) => (
          <div
            key={lesson.id}
            className="bg-white dark:bg-[#1a202c] rounded-[24px] overflow-hidden border border-[#e0e3e5] dark:border-[#2d3133] shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all flex flex-col justify-between group"
          >
            {/* Thumbnail Header with Interactive Play Trigger */}
            <div
              onClick={() => setActiveVideo(lesson)}
              className="relative aspect-video bg-[#030813] overflow-hidden cursor-pointer"
            >
              <img
                src={lesson.thumbnail}
                alt={lesson.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              
              {/* Play Button Overlay */}
              <div className="absolute inset-0 bg-black/30 group-hover:bg-black/50 flex items-center justify-center transition-all">
                <div className="w-12 h-12 rounded-full bg-[#fe9832] text-[#683700] flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-[28px]">play_arrow</span>
                </div>
              </div>

              {/* Badges */}
              <div className="absolute top-3 left-3 flex gap-2">
                <span className="px-2.5 py-0.5 bg-black/60 backdrop-blur-sm text-white rounded-full text-[10px] font-bold">
                  {lesson.category}
                </span>
                {lesson.watched && (
                  <span className="px-2.5 py-0.5 bg-green-600/90 text-white rounded-full text-[10px] font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px]">check_circle</span>
                    <span>Completed</span>
                  </span>
                )}
              </div>

              <span className="absolute bottom-3 right-3 px-2 py-0.5 bg-black/70 text-white text-[10px] font-mono font-bold rounded">
                {lesson.duration}
              </span>
            </div>

            {/* Content Body */}
            <div className="p-5 flex flex-col flex-1 justify-between gap-4">
              <div>
                <h3
                  onClick={() => setActiveVideo(lesson)}
                  className="text-base font-bold text-[#181c1e] dark:text-white leading-snug mb-1 cursor-pointer hover:text-[#fe9832] transition-colors"
                >
                  {lesson.title}
                </h3>
                <p className="text-xs text-[#45474c] dark:text-[#828796] flex items-center gap-1.5">
                  <span>Instructor / Source:</span>
                  <span className="font-semibold text-[#030813] dark:text-white">{lesson.creator}</span>
                </p>
              </div>

              {/* Actions Footer */}
              <div className="pt-3 border-t border-[#e0e3e5] dark:border-[#2d3133] flex items-center justify-between gap-2">
                {/* Watched Toggle Checkbox */}
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[#45474c] dark:text-[#c1c6d7] hover:text-[#030813] dark:hover:text-white select-none">
                  <input
                    type="checkbox"
                    checked={lesson.watched}
                    onChange={() => toggleWatched(lesson.id)}
                    className="w-4 h-4 rounded text-[#fe9832] focus:ring-[#fe9832] cursor-pointer"
                  />
                  <span>{lesson.watched ? 'Completed' : 'Mark as Watched'}</span>
                </label>

                <button
                  type="button"
                  onClick={() => setActiveVideo(lesson)}
                  className="px-3.5 py-1.5 bg-[#fe9832] hover:bg-[#e8872b] text-[#683700] rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 shadow-sm active:scale-95 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[15px]">play_circle</span>
                  <span>Watch Video</span>
                </button>
              </div>

            </div>
          </div>
        ))}
      </div>

      {/* Embedded In-App Video Player Modal */}
      {activeVideo && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
          <div className="bg-[#030813] border border-white/15 rounded-[28px] max-w-4xl w-full overflow-hidden shadow-2xl flex flex-col animate-scaleUp">
            {/* Modal Header */}
            <div className="p-4 bg-[#0d121d] border-b border-white/10 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <span className="px-2.5 py-0.5 bg-[#fe9832] text-[#683700] rounded-full text-[10px] font-extrabold uppercase shrink-0">
                  {activeVideo.category}
                </span>
                <h2 className="text-sm sm:text-base font-bold text-white truncate">
                  {activeVideo.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setActiveVideo(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all shrink-0 cursor-pointer"
                title="Close Player"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {/* 16:9 HD Embedded YouTube Video Frame */}
            <div className="relative aspect-video w-full bg-black">
              <iframe
                src={getEmbedUrl(activeVideo.youtubeLink)}
                title={activeVideo.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="w-full h-full border-0"
              />
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-[#0d121d] border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-[#828796] flex items-center gap-1.5">
                <span>Instructor:</span>
                <span className="text-white font-semibold">{activeVideo.creator}</span>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    toggleWatched(activeVideo.id);
                    setActiveVideo((prev) => prev ? { ...prev, watched: !prev.watched } : null);
                  }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeVideo.watched
                      ? 'bg-green-600/20 text-green-400 border border-green-500/30'
                      : 'bg-[#fe9832] hover:bg-[#e8872b] text-[#683700]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[15px]">
                    {activeVideo.watched ? 'check_circle' : 'done'}
                  </span>
                  <span>{activeVideo.watched ? 'Completed' : 'Mark as Watched'}</span>
                </button>

                <a
                  href={activeVideo.youtubeLink}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                >
                  <span>Open on YouTube</span>
                  <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default LearnISLPage;
