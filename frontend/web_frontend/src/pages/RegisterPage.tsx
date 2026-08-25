import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const RegisterPage: React.FC = () => {
  const { registerUser } = useAuth();
  const navigate = useNavigate();

  // Multi-step: 1 = Account Info, 2 = Account Type, 3 = Accessibility Needs
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [accountType, setAccountType] = useState<'COMMON_USER' | 'ACCESSIBILITY_USER'>('COMMON_USER');
  const [selectedNeeds, setSelectedNeeds] = useState<string[]>([]);

  // Preferences Defaults
  const [preferredLanguage, _setPreferredLanguage] = useState('English');
  const [preferredSignLanguage, setPreferredSignLanguage] = useState('ISL');
  const [communicationPreference, setCommunicationPreference] = useState('text');

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 3-Image High-Resolution Animation & Hover Sequencer
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const gestureImages = [
    {
      id: 0,
      src: '/assets/isl_gesture_hello.jpg',
      title: 'Hello',
      description: 'Greeting & Welcome Sign in Indian Sign Language',
    },
    {
      id: 1,
      src: '/assets/isl_gesture_thankyou.jpg',
      title: 'Thank you',
      description: 'Gratitude & Appreciation Sign in Indian Sign Language',
    },
    {
      id: 2,
      src: '/assets/isl_gesture_sorry.jpg',
      title: 'Sorry',
      description: 'Apology & Regret Sign in Indian Sign Language',
    },
  ];

  useEffect(() => {
    if (isHovered) return;
    const timer = setInterval(() => {
      setActiveImageIndex((prev) => (prev + 1) % gestureImages.length);
    }, 2800);
    return () => clearInterval(timer);
  }, [isHovered, gestureImages.length]);

  const handleNextStep = () => {
    if (step === 1) {
      if (!name.trim() || !email.trim() || !password) {
        setError('Please fill in all required fields.');
        return;
      }
      if (password.length < 8) {
        setError('Password must be at least 8 characters long.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
      setError(null);
      setStep(2);
    } else if (step === 2) {
      if (accountType === 'COMMON_USER') {
        handleRegister();
      } else {
        setError(null);
        setStep(3);
      }
    }
  };

  const handlePrevStep = () => {
    setError(null);
    setStep((prev) => (prev - 1) as 1 | 2);
  };

  const handleNeedToggle = (need: string) => {
    if (need === 'DEAF' && selectedNeeds.includes('HARD_OF_HEARING')) {
      setError('Cannot select both Deaf and Hard of Hearing simultaneously.');
      return;
    }
    if (need === 'HARD_OF_HEARING' && selectedNeeds.includes('DEAF')) {
      setError('Cannot select both Deaf and Hard of Hearing simultaneously.');
      return;
    }
    if (need === 'BLIND' && selectedNeeds.includes('LOW_VISION')) {
      setError('Cannot select both Blind and Low Vision simultaneously.');
      return;
    }
    if (need === 'LOW_VISION' && selectedNeeds.includes('BLIND')) {
      setError('Cannot select both Blind and Low Vision simultaneously.');
      return;
    }
    setError(null);
    if (selectedNeeds.includes(need)) {
      setSelectedNeeds(selectedNeeds.filter((n) => n !== need));
    } else {
      setSelectedNeeds([...selectedNeeds, need]);
    }
  };

  const handleRegister = async () => {
    setLoading(true);
    setError(null);
    const payload = {
      name: name.trim(),
      email: email.trim(),
      password,
      phone: phone.trim() || null,
      accountType,
      accessibilityNeeds: accountType === 'ACCESSIBILITY_USER' ? selectedNeeds : [],
      preferredLanguage: accountType === 'ACCESSIBILITY_USER' ? preferredLanguage : null,
      preferredSignLanguage: accountType === 'ACCESSIBILITY_USER' ? preferredSignLanguage : null,
      textSizePreference: 'normal',
      highContrastPreference: false,
      communicationPreference: accountType === 'ACCESSIBILITY_USER' ? communicationPreference : null,
    };
    try {
      await registerUser(payload);
      navigate('/login', { state: { registrationSuccess: true } });
    } catch (err: any) {
      setError(err?.message || 'Registration failed. The email may already be registered.');
      setLoading(false);
    }
  };

  const totalSteps = accountType === 'ACCESSIBILITY_USER' ? 3 : 2;

  return (
    <div className="bg-[#f7fafc] dark:bg-[#030813] min-h-screen flex text-[#181c1e] dark:text-[#f7fafc] font-['Inter',sans-serif]">
      {/* Split Screen Container */}
      <div className="flex w-full min-h-screen">
        
        {/* Left Side: Visual Storytelling & ISL Animation */}
        <div className="hidden lg:flex w-1/2 flex-col justify-between p-12 relative overflow-hidden bg-[#1a202c]">
          {/* Decorative Glow */}
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-[#fe9832]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-[#8dfc75]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col items-start gap-3">
            <Link to="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity focus:outline-none" aria-label="SAMBHAV Home">
              <img
                alt="SAMBHAV Logo"
                className="h-11 w-11 object-contain rounded-full shadow-md"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBTg0HBcA_4tr0W91LDkwqOnVSfSNqNLfncEA1PPwyGzu5JLTBXpp_wsXkZjo9tzLvf4KFNyaXk060fIQSGUovqRqh34LlLcrxxAUa5VojHfDfu4jRQJGk6QxnzQbHigwRz16MDMj2DwoCRu_i77QAzKuRLVJ8e2mLUwC7-UvMJ_JB5sui2SpIRfZM5c9yAP4gD3yTYgJBzlXm_PtIyr70gHi3MkHGC95pbUZ_Mid5Kj_my4OpeXflK15WPybnDecsYaov545CM4kLxeQ"
              />
              <span className="text-2xl font-bold tracking-tight text-white">
                SAM<span className="text-[#fe9832] font-extrabold">BHAV</span>
              </span>
            </Link>

            <h1 className="text-[38px] xl:text-[44px] font-extrabold leading-[48px] tracking-tight text-white mt-4">
              Join Our Community.
            </h1>
            <p className="text-base leading-relaxed text-[#c1c6d7] max-w-md">
              Create your account to start communicating effortlessly with real-time Indian Sign Language interpretation, voice, and text.
            </p>
          </div>

          {/* High-Resolution ISL Gesture Interactive Frame */}
          <div
            className="relative z-10 w-full max-w-md mx-auto my-auto py-2"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <div className="aspect-[16/10] bg-[#111318] rounded-2xl shadow-2xl overflow-hidden relative border border-white/10 group">
              {gestureImages.map((img, idx) => (
                <div
                  key={img.id}
                  className={`absolute inset-0 transition-all duration-700 ease-in-out ${
                    idx === activeImageIndex
                      ? 'opacity-100 scale-100 z-10'
                      : 'opacity-0 scale-105 pointer-events-none z-0'
                  }`}
                >
                  <img
                    className="w-full h-full object-cover object-top"
                    alt={img.title}
                    src={img.src}
                  />
                  <div className="absolute bottom-3 left-3 px-3 py-1.5 bg-black/70 backdrop-blur-md rounded-full text-xs font-bold text-white border border-white/10 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#fe9832] animate-ping" />
                    <span>Sign: <strong className="text-[#fe9832]">{img.title}</strong></span>
                  </div>
                </div>
              ))}
            </div>

            {/* Interactive Hover / Click Gesture Chips */}
            <div className="grid grid-cols-3 gap-2 mt-3.5">
              {gestureImages.map((img, idx) => {
                const isActive = idx === activeImageIndex;
                return (
                  <button
                    key={img.id}
                    type="button"
                    onMouseEnter={() => {
                      setActiveImageIndex(idx);
                      setIsHovered(true);
                    }}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border ${
                      isActive
                        ? 'bg-[#fe9832] text-[#683700] border-[#fe9832] shadow-md scale-105'
                        : 'bg-white/5 hover:bg-white/15 text-[#c1c6d7] hover:text-white border-white/10'
                    }`}
                  >
                    <span>{img.title}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="relative z-10 text-xs text-[#828796] flex items-center justify-between border-t border-white/10 pt-4">
            <span>SAMBHAV ISL AI Platform</span>
            <span>Free & Open Access</span>
          </div>
        </div>

        {/* Right Side: Registration Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-10 md:p-12 bg-[#f7fafc] dark:bg-[#030813] relative overflow-y-auto">
          
          <div className="w-full max-w-lg bg-white dark:bg-[#1a202c] p-6 sm:p-8 rounded-2xl shadow-lg border border-[#e0e3e5] dark:border-[#2d3133]">
            
            {/* Header & Step Indicator */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#fe9832]">
                  Step {step} of {totalSteps}
                </span>
                <span className="text-xs text-[#45474c] dark:text-[#828796]">
                  {step === 1 ? 'Personal Details' : step === 2 ? 'Account Type' : 'Accessibility Preferences'}
                </span>
              </div>
              
              <div className="flex items-center gap-2 mb-4">
                <div className={`flex-1 h-1.5 rounded-full transition-all ${step >= 1 ? 'bg-[#fe9832]' : 'bg-[#e0e3e5] dark:bg-[#2d3133]'}`} />
                <div className={`flex-1 h-1.5 rounded-full transition-all ${step >= 2 ? 'bg-[#fe9832]' : 'bg-[#e0e3e5] dark:bg-[#2d3133]'}`} />
                {accountType === 'ACCESSIBILITY_USER' && (
                  <div className={`flex-1 h-1.5 rounded-full transition-all ${step >= 3 ? 'bg-[#fe9832]' : 'bg-[#e0e3e5] dark:bg-[#2d3133]'}`} />
                )}
              </div>

              <h2 className="text-2xl font-bold text-[#030813] dark:text-white tracking-tight">Create an Account</h2>
              <p className="text-xs text-[#45474c] dark:text-[#828796] mt-1">
                {step === 1 && 'Enter your basic information to get started.'}
                {step === 2 && 'Select how you would like to use SAMBHAV.'}
                {step === 3 && 'Tailor your assistive preferences for optimal communication.'}
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div
                className="p-3.5 mb-5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs font-semibold flex items-center gap-2"
                role="alert"
              >
                <span className="material-symbols-outlined text-[18px]">error</span>
                <span>{error}</span>
              </div>
            )}

            {/* ========================================================= */}
            {/* STEP 1: Basic Information                                 */}
            {/* ========================================================= */}
            {step === 1 && (
              <div className="flex flex-col gap-4 text-xs">
                {/* Full Name */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-[#181c1e] dark:text-white" htmlFor="reg-name">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#45474c] dark:text-[#828796] text-[18px]">
                      person
                    </span>
                    <input
                      id="reg-name"
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Priyanshu Sharma"
                      className="w-full pl-10 pr-4 py-2.5 bg-[#f7fafc] dark:bg-[#030813] border border-[#c6c6cc] dark:border-[#2d3133] rounded-xl text-[#030813] dark:text-white focus:border-[#fe9832] outline-none"
                    />
                  </div>
                </div>

                {/* Email Address */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-[#181c1e] dark:text-white" htmlFor="reg-email">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#45474c] dark:text-[#828796] text-[18px]">
                      mail
                    </span>
                    <input
                      id="reg-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full pl-10 pr-4 py-2.5 bg-[#f7fafc] dark:bg-[#030813] border border-[#c6c6cc] dark:border-[#2d3133] rounded-xl text-[#030813] dark:text-white focus:border-[#fe9832] outline-none"
                    />
                  </div>
                </div>

                {/* Phone (Optional) */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-[#181c1e] dark:text-white" htmlFor="reg-phone">
                    Phone Number <span className="text-xs font-normal text-[#828796]">(Optional)</span>
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#45474c] dark:text-[#828796] text-[18px]">
                      call
                    </span>
                    <input
                      id="reg-phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full pl-10 pr-4 py-2.5 bg-[#f7fafc] dark:bg-[#030813] border border-[#c6c6cc] dark:border-[#2d3133] rounded-xl text-[#030813] dark:text-white focus:border-[#fe9832] outline-none"
                    />
                  </div>
                </div>

                {/* Password Fields Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="font-bold text-[#181c1e] dark:text-white" htmlFor="reg-password">
                      Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        id="reg-password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Min 8 characters"
                        className="w-full px-3.5 py-2.5 bg-[#f7fafc] dark:bg-[#030813] border border-[#c6c6cc] dark:border-[#2d3133] rounded-xl text-[#030813] dark:text-white focus:border-[#fe9832] outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="font-bold text-[#181c1e] dark:text-white" htmlFor="reg-confirm">
                      Confirm Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        id="reg-confirm"
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter password"
                        className="w-full px-3.5 py-2.5 bg-[#f7fafc] dark:bg-[#030813] border border-[#c6c6cc] dark:border-[#2d3133] rounded-xl text-[#030813] dark:text-white focus:border-[#fe9832] outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Show password checkbox */}
                <div className="flex items-center gap-2">
                  <input
                    id="show-pass"
                    type="checkbox"
                    checked={showPassword}
                    onChange={(e) => setShowPassword(e.target.checked)}
                    className="w-4 h-4 rounded text-[#fe9832] focus:ring-[#fe9832] cursor-pointer"
                  />
                  <label htmlFor="show-pass" className="text-xs text-[#45474c] dark:text-[#c1c6d7] cursor-pointer select-none">
                    Show passwords
                  </label>
                </div>

                <button
                  type="button"
                  onClick={handleNextStep}
                  className="mt-2 w-full py-3 bg-[#fe9832] hover:bg-[#e8872b] text-[#683700] font-bold text-xs rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
                >
                  <span>Continue to Account Type</span>
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </button>
              </div>
            )}

            {/* ========================================================= */}
            {/* STEP 2: Account Type Selection                            */}
            {/* ========================================================= */}
            {step === 2 && (
              <div className="flex flex-col gap-4 text-xs">
                <div className="grid grid-cols-1 gap-3">
                  <button
                    type="button"
                    onClick={() => setAccountType('COMMON_USER')}
                    className={`p-4 rounded-xl border-2 text-left transition-all flex items-start gap-3.5 ${
                      accountType === 'COMMON_USER'
                        ? 'border-[#fe9832] bg-[#fe9832]/10 dark:bg-[#fe9832]/15'
                        : 'border-[#e0e3e5] dark:border-[#2d3133] bg-[#f7fafc] dark:bg-[#030813] hover:border-[#fe9832]'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-lg bg-[#fe9832]/20 text-[#fe9832] flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[22px]">person</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-[#030813] dark:text-white">Common User</h3>
                      <p className="text-xs text-[#45474c] dark:text-[#c1c6d7] mt-0.5 leading-relaxed">
                        Standard workspace for vocal/text communication sessions and real-time remote calls.
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAccountType('ACCESSIBILITY_USER')}
                    className={`p-4 rounded-xl border-2 text-left transition-all flex items-start gap-3.5 ${
                      accountType === 'ACCESSIBILITY_USER'
                        ? 'border-[#fe9832] bg-[#fe9832]/10 dark:bg-[#fe9832]/15'
                        : 'border-[#e0e3e5] dark:border-[#2d3133] bg-[#f7fafc] dark:bg-[#030813] hover:border-[#fe9832]'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-lg bg-[#8dfc75]/20 text-[#8dfc75] flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[22px]">accessibility_new</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-[#030813] dark:text-white">Accessibility User</h3>
                      <p className="text-xs text-[#45474c] dark:text-[#c1c6d7] mt-0.5 leading-relaxed">
                        Tailored for Deaf & Hard-of-Hearing individuals with automated 3D ISL avatar rendering and sign learning.
                      </p>
                    </div>
                  </button>
                </div>

                <div className="flex gap-3 mt-2">
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    className="w-1/3 py-3 border border-[#c6c6cc] dark:border-[#2d3133] text-[#181c1e] dark:text-white font-bold text-xs rounded-xl hover:bg-[#f1f4f6] dark:hover:bg-[#2d3133] transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleNextStep}
                    disabled={loading}
                    className="flex-1 py-3 bg-[#fe9832] hover:bg-[#e8872b] text-[#683700] font-bold text-xs rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <span className="material-symbols-outlined text-[18px] animate-spin">sync</span>
                    ) : (
                      <>
                        <span>{accountType === 'COMMON_USER' ? 'Complete Registration' : 'Continue to Preferences'}</span>
                        <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* STEP 3: Accessibility Needs (Only for Accessibility User) */}
            {/* ========================================================= */}
            {step === 3 && (
              <div className="flex flex-col gap-4 text-xs">
                <p className="text-xs text-[#45474c] dark:text-[#c1c6d7]">
                  Select the accessibility features you would like enabled by default:
                </p>

                <div className="grid grid-cols-2 gap-2.5">
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
                        selectedNeeds.includes(item.key) 
                          ? 'border-[#fe9832] bg-[#fe9832]/10 text-[#030813] dark:text-white' 
                          : 'border-[#e0e3e5] dark:border-[#2d3133] bg-[#f7fafc] dark:bg-[#030813] text-[#45474c] dark:text-[#c1c6d7]'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedNeeds.includes(item.key)}
                        onChange={() => handleNeedToggle(item.key)}
                        className="w-4 h-4 rounded text-[#fe9832] focus:ring-[#fe9832] cursor-pointer"
                      />
                      <span className="text-xs font-bold">{item.label}</span>
                    </label>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-3 mt-1">
                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-[#181c1e] dark:text-white">Preferred Sign Language</label>
                    <select
                      value={preferredSignLanguage}
                      onChange={(e) => setPreferredSignLanguage(e.target.value)}
                      className="px-3 py-2 bg-[#f7fafc] dark:bg-[#030813] border border-[#c6c6cc] dark:border-[#2d3133] rounded-xl text-[#030813] dark:text-white font-semibold outline-none"
                    >
                      <option value="ISL">Indian Sign Language (ISL)</option>
                      <option value="ASL">American Sign Language (ASL)</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-[#181c1e] dark:text-white">Primary Input Mode</label>
                    <select
                      value={communicationPreference}
                      onChange={(e) => setCommunicationPreference(e.target.value)}
                      className="px-3 py-2 bg-[#f7fafc] dark:bg-[#030813] border border-[#c6c6cc] dark:border-[#2d3133] rounded-xl text-[#030813] dark:text-white font-semibold outline-none"
                    >
                      <option value="text">Text Input</option>
                      <option value="sign">Sign Gestures</option>
                      <option value="speech">Speech Audio</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 mt-2">
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    className="w-1/3 py-3 border border-[#c6c6cc] dark:border-[#2d3133] text-[#181c1e] dark:text-white font-bold text-xs rounded-xl hover:bg-[#f1f4f6] dark:hover:bg-[#2d3133] transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleRegister}
                    disabled={loading}
                    className="flex-1 py-3 bg-[#fe9832] hover:bg-[#e8872b] text-[#683700] font-bold text-xs rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loading ? (
                      <span className="material-symbols-outlined text-[18px] animate-spin">sync</span>
                    ) : (
                      <>
                        <span>Complete Registration</span>
                        <span className="material-symbols-outlined text-[16px]">check</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Footer Sign In Link */}
            <div className="mt-6 pt-5 border-t border-[#e0e3e5] dark:border-[#2d3133] text-center text-xs text-[#45474c] dark:text-[#828796]">
              Already have an account?{' '}
              <Link to="/login" className="text-[#fe9832] font-bold hover:underline">
                Sign In
              </Link>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};

export default RegisterPage;
