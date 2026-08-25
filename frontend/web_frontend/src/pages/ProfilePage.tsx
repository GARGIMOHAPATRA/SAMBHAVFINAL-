import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAccessibility } from '../hooks/useAccessibility';
import type { FontSize } from '../hooks/useAccessibility';

export const ProfilePage: React.FC = () => {
  const { user, updateUserName, updateUserAvatar, updateUserProfile } = useAuth();
  const { fontSize, setFontSize, theme, toggleTheme } = useAccessibility();

  // Name editing state
  const [name, setName] = useState(user?.name || '');
  const [savingName, setSavingName] = useState(false);
  const [nameSuccess, setNameSuccess] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);

  // Avatar states
  const [avatarSuccess, setAvatarSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile preferences
  const profile = user?.profile;
  const [language, setLanguage] = useState(profile?.preferredLanguage || 'English');
  const [signLanguage, setSignLanguage] = useState(profile?.preferredSignLanguage || 'ISL');
  const [commPreference, setCommPreference] = useState(profile?.communicationPreference || 'text');
  const [needs, setNeeds] = useState<string[]>(profile?.accessibilityNeeds || []);
  
  // Local state managers for preferences
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [prefError, setPrefError] = useState<string | null>(null);
  const [prefSuccess, setPrefSuccess] = useState<string | null>(null);

  // Live dynamic initial based on entered name
  const liveInitial = (name || user?.name || 'U').trim().charAt(0).toUpperCase();
  const customAvatarUrl = user?.avatarUrl;

  // Handle Name update
  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setNameError('Name cannot be empty.');
      return;
    }
    setSavingName(true);
    setNameError(null);
    setNameSuccess(null);

    try {
      await updateUserName(name.trim());
      setNameSuccess('Your name has been updated successfully!');
      setTimeout(() => setNameSuccess(null), 3500);
    } catch (err: any) {
      setNameError(err?.message || 'Failed to update name. Please try again.');
    } finally {
      setSavingName(false);
    }
  };

  // Handle custom photo upload
  const handleCustomFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      alert('Photo file size must be less than 3MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      if (typeof reader.result === 'string') {
        await updateUserAvatar(reader.result);
        setAvatarSuccess('Custom profile photo uploaded and applied!');
        setTimeout(() => setAvatarSuccess(null), 3000);
      }
    };
    reader.readAsDataURL(file);
  };

  // Reset back to initial letter
  const handleRemovePhoto = async () => {
    await updateUserAvatar('');
    setAvatarSuccess('Profile photo reset to default name initial!');
    setTimeout(() => setAvatarSuccess(null), 3000);
  };

  const handleNeedToggle = (need: string) => {
    if (need === 'DEAF' && needs.includes('HARD_OF_HEARING')) {
      setPrefError('Cannot select both Deaf and Hard of Hearing simultaneously.');
      return;
    }
    if (need === 'HARD_OF_HEARING' && needs.includes('DEAF')) {
      setPrefError('Cannot select both Deaf and Hard of Hearing simultaneously.');
      return;
    }
    if (need === 'BLIND' && needs.includes('LOW_VISION')) {
      setPrefError('Cannot select both Blind and Low Vision simultaneously.');
      return;
    }
    if (need === 'LOW_VISION' && needs.includes('BLIND')) {
      setPrefError('Cannot select both Blind and Low Vision simultaneously.');
      return;
    }

    setPrefError(null);
    setPrefSuccess(null);
    if (needs.includes(need)) {
      setNeeds(needs.filter((n) => n !== need));
    } else {
      setNeeds([...needs, need]);
    }
  };

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPrefs(true);
    setPrefError(null);
    setPrefSuccess(null);

    try {
      await updateUserProfile({
        preferredLanguage: language,
        preferredSignLanguage: signLanguage,
        textSizePreference: fontSize,
        highContrastPreference: false,
        communicationPreference: commPreference,
        accessibilityNeeds: needs,
      });

      setPrefSuccess('Accessibility preferences updated successfully!');
      setTimeout(() => setPrefSuccess(null), 3500);
    } catch (err: any) {
      setPrefError(err?.message || 'Failed to save preferences.');
    } finally {
      setSavingPrefs(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 w-full max-w-5xl mx-auto animate-fadeIn font-['Inter',sans-serif]">
      
      {/* Header */}
      <header className="border-b border-[#e0e3e5] dark:border-[#2d3133] pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-[#fe9832]/10 flex items-center justify-center text-[#fe9832]">
            <span className="material-symbols-outlined text-[24px]">manage_accounts</span>
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#030813] dark:text-white tracking-tight">
              Profile &amp; Settings
            </h1>
            <p className="text-xs sm:text-sm text-[#45474c] dark:text-[#c1c6d7] mt-0.5">
              Customize your public profile, update your profile image, and adjust accessibility presets.
            </p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* ========================================================================= */}
        {/* LEFT COLUMN: PROFILE PHOTO & ACCOUNT DETAILS (7 COLS)                     */}
        {/* ========================================================================= */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          
          {/* SECTION 1: PROFILE PHOTO */}
          <section className="bg-white dark:bg-[#1a202c] rounded-[24px] p-6 border border-[#e0e3e5] dark:border-[#2d3133] shadow-xs flex flex-col gap-5">
            <div className="flex items-center justify-between border-b border-[#e0e3e5] dark:border-[#2d3133] pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#fe9832] text-[22px]">account_circle</span>
                <h2 className="text-base font-bold text-[#030813] dark:text-white">Profile Photo</h2>
              </div>
              <span className="text-[11px] text-[#45474c] dark:text-[#828796]">Displayed across sidebar &amp; calls</span>
            </div>

            {avatarSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-2 animate-fadeIn">
                <span className="material-symbols-outlined text-[18px]">check_circle</span>
                <span>{avatarSuccess}</span>
              </div>
            )}

            {/* Profile Avatar Card */}
            <div className="flex flex-col sm:flex-row items-center gap-5 p-5 rounded-2xl bg-[#f7fafc] dark:bg-[#0d121d] border border-[#e0e3e5] dark:border-[#2d3133]">
              
              {/* Avatar Circle Preview (Custom Photo or Live Dynamic Name Initial) */}
              <div className="relative group shrink-0">
                {customAvatarUrl ? (
                  <img
                    src={customAvatarUrl}
                    alt={name || user?.name || 'Profile'}
                    className="w-20 h-20 rounded-full object-cover border-4 border-white dark:border-[#1a202c] shadow-md ring-2 ring-[#fe9832]"
                  />
                ) : (
                  <div
                    className="w-20 h-20 rounded-full bg-gradient-to-br from-[#fe9832] via-[#e8872b] to-[#012700] text-white flex items-center justify-center font-black text-3xl border-4 border-white dark:border-[#1a202c] shadow-md ring-2 ring-[#fe9832] select-none tracking-tight transition-all"
                  >
                    {liveInitial}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer text-white"
                  title="Upload profile photo"
                >
                  <span className="material-symbols-outlined text-[22px]">photo_camera</span>
                </button>
              </div>

              {/* Photo Description & Single Upload Action */}
              <div className="flex flex-col items-center sm:items-start text-center sm:text-left gap-1.5 flex-1">
                <div>
                  <p className="text-sm font-bold text-[#030813] dark:text-white">
                    {customAvatarUrl ? 'Custom Profile Photo' : `Default Initial Avatar (${liveInitial})`}
                  </p>
                  <p className="text-xs text-[#45474c] dark:text-[#828796] mt-0.5">
                    {customAvatarUrl
                      ? 'You have uploaded a custom profile picture.'
                      : 'By default, your profile picture shows the first letter of your name. It updates dynamically as you change your name.'}
                  </p>
                </div>

                <div className="flex items-center flex-wrap gap-2.5 mt-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleCustomFileUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3.5 py-2 bg-[#fe9832] hover:bg-[#e8872b] text-[#683700] rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer transition-all hover:-translate-y-0.5"
                  >
                    <span className="material-symbols-outlined text-[16px]">upload</span>
                    <span>Upload Image</span>
                  </button>

                  {customAvatarUrl && (
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="px-3 py-2 bg-white dark:bg-[#1a202c] border border-[#c6c6cc] dark:border-[#2d3133] hover:border-red-500 text-red-600 dark:text-red-400 rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1 cursor-pointer transition-all hover:-translate-y-0.5"
                    >
                      <span className="material-symbols-outlined text-[15px]">delete</span>
                      <span>Remove &amp; Use Initial</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 2: EDITABLE NAME & UNCHANGEABLE ACCOUNT IDENTIFIERS */}
          <section className="bg-white dark:bg-[#1a202c] rounded-[24px] p-6 border border-[#e0e3e5] dark:border-[#2d3133] shadow-xs flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b border-[#e0e3e5] dark:border-[#2d3133] pb-3">
              <span className="material-symbols-outlined text-[#fe9832] text-[22px]">badge</span>
              <h2 className="text-base font-bold text-[#030813] dark:text-white">Account Details &amp; Identity</h2>
            </div>

            {nameSuccess && (
              <div className="p-3 rounded-xl bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 text-xs font-semibold text-green-700 dark:text-green-300 flex items-center gap-2 animate-fadeIn">
                <span className="material-symbols-outlined text-[18px]">check_circle</span>
                <span>{nameSuccess}</span>
              </div>
            )}

            {nameError && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs font-semibold text-red-700 dark:text-red-300 flex items-center gap-2 animate-fadeIn">
                <span className="material-symbols-outlined text-[18px]">error</span>
                <span>{nameError}</span>
              </div>
            )}

            <form onSubmit={handleSaveName} className="flex flex-col gap-4 text-xs">
              
              {/* 1. EDITABLE NAME FIELD */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="user-name" className="font-bold text-[#181c1e] dark:text-white flex items-center gap-1">
                    <span>Full Name</span>
                    <span className="text-[#fe9832]">*</span>
                  </label>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-0.5">
                    <span className="material-symbols-outlined text-[13px]">edit</span>
                    Editable
                  </span>
                </div>
                <div className="flex gap-2">
                  <input
                    id="user-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                    className="flex-1 min-h-[42px] px-3.5 rounded-xl border border-[#c6c6cc] dark:border-[#2d3133] bg-white dark:bg-[#030813] text-[#030813] dark:text-white font-medium outline-none focus:border-[#fe9832] focus:ring-2 focus:ring-[#fe9832]/20 transition-all text-xs"
                  />
                  <button
                    type="submit"
                    disabled={savingName || name.trim() === user?.name}
                    className={`px-4 rounded-xl font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer ${
                      savingName || name.trim() === user?.name
                        ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                        : 'bg-[#fe9832] hover:bg-[#e8872b] text-[#683700] hover:-translate-y-0.5'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">save</span>
                    <span>{savingName ? 'Saving...' : 'Update Name'}</span>
                  </button>
                </div>
                <p className="text-[11px] text-[#45474c] dark:text-[#828796]">
                  This is the name displayed during 1-on-1 video calls, live transcripts, and chat logs.
                </p>
              </div>

              {/* 2. UNCHANGEABLE EMAIL ID FIELD */}
              <div className="flex flex-col gap-1.5 pt-2 border-t border-[#e0e3e5] dark:border-[#2d3133]">
                <div className="flex items-center justify-between">
                  <label htmlFor="user-email" className="font-bold text-[#181c1e] dark:text-white flex items-center gap-1">
                    <span>Email Address</span>
                  </label>
                  <span className="text-[10px] text-gray-500 dark:text-gray-400 font-semibold flex items-center gap-0.5 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                    <span className="material-symbols-outlined text-[13px]">lock</span>
                    Locked &bull; Unchangeable
                  </span>
                </div>
                <div className="relative">
                  <input
                    id="user-email"
                    type="email"
                    disabled
                    value={user?.email || ''}
                    className="w-full min-h-[42px] px-3.5 pr-9 rounded-xl border border-[#e0e3e5] dark:border-[#2d3133] bg-[#f1f4f6] dark:bg-[#0d121d] text-gray-500 dark:text-gray-400 font-medium cursor-not-allowed text-xs select-none"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <span className="material-symbols-outlined text-[16px]">lock</span>
                  </div>
                </div>
                <p className="text-[10px] text-gray-400 dark:text-gray-500">
                  Your email address is your permanent account security identifier and cannot be modified.
                </p>
              </div>

              {/* 3. UNCHANGEABLE USER TYPE / ROLE FIELD */}
              <div className="flex flex-col gap-1.5 pt-2 border-t border-[#e0e3e5] dark:border-[#2d3133]">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-[#181c1e] dark:text-white flex items-center gap-1">
                    <span>User Account Type</span>
                  </label>
                  <span className="text-[10px] text-gray-500 dark:text-gray-400 font-semibold flex items-center gap-0.5 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                    <span className="material-symbols-outlined text-[13px]">lock</span>
                    Fixed Role
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl border border-[#e0e3e5] dark:border-[#2d3133] bg-[#f1f4f6] dark:bg-[#0d121d] select-none">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#fe9832] text-[18px]">verified_user</span>
                    <span className="font-bold text-xs text-[#030813] dark:text-white">
                      {user?.accountType === 'ACCESSIBILITY_USER'
                        ? 'Deaf & Hard-of-Hearing (Accessibility Profile)'
                        : user?.accountType === 'ADMIN'
                        ? 'System Administrator'
                        : 'Standard Common User (Hearing/Speech)'}
                    </span>
                  </div>
                  <span className="font-mono text-[10px] font-bold text-[#8f4e00] dark:text-[#fe9832] bg-[#ffdcc2] dark:bg-[#fe9832]/20 px-2 py-0.5 rounded">
                    {user?.accountType || 'COMMON_USER'}
                  </span>
                </div>
                <p className="text-[10px] text-gray-400 dark:text-gray-500">
                  Account role defines your default live communication interface and workspace presets.
                </p>
              </div>

            </form>
          </section>

        </div>

        {/* ========================================================================= */}
        {/* RIGHT COLUMN: ACCESSIBILITY PREFERENCES & DISPLAY CONTROLS (5 COLS)      */}
        {/* ========================================================================= */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          {/* SECTION 3: ACCESSIBILITY NEEDS PRESETS */}
          <section className="bg-white dark:bg-[#1a202c] rounded-[24px] p-6 border border-[#e0e3e5] dark:border-[#2d3133] shadow-xs flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b border-[#e0e3e5] dark:border-[#2d3133] pb-3">
              <span className="material-symbols-outlined text-[#fe9832] text-[22px]">accessibility</span>
              <h2 className="text-base font-bold text-[#030813] dark:text-white">Accessibility Needs Profile</h2>
            </div>
            
            <p className="text-xs text-[#45474c] dark:text-[#828796]">
              Select presets that describe your communication preferences for AI assistance:
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {[
                { key: 'DEAF', label: 'Deaf' },
                { key: 'HARD_OF_HEARING', label: 'Hard of Hearing' },
                { key: 'NON_SPEAKING', label: 'Non-speaking' },
                { key: 'BLIND', label: 'Blind' },
                { key: 'LOW_VISION', label: 'Low Vision' },
                { key: 'OTHER', label: 'Other Needs' }
              ].map((item) => (
                <label 
                  key={item.key} 
                  className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                    needs.includes(item.key) 
                      ? 'border-[#fe9832] bg-[#fe9832]/10 text-[#030813] dark:text-white' 
                      : 'border-[#e0e3e5] dark:border-[#2d3133] bg-[#f7fafc] dark:bg-[#030813] text-[#45474c] dark:text-[#c1c6d7] hover:border-[#fe9832]'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={needs.includes(item.key)}
                    onChange={() => handleNeedToggle(item.key)}
                    className="w-4 h-4 rounded text-[#fe9832] focus:ring-[#fe9832] cursor-pointer"
                  />
                  <span className="text-xs font-bold">{item.label}</span>
                </label>
              ))}
            </div>

            {/* Language & Workspace Dropdowns */}
            <div className="flex flex-col gap-3 pt-3 border-t border-[#e0e3e5] dark:border-[#2d3133] text-xs">
              <div className="flex flex-col gap-1">
                <label htmlFor="pref-lang" className="font-bold text-[#181c1e] dark:text-white">Preferred Spoken Language</label>
                <select
                  id="pref-lang"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="min-h-[38px] px-3 rounded-xl border border-[#c6c6cc] dark:border-[#2d3133] bg-[#f7fafc] dark:bg-[#030813] text-[#030813] dark:text-white font-semibold outline-none text-xs"
                >
                  <option value="English">English</option>
                  <option value="Hindi">Hindi</option>
                  <option value="Tamil">Tamil</option>
                  <option value="Bengali">Bengali</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label htmlFor="pref-sign" className="font-bold text-[#181c1e] dark:text-white">Preferred Sign Language</label>
                <select
                  id="pref-sign"
                  value={signLanguage}
                  onChange={(e) => setSignLanguage(e.target.value)}
                  className="min-h-[38px] px-3 rounded-xl border border-[#c6c6cc] dark:border-[#2d3133] bg-[#f7fafc] dark:bg-[#030813] text-[#030813] dark:text-white font-semibold outline-none text-xs"
                >
                  <option value="ISL">Indian Sign Language (ISL)</option>
                  <option value="ASL">American Sign Language (ASL)</option>
                  <option value="BSL">British Sign Language (BSL)</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label htmlFor="pref-comm" className="font-bold text-[#181c1e] dark:text-white">Default Communication Mode</label>
                <select
                  id="pref-comm"
                  value={commPreference}
                  onChange={(e) => setCommPreference(e.target.value)}
                  className="min-h-[38px] px-3 rounded-xl border border-[#c6c6cc] dark:border-[#2d3133] bg-[#f7fafc] dark:bg-[#030813] text-[#030813] dark:text-white font-semibold outline-none text-xs"
                >
                  <option value="text">Text Conversational Input</option>
                  <option value="sign">Sign Language Gestures</option>
                  <option value="speech">Spoken Audio Output</option>
                </select>
              </div>
            </div>

            {prefError && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs font-semibold text-red-700 dark:text-red-300">
                {prefError}
              </div>
            )}
            {prefSuccess && (
              <div className="p-3 rounded-xl bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 text-xs font-semibold text-green-700 dark:text-green-300">
                {prefSuccess}
              </div>
            )}

            <button
              type="button"
              onClick={handleSavePreferences}
              disabled={savingPrefs}
              className="w-full py-2.5 bg-[#fe9832] hover:bg-[#e8872b] text-[#683700] rounded-xl font-bold text-xs transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer mt-1"
            >
              <span className="material-symbols-outlined text-[16px]">save</span>
              <span>{savingPrefs ? 'Saving...' : 'Save Accessibility Settings'}</span>
            </button>
          </section>

          {/* SECTION 4: DISPLAY MODE & THEME */}
          <section className="bg-white dark:bg-[#1a202c] rounded-[24px] p-6 border border-[#e0e3e5] dark:border-[#2d3133] shadow-xs flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b border-[#e0e3e5] dark:border-[#2d3133] pb-3">
              <span className="material-symbols-outlined text-[#fe9832] text-[22px]">palette</span>
              <h2 className="text-base font-bold text-[#030813] dark:text-white">Display &amp; Font Scaling</h2>
            </div>
            
            {/* Theme Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-[#181c1e] dark:text-white">App Color Theme</p>
                <p className="text-[10px] text-[#45474c] dark:text-[#828796]">
                  {theme === 'dark' ? 'Sleek Dark Mode' : 'Clean Light Mode'}
                </p>
              </div>
              <button
                type="button"
                onClick={toggleTheme}
                className="px-3.5 py-1.5 bg-[#f1f4f6] dark:bg-[#2d3133] hover:bg-[#e0e3e5] dark:hover:bg-[#3d4346] text-[#030813] dark:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">
                  {theme === 'dark' ? 'light_mode' : 'dark_mode'}
                </span>
                <span>{theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}</span>
              </button>
            </div>

            {/* Font scaling selector */}
            <div className="flex flex-col gap-1 text-xs pt-2 border-t border-[#e0e3e5] dark:border-[#2d3133]">
              <label htmlFor="select-fontsize" className="font-bold text-[#181c1e] dark:text-white">Text Size Scaling</label>
              <select
                id="select-fontsize"
                value={fontSize}
                onChange={(e) => setFontSize(e.target.value as FontSize)}
                className="min-h-[38px] px-3 rounded-xl border border-[#c6c6cc] dark:border-[#2d3133] bg-[#f7fafc] dark:bg-[#030813] text-[#030813] dark:text-white font-semibold outline-none text-xs"
              >
                <option value="small">Small scale (85%)</option>
                <option value="normal">Standard scale (100%)</option>
                <option value="large">Large scale (115%)</option>
                <option value="xlarge">Extra Large scale (130%)</option>
              </select>
            </div>

          </section>

        </div>

      </div>

    </div>
  );
};

export default ProfilePage;
