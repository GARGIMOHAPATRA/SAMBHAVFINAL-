import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getSessions } from '../utils/communicationApi';
import type { CommunicationSessionDto } from '../utils/communicationApi';

interface SavedTranslation {
  id: string;
  type: string;
  sourceText: string;
  timestamp: string;
  roomCode?: string;
  transcripts?: Array<{
    id: string;
    senderId: string;
    senderName: string;
    text: string;
    timestamp: number;
  }>;
  historyLogs?: Array<{
    mode: string;
    text: string;
    time: string;
  }>;
  sequence?: any;
}

export const HistoryPage: React.FC = () => {
  const { accessToken } = useAuth();
  const [sessions, setSessions] = useState<CommunicationSessionDto[]>([]);
  const [savedTranslations, setSavedTranslations] = useState<SavedTranslation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ALL' | 'CALLS' | 'SAVED_TRANSLATIONS'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const data = await getSessions(accessToken);
        setSessions(data);

        // Load local saved translations & saved 1-on-1 call chats
        const saved = JSON.parse(localStorage.getItem('sambhav_saved_translations') || '[]');
        setSavedTranslations(saved);
      } catch (err: any) {
        console.error('Failed to retrieve session history:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [accessToken]);

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDeleteSavedTranslation = (id: string) => {
    const updated = savedTranslations.filter((t) => t.id !== id);
    setSavedTranslations(updated);
    localStorage.setItem('sambhav_saved_translations', JSON.stringify(updated));
  };

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const filteredSessions = sessions.filter((s) => {
    if (activeTab === 'SAVED_TRANSLATIONS') return false;
    if (!searchQuery) return true;
    return (
      (s.roomCode && s.roomCode.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (s.mode && s.mode.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  const filteredTranslations = savedTranslations.filter((t) => {
    if (activeTab === 'CALLS') return false;
    if (!searchQuery) return true;
    return t.sourceText.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="flex flex-col gap-8 w-full max-w-6xl mx-auto animate-fadeIn font-['Inter',sans-serif]">
      
      {/* Header */}
      <header className="border-b border-[#e0e3e5] dark:border-[#2d3133] pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#fe9832] text-[28px]">history</span>
            <h1 className="text-3xl font-bold text-[#030813] dark:text-white tracking-tight">Communication History</h1>
          </div>
          <p className="text-sm text-[#45474c] dark:text-[#c1c6d7] mt-1">
            Access past call sessions, saved conversation transcripts, and ISL translations.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-72">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#828796] text-[20px]">
            search
          </span>
          <input
            type="text"
            placeholder="Search by code or phrase..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-[#1a202c] border border-[#e0e3e5] dark:border-[#2d3133] rounded-xl text-xs text-[#030813] dark:text-white focus:border-[#fe9832] outline-none transition-colors"
          />
        </div>
      </header>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[#e0e3e5] dark:border-[#2d3133] pb-2">
        <button
          onClick={() => setActiveTab('ALL')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'ALL'
              ? 'bg-[#030813] dark:bg-[#fe9832] text-white dark:text-[#683700] shadow-sm'
              : 'text-[#45474c] dark:text-[#c1c6d7] hover:bg-[#f1f4f6] dark:hover:bg-[#1a202c]'
          }`}
        >
          All Activity ({sessions.length + savedTranslations.length})
        </button>

        <button
          onClick={() => setActiveTab('CALLS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'CALLS'
              ? 'bg-[#030813] dark:bg-[#fe9832] text-white dark:text-[#683700] shadow-sm'
              : 'text-[#45474c] dark:text-[#c1c6d7] hover:bg-[#f1f4f6] dark:hover:bg-[#1a202c]'
          }`}
        >
          Call Sessions ({sessions.length})
        </button>

        <button
          onClick={() => setActiveTab('SAVED_TRANSLATIONS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'SAVED_TRANSLATIONS'
              ? 'bg-[#030813] dark:bg-[#fe9832] text-white dark:text-[#683700] shadow-sm'
              : 'text-[#45474c] dark:text-[#c1c6d7] hover:bg-[#f1f4f6] dark:hover:bg-[#1a202c]'
          }`}
        >
          Saved Chats & Translations ({savedTranslations.length})
        </button>
      </div>

      {/* Content List */}
      {loading ? (
        <div className="py-12 text-center text-xs text-[#45474c] dark:text-[#828796] animate-pulse">
          Loading communication logs...
        </div>
      ) : (
        <div className="space-y-4">
          
          {/* Saved Translations & 1-on-1 Call Chats Section */}
          {filteredTranslations.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#8f4e00] dark:text-[#fe9832]">
                Saved Chats & Translations
              </h3>
              {filteredTranslations.map((t) => {
                const isExpanded = expandedId === t.id;
                const hasDetailedChat = (t.transcripts && t.transcripts.length > 0) || (t.historyLogs && t.historyLogs.length > 0);

                return (
                  <div
                    key={t.id}
                    className="bg-white dark:bg-[#1a202c] rounded-2xl p-5 border border-[#e0e3e5] dark:border-[#2d3133] shadow-sm hover:border-[#fe9832] transition-all flex flex-col gap-4"
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#fe9832]/10 text-[#8f4e00] dark:text-[#fe9832] flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-[20px]">
                            {t.type === '1_ON_1_VIDEO_CALL' ? 'videocam' : 'translate'}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="font-bold text-sm text-[#030813] dark:text-white">
                              {t.type === '1_ON_1_VIDEO_CALL' ? `1-on-1 Call (${t.roomCode || 'Private Room'})` : t.sourceText}
                            </span>
                            <span className="px-2 py-0.5 bg-[#f1f4f6] dark:bg-[#2d3133] text-[#45474c] dark:text-[#c1c6d7] text-[10px] font-bold rounded-full">
                              {t.type === '1_ON_1_VIDEO_CALL' ? '1-on-1 Video Call' : t.type}
                            </span>
                          </div>
                          <p className="text-xs text-[#45474c] dark:text-[#828796]">
                            Saved on {new Date(t.timestamp).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        {hasDetailedChat && (
                          <button
                            type="button"
                            onClick={() => toggleExpand(t.id)}
                            className="px-3 py-1.5 bg-[#f1f4f6] dark:bg-[#2d3133] hover:bg-[#e0e3e5] text-[#030813] dark:text-white rounded-lg text-xs font-semibold flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-[16px]">
                              {isExpanded ? 'expand_less' : 'expand_more'}
                            </span>
                            <span>{isExpanded ? 'Hide Chat' : 'View Chat'}</span>
                          </button>
                        )}
                        <button
                          onClick={() => handleCopyText(t.sourceText, t.id)}
                          className="px-3 py-1.5 bg-[#f1f4f6] dark:bg-[#2d3133] hover:bg-[#e0e3e5] text-[#030813] dark:text-white rounded-lg text-xs font-semibold flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-[14px]">
                            {copiedId === t.id ? 'check' : 'content_copy'}
                          </span>
                          <span>{copiedId === t.id ? 'Copied' : 'Copy'}</span>
                        </button>
                        <button
                          onClick={() => handleDeleteSavedTranslation(t.id)}
                          className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/40 text-red-500 rounded-lg transition-colors"
                          title="Delete saved conversation"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                    </div>

                    {/* Expandable Chat Dialogue Breakdown */}
                    {isExpanded && hasDetailedChat && (
                      <div className="mt-2 pt-3 border-t border-[#e0e3e5] dark:border-[#2d3133] bg-[#f7fafc] dark:bg-[#030813] p-4 rounded-xl flex flex-col gap-2.5 max-h-60 overflow-y-auto animate-fadeIn">
                        <span className="text-[11px] font-bold text-[#828796] uppercase tracking-wider">
                          Conversation Dialogue History
                        </span>
                        
                        {t.transcripts && t.transcripts.map((msg, idx) => (
                          <div key={idx} className="flex items-baseline justify-between text-xs border-b border-[#e0e3e5]/60 dark:border-[#2d3133]/60 pb-1.5">
                            <div className="flex items-center gap-2 max-w-[85%]">
                              <span className="font-bold text-[#fe9832] shrink-0">{msg.senderName}:</span>
                              <span className="text-[#030813] dark:text-white">{msg.text}</span>
                            </div>
                            <span className="text-[10px] text-[#828796]">
                              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        ))}

                        {t.historyLogs && t.historyLogs.map((log, idx) => (
                          <div key={idx} className="flex items-baseline justify-between text-xs border-b border-[#e0e3e5]/60 dark:border-[#2d3133]/60 pb-1.5">
                            <div className="flex items-center gap-2 max-w-[85%]">
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#fe9832]/20 text-[#fe9832]">
                                {log.mode}
                              </span>
                              <span className="text-[#030813] dark:text-white">{log.text}</span>
                            </div>
                            <span className="text-[10px] text-[#828796]">{log.time}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Backend Call Sessions Section */}
          {filteredSessions.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#45474c] dark:text-[#828796]">
                All Call Sessions
              </h3>
              {filteredSessions.map((call) => {
                const isCallActive = call.status === 'ACTIVE' || call.status === 'WAITING' || call.status === 'CREATED';

                return (
                  <div
                    key={call.id}
                    className="bg-white dark:bg-[#1a202c] rounded-2xl p-5 border border-[#e0e3e5] dark:border-[#2d3133] shadow-sm hover:border-[#fe9832] transition-colors flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#030813]/5 dark:bg-white/5 text-[#030813] dark:text-white flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-[20px]">videocam</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-bold text-sm text-[#030813] dark:text-white">
                            Room Code: <span className="font-mono text-[#fe9832]">{call.roomCode || call.id.substring(0, 8)}</span>
                          </span>
                          <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full ${
                            isCallActive
                              ? 'bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                          }`}>
                            {call.status}
                          </span>
                        </div>
                        <p className="text-xs text-[#45474c] dark:text-[#828796]">
                          Created on {new Date(call.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      {call.roomCode && (
                        <button
                          onClick={() => handleCopyText(call.roomCode || '', call.id)}
                          className="px-3 py-1.5 bg-[#f1f4f6] dark:bg-[#2d3133] hover:bg-[#e0e3e5] text-[#030813] dark:text-white rounded-lg text-xs font-semibold flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-[14px]">
                            {copiedId === call.id ? 'check' : 'content_copy'}
                          </span>
                          <span>{copiedId === call.id ? 'Copied' : 'Copy Code'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {filteredTranslations.length === 0 && filteredSessions.length === 0 && (
            <div className="py-16 text-center text-xs text-[#45474c] dark:text-[#828796]">
              No matching communication sessions found.
            </div>
          )}

        </div>
      )}

    </div>
  );
};

export default HistoryPage;
