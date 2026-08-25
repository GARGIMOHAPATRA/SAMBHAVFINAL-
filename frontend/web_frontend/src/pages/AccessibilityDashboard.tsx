import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAccessibility } from '../hooks/useAccessibility';

export const AccessibilityDashboard: React.FC = () => {
  const { user, logout, updateUserProfile } = useAuth();
  const { theme, highContrast, toggleTheme, toggleHighContrast } = useAccessibility();

  // Load profile values
  const profile = user?.profile;

  // Preferences Editor States
  const [language, setLanguage] = useState(profile?.preferredLanguage || 'English');
  const [signLanguage, setSignLanguage] = useState(profile?.preferredSignLanguage || 'ISL');
  const [textSize, setTextSize] = useState(profile?.textSizePreference || 'normal');
  const [highContrastPref, setHighContrastPref] = useState(profile?.highContrastPreference || false);
  const [commPreference] = useState(profile?.communicationPreference || 'text');
  
  // List of needs
  const [needs, setNeeds] = useState<string[]>(profile?.accessibilityNeeds || []);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleNeedToggle = (need: string) => {
    // Client-side validations for contradictory selections
    if (need === 'DEAF' && needs.includes('HARD_OF_HEARING')) {
      setError('Cannot select both Deaf and Hard of Hearing simultaneously.');
      return;
    }
    if (need === 'HARD_OF_HEARING' && needs.includes('DEAF')) {
      setError('Cannot select both Deaf and Hard of Hearing simultaneously.');
      return;
    }
    if (need === 'BLIND' && needs.includes('LOW_VISION')) {
      setError('Cannot select both Blind and Low Vision simultaneously.');
      return;
    }
    if (need === 'LOW_VISION' && needs.includes('BLIND')) {
      setError('Cannot select both Blind and Low Vision simultaneously.');
      return;
    }

    setError(null);
    setSuccess(null);
    if (needs.includes(need)) {
      setNeeds(needs.filter((n) => n !== need));
    } else {
      setNeeds([...needs, need]);
    }
  };

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      await updateUserProfile({
        preferredLanguage: language,
        preferredSignLanguage: signLanguage,
        textSizePreference: textSize,
        highContrastPreference: highContrastPref,
        communicationPreference: commPreference,
        accessibilityNeeds: needs,
      });
      setSuccess('Accessibility preferences updated successfully!');
    } catch (err: any) {
      setError(err?.message || 'Failed to update accessibility preferences.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-bg text-text transition-colors duration-200">
      
      {/* Header */}
      <header className="border-b border-border bg-cardBg py-4 px-6 md:px-8 shadow-sm transition-colors duration-200">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold tracking-tight">
              Sign<span className="text-primary font-extrabold">Bridge</span>
            </span>
            <span className="text-xs font-semibold px-2.5 py-1 bg-yellow-400 text-black rounded-full font-bold">
              Accessibility Workspace
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            
            {/* Quick settings toggles */}
            <div className="flex items-center gap-2" aria-label="Accessibility Settings">
              <button
                onClick={toggleTheme}
                className="px-3.5 py-2 bg-bg border border-border rounded-lg text-sm font-bold hover:bg-primary hover:text-bg focus:outline-none"
                aria-label="Toggle light/dark theme"
              >
                {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
              </button>
              <button
                onClick={toggleHighContrast}
                className={`px-3.5 py-2 rounded-lg border text-sm font-bold focus:outline-none ${
                  highContrast
                    ? 'bg-yellow-400 text-black border-black'
                    : 'bg-bg border-border hover:bg-primary hover:text-bg'
                }`}
                aria-label="Toggle high contrast layout"
              >
                👁️ HC
              </button>
            </div>

            <button
              onClick={logout}
              className="btn-secondary py-2 text-sm min-h-[44px] flex items-center justify-center font-bold"
              aria-label="Sign out of account"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-6 md:px-8 py-10 flex flex-col gap-10">
        
        {/* Welcome */}
        <section className="card p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6" aria-labelledby="welcome-title">
          <div>
            <h1 id="welcome-title" className="text-3xl md:text-4xl font-extrabold mb-2">Welcome, {user?.name}</h1>
            <p className="text-sm opacity-80">{user?.email}</p>
          </div>
          <button 
            disabled 
            className="btn-primary opacity-60 cursor-not-allowed min-h-[48px] flex items-center justify-center font-bold"
            aria-describedby="notice-cap"
          >
            🎥 Start Accessible Call
          </button>
        </section>

        {/* Dashboard Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Panel 1: Preferences Editor (Interactive form) */}
          <section className="card lg:col-span-2 flex flex-col gap-6" aria-labelledby="pref-title">
            <h2 id="pref-title" className="text-2xl font-extrabold border-b border-border pb-3">
              Accessibility Preferences
            </h2>

            {/* Alert status blocks */}
            {error && (
              <div className={`p-4 rounded-lg border text-sm font-semibold ${highContrast ? 'bg-black text-yellow-400 border-yellow-400' : 'bg-red-50 text-red-700 border-red-200'}`} role="alert">
                <span>⚠️ {error}</span>
              </div>
            )}
            {success && (
              <div className={`p-4 rounded-lg border text-sm font-semibold ${highContrast ? 'bg-black text-yellow-400 border-yellow-400' : 'bg-green-50 text-green-700 border-green-200'}`} role="status">
                <span>✅ {success}</span>
              </div>
            )}

            <form onSubmit={handleSavePreferences} className="flex flex-col gap-6">
              
              {/* Select Needs fieldset */}
              <fieldset className="flex flex-col gap-4">
                <legend className="font-bold text-base mb-2">Accessibility Needs Profile</legend>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  
                  <label className="flex items-center gap-3.5 p-3.5 rounded-lg border border-border bg-bg hover:border-primary cursor-pointer">
                    <input
                      type="checkbox"
                      checked={needs.includes('DEAF')}
                      onChange={() => handleNeedToggle('DEAF')}
                      className="w-6 h-6 rounded accent-primary"
                    />
                    <span className="text-base font-semibold">Deaf</span>
                  </label>

                  <label className="flex items-center gap-3.5 p-3.5 rounded-lg border border-border bg-bg hover:border-primary cursor-pointer">
                    <input
                      type="checkbox"
                      checked={needs.includes('HARD_OF_HEARING')}
                      onChange={() => handleNeedToggle('HARD_OF_HEARING')}
                      className="w-6 h-6 rounded accent-primary"
                    />
                    <span className="text-base font-semibold">Hard of Hearing</span>
                  </label>

                  <label className="flex items-center gap-3.5 p-3.5 rounded-lg border border-border bg-bg hover:border-primary cursor-pointer">
                    <input
                      type="checkbox"
                      checked={needs.includes('NON_SPEAKING')}
                      onChange={() => handleNeedToggle('NON_SPEAKING')}
                      className="w-6 h-6 rounded accent-primary"
                    />
                    <span className="text-base font-semibold">Non-speaking</span>
                  </label>

                  <label className="flex items-center gap-3.5 p-3.5 rounded-lg border border-border bg-bg hover:border-primary cursor-pointer">
                    <input
                      type="checkbox"
                      checked={needs.includes('BLIND')}
                      onChange={() => handleNeedToggle('BLIND')}
                      className="w-6 h-6 rounded accent-primary"
                    />
                    <span className="text-base font-semibold">Blind</span>
                  </label>

                  <label className="flex items-center gap-3.5 p-3.5 rounded-lg border border-border bg-bg hover:border-primary cursor-pointer">
                    <input
                      type="checkbox"
                      checked={needs.includes('LOW_VISION')}
                      onChange={() => handleNeedToggle('LOW_VISION')}
                      className="w-6 h-6 rounded accent-primary"
                    />
                    <span className="text-base font-semibold">Low Vision</span>
                  </label>

                  <label className="flex items-center gap-3.5 p-3.5 rounded-lg border border-border bg-bg hover:border-primary cursor-pointer">
                    <input
                      type="checkbox"
                      checked={needs.includes('OTHER')}
                      onChange={() => handleNeedToggle('OTHER')}
                      className="w-6 h-6 rounded accent-primary"
                    />
                    <span className="text-base font-semibold">Other Accessibility Needs</span>
                  </label>

                </div>
              </fieldset>

              <hr className="border-border" />

              {/* Preference Dropdowns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Language Select */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="pref-lang" className="font-bold text-sm">Preferred Language</label>
                  <select
                    id="pref-lang"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full min-h-[44px] px-3 rounded-lg border border-border bg-bg text-text"
                  >
                    <option value="English">English</option>
                    <option value="Hindi">Hindi</option>
                    <option value="Tamil">Tamil</option>
                    <option value="Bengali">Bengali</option>
                  </select>
                </div>

                {/* Sign Language Select */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="pref-sign" className="font-bold text-sm">Preferred Sign Language</label>
                  <select
                    id="pref-sign"
                    value={signLanguage}
                    onChange={(e) => setSignLanguage(e.target.value)}
                    className="w-full min-h-[44px] px-3 rounded-lg border border-border bg-bg text-text"
                  >
                    <option value="ISL">Indian Sign Language (ISL)</option>
                    <option value="ASL">American Sign Language (ASL)</option>
                    <option value="BSL">British Sign Language (BSL)</option>
                  </select>
                </div>

                {/* Size Preference */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="pref-size" className="font-bold text-sm">Text Size Scale</label>
                  <select
                    id="pref-size"
                    value={textSize}
                    onChange={(e) => setTextSize(e.target.value)}
                    className="w-full min-h-[44px] px-3 rounded-lg border border-border bg-bg text-text"
                  >
                    <option value="normal">Default size (100%)</option>
                    <option value="large">Large size (110%)</option>
                    <option value="xlarge">Extra Large size (120%)</option>
                  </select>
                </div>

                {/* Contrast Preference */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="pref-contrast" className="font-bold text-sm">High Contrast Mode</label>
                  <select
                    id="pref-contrast"
                    value={highContrastPref ? 'true' : 'false'}
                    onChange={(e) => setHighContrastPref(e.target.value === 'true')}
                    className="w-full min-h-[44px] px-3 rounded-lg border border-border bg-bg text-text"
                  >
                    <option value="false">Default colors</option>
                    <option value="true">High Contrast (HC)</option>
                  </select>
                </div>

              </div>

              {/* Submit preferences */}
              <button
                type="submit"
                disabled={saving}
                className="btn-primary min-h-[48px] font-bold text-base mt-2 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="w-5 h-5 border-2 border-bg border-t-transparent rounded-full animate-spin" aria-hidden="true" />
                    <span>Saving Preferences...</span>
                  </>
                ) : (
                  <span>Save Preferences</span>
                )}
              </button>

            </form>
          </section>

          {/* Panel 2: Sidebar contacts list */}
          <div className="flex flex-col gap-8">
            
            {/* Contacts list */}
            <section className="card flex flex-col gap-4" aria-labelledby="contacts-title">
              <h2 id="contacts-title" className="text-xl font-bold border-b border-border pb-2">
                Contacts
              </h2>
              <div className="flex flex-col items-center justify-center py-10 text-center border border-dashed border-border rounded-lg bg-bg/50">
                <span className="text-2xl mb-2" aria-hidden="true">👥</span>
                <p className="text-sm font-semibold opacity-75">Your contact list is empty.</p>
              </div>
            </section>

            {/* Profile Info */}
            <section className="card flex flex-col gap-3" aria-labelledby="info-title">
              <h2 id="info-title" className="text-xl font-bold border-b border-border pb-2">
                Account Information
              </h2>
              <ul className="text-sm flex flex-col gap-2 opacity-90">
                <li><strong>Account Type:</strong> Accessibility User</li>
                <li><strong>Security Status:</strong> SSL Cryptographic Session</li>
                <li><strong>Database Key:</strong> <code className="bg-bg px-1 rounded text-xs select-all">{user?.id}</code></li>
              </ul>
            </section>

          </div>

        </div>

        {/* Notice */}
        <div 
          id="notice-cap" 
          className="p-4 rounded-lg bg-primary/5 border border-primary/20 text-xs md:text-sm font-medium"
        >
          💡 <strong>Workspace Notice:</strong> Real-time calling, captions, and sign-language translation adapters are planned for upcoming implementation phases. This panel currently operates as a layout placeholder.
        </div>
      </main>

      <footer className="border-t border-[#e0e3e5] dark:border-[#2d3133] bg-[#f1f4f6] dark:bg-[#0d121d] py-6 px-6 text-center text-xs text-[#45474c] dark:text-[#828796] transition-colors duration-200 mt-auto">
        <span>&copy; 2026 SAMBHAV. All rights reserved.</span>
      </footer>
    </div>
  );
};
export default AccessibilityDashboard;
