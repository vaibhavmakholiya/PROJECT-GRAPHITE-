import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Phone,
  KeyRound,
  ArrowRight,
  AlertCircle,
  ArrowLeft,
  Shield,
  User,
  CheckCircle2,
  Sparkles,
  MapPin,
  Calendar,
  FileText,
  Building2,
  Camera,
} from 'lucide-react';
import { verhoeffValid, generateVerhoeffCheckDigit } from '@sanchay/core';
import { getRepository } from '../shared/data';
import { AadhaarOcrModal, AadhaarOcrData } from '../components/common/AadhaarOcrModal';

export const LoginView: React.FC = () => {
  const { t } = useTranslation(['public', 'common']);
  const navigate = useNavigate();
  const location = useLocation();
  const repo = getRepository();

  const queryParams = new URLSearchParams(location.search);
  const initialRole = queryParams.get('role') === 'admin' ? 'admin' : 'member';

  const [selectedRoleHint, setSelectedRoleHint] = useState<'member' | 'admin'>(initialRole);
  const [phone, setPhone] = useState(initialRole === 'admin' ? '98765 43210' : '');
  const [step, setStep] = useState<'phone' | 'otp' | 'profile_setup'>('phone');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Profile Setup State
  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('1994-08-12');
  const [gender, setGender] = useState<'FEMALE' | 'MALE' | 'OTHER'>('FEMALE');
  const [address, setAddress] = useState('');
  const [aadhaarInput, setAadhaarInput] = useState('999900001234');
  const [groupCode, setGroupCode] = useState('PRAG24');
  const [showOcrModal, setShowOcrModal] = useState(false);

  const handleOcrScanComplete = (data: AadhaarOcrData) => {
    if (data.name) setFullName(data.name);
    if (data.dob) setDob(data.dob);
    if (data.gender) setGender(data.gender);
    if (data.address) setAddress(data.address);
    if (data.aadhaarNumber) setAadhaarInput(data.aadhaarNumber);
    if (!phone) setPhone('98000 00014');

    // If currently on phone step in member tab, transition directly to profile setup
    if (step === 'phone') {
      setStep('profile_setup');
    }
  };

  // Check if session is already active or needs profile setup
  useEffect(() => {
    async function checkSession() {
      const requestedStep = queryParams.get('step');
      if (requestedStep === 'profile_setup') {
        setStep('profile_setup');
        return;
      }

      try {
        const claims = await repo.getUserClaims();
        if (claims.authUid) {
          if (selectedRoleHint === 'admin' || claims.role === 'admin' || claims.roles?.includes('admin')) {
            navigate('/admin', { replace: true });
            return;
          }
          const member = await repo.getCurrentMember();
          if (member && member.name && member.name !== 'Member' && member.address && member.status === 'active') {
            if (member.role === 'admin') {
              navigate('/admin', { replace: true });
            } else {
              navigate('/app', { replace: true });
            }
          } else {
            setStep('profile_setup');
            if (member?.phone) {
              setPhone(member.phone);
            }
          }
        }
      } catch (_) {
        // Fallback to standard login
      }
    }
    checkSession();
  }, []);

  const handleSelectRoleTab = (role: 'admin' | 'member') => {
    setSelectedRoleHint(role);
    setError(null);
    setStep('phone');
    setPhone(role === 'admin' ? '98765 43210' : '');
    setOtp('');
  };

  const effectivePhone = phone.trim() || (selectedRoleHint === 'admin' ? '98765 43210' : '');
  const cleanPhone = effectivePhone.replace(/\s+/g, '');

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cleanPhone.replace(/\D/g, '').length < 10) {
      setError(t('public:login.invalidPhone', 'Please enter a valid 10-digit mobile number.'));
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await repo.sendPhoneOtp(cleanPhone);
      setStep('otp');
      const emuCode =
        (window as any).__lastEmulatorOtp ||
        sessionStorage.getItem('sanchay_last_emulator_otp') ||
        '123456';
      setOtp(emuCode);
    } catch (err: any) {
      setError(err?.message || 'Failed to send verification code. Please check the mobile number.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await repo.loginWithPhone(cleanPhone, otp, selectedRoleHint);
      const claims = await repo.getUserClaims();

      if (selectedRoleHint === 'admin' || claims.role === 'admin' || claims.roles?.includes('admin')) {
        navigate('/admin', { replace: true });
        return;
      }

      // Member flow: Check whether this member has completed their profile in Firestore
      const member = await repo.getCurrentMember();
      if (member && member.name && member.name !== 'Member' && member.address && member.status === 'active') {
        const from = (location.state as any)?.from;
        if (from && from !== '/login') {
          navigate(from, { replace: true });
        } else {
          navigate('/app', { replace: true });
        }
      } else {
        // Transition directly to profile setup
        setStep('profile_setup');
        if (member?.name && member.name !== 'Member') setFullName(member.name);
        if (member?.address) setAddress(member.address);
        if (member?.dob) setDob(member.dob);
      }
    } catch (err: any) {
      setError(err?.message || t('public:login.invalidOtp', 'Invalid verification code. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  // Calculate age from DOB
  const calculatedAge = dob ? (() => {
    const parts = dob.split('-');
    if (parts.length === 3) {
      const birth = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      const now = new Date();
      let age = now.getFullYear() - birth.getFullYear();
      if (now.getMonth() < birth.getMonth() || (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())) {
        age--;
      }
      return age >= 0 ? age : null;
    }
    return null;
  })() : null;

  // Real-time Aadhaar validation status
  const cleanAadhaar = aadhaarInput.replace(/\D/g, '');
  const isAadhaarFull12 = cleanAadhaar.length === 12;
  const isAadhaarChecksumValid = isAadhaarFull12 && verhoeffValid(cleanAadhaar);

  const handleFixAadhaarChecksum = () => {
    const prefix = (cleanAadhaar.length >= 11 ? cleanAadhaar.slice(0, 11) : '99990000123');
    const check = generateVerhoeffCheckDigit(prefix);
    setAadhaarInput(`${prefix}${check}`);
  };

  const handleQuickFillDemo = () => {
    setFullName('Meena Kumari');
    setDob('1994-08-12');
    setGender('FEMALE');
    setAddress('Ward 4, Pragati Nagar, Rampur Gram Panchayat');
    const prefix = '99990000123';
    const check = generateVerhoeffCheckDigit(prefix);
    setAadhaarInput(`${prefix}${check}`);
    setGroupCode('PRAG24');
    if (!phone) setPhone('98000 00014');
    setError(null);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setError('Please enter your full name as per official records.');
      return;
    }
    if (!address.trim()) {
      setError('Please enter your residential address or village/ward.');
      return;
    }

    let validAadhaar12 = '';
    let last4 = '1234';

    if (cleanAadhaar.length === 12) {
      if (!verhoeffValid(cleanAadhaar)) {
        setError('Aadhaar number checksum is invalid. Click "Fix Checksum" or verify the 12 digits.');
        return;
      }
      validAadhaar12 = cleanAadhaar;
      last4 = cleanAadhaar.slice(-4);
    } else if (cleanAadhaar.length === 4) {
      const prefix = `9999000${cleanAadhaar.slice(0, 3)}`;
      const check = generateVerhoeffCheckDigit(prefix);
      validAadhaar12 = `${prefix}${check}`;
      last4 = cleanAadhaar;
    } else {
      const prefix = '99990000123';
      const check = generateVerhoeffCheckDigit(prefix);
      validAadhaar12 = `${prefix}${check}`;
      last4 = validAadhaar12.slice(-4);
    }

    setError(null);
    setLoading(true);
    try {
      const targetPhone = phone.trim() || cleanPhone || (repo as any).phone || '98000 00014';
      const formattedPhone = targetPhone.startsWith('+')
        ? targetPhone
        : `+91${targetPhone.replace(/\D/g, '').slice(-10)}`;

      await repo.registerMember({
        name: fullName.trim(),
        phone: formattedPhone,
        dob: dob || '1994-08-12',
        address: address.trim(),
        gender,
        age: calculatedAge,
        aadhaarLast4: last4,
        aadhaarNumber: validAadhaar12,
        groupCode: groupCode.trim().toUpperCase() || 'PRAG24',
      });

      // Strict privacy: clear raw Aadhaar from memory
      setAadhaarInput('');

      // Navigate straight to Member Passbook
      navigate('/app', { replace: true });
    } catch (err: any) {
      setError(err?.message || 'Failed to save member profile. Please check the information and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-6 sm:my-10 p-6 sm:p-8 bg-white rounded-3xl border border-blue-200 shadow-card animate-fade-in">
      {/* Invisible reCAPTCHA container for Firebase Phone Auth */}
      <div id="recaptcha-container"></div>

      <div className="space-y-6">
        {/* Back Link to Landing */}
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="text-xs text-slate-600 hover:text-blue-600 flex items-center gap-1 font-medium transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
          </Link>
          <span className="text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
            Sanchay Auth
          </span>
        </div>

        {/* Role Portal Selection Tabs (Only on Phone & OTP steps) */}
        {step !== 'profile_setup' && (
          <div className="grid grid-cols-2 p-1 rounded-2xl bg-blue-50 border border-blue-200">
            <button
              type="button"
              onClick={() => handleSelectRoleTab('admin')}
              className={`py-2.5 px-3 rounded-xl text-xs font-heading font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                selectedRoleHint === 'admin'
                  ? 'bg-navy-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-navy-900'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Admin Portal</span>
            </button>
            <button
              type="button"
              onClick={() => handleSelectRoleTab('member')}
              className={`py-2.5 px-3 rounded-xl text-xs font-heading font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                selectedRoleHint === 'member'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-navy-900'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Member Passbook</span>
            </button>
          </div>
        )}

        {/* Step Header */}
        <div>
          <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mb-3 shadow-subtle">
            {step === 'phone' ? (
              selectedRoleHint === 'admin' ? <Shield className="w-6 h-6 text-navy-900" /> : <Phone className="w-6 h-6" />
            ) : step === 'otp' ? (
              <KeyRound className="w-6 h-6" />
            ) : (
              <Sparkles className="w-6 h-6 text-blue-600" />
            )}
          </div>

          <h1 className="font-heading font-extrabold text-2xl text-navy-900 tracking-tight mb-1">
            {step === 'phone'
              ? selectedRoleHint === 'admin'
                ? 'Admin Authorization'
                : 'Member Sign In'
              : step === 'otp'
              ? t('public:login.otpTitle', 'Enter Verification Code')
              : 'Setup Member Profile'}
          </h1>
          <p className="text-xs text-slate-600 font-medium">
            {step === 'phone'
              ? selectedRoleHint === 'admin'
                ? 'Verify administrator credentials to unlock the Sanchay Admin Dashboard.'
                : 'Sign in with your registered SHG member mobile number.'
              : step === 'otp'
              ? `Enter the 6-digit verification code sent to +91 ${cleanPhone}.`
              : 'Complete your profile details to activate your digital savings passbook.'}
          </p>
        </div>

        {/* Progress Pills for Member Setup */}
        {step === 'profile_setup' && (
          <div className="flex items-center justify-between p-3 rounded-2xl bg-blue-50 border border-blue-200 text-xs">
            <div className="flex items-center gap-1.5 text-blue-700 font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>1. Mobile Verified</span>
            </div>
            <div className="text-slate-400 font-bold">→</div>
            <div className="flex items-center gap-1.5 text-blue-800 font-extrabold">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
              <span>2. Profile Setup</span>
            </div>
            <div className="text-slate-400 font-bold">→</div>
            <div className="text-slate-400 font-medium">3. Passbook</div>
          </div>
        )}

        {error && (
          <div className="p-3.5 rounded-2xl bg-status-error-bg border border-status-error/30 text-status-error text-xs flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* STEP 1: PHONE */}
        {step === 'phone' && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            {/* Member On-Device OCR Scanner Quick Entry */}
            {selectedRoleHint === 'member' && (
              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-blue-50 via-indigo-50/50 to-blue-50 border border-blue-200 shadow-xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                      <Camera className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-xs font-heading font-bold text-navy-900">
                        Scan Aadhaar Card (On-Device OCR)
                      </h2>
                      <p className="text-[10px] text-slate-500 font-medium">
                        Instant 100% private AI scanning • Auto-fills your details
                      </p>
                    </div>
                  </div>
                  <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Offline AI
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setShowOcrModal(true)}
                    className="py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-heading font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Scan Card (OCR)</span>
                  </button>
                  <Link
                    to="/register"
                    className="py-2.5 px-3 rounded-xl bg-white hover:bg-blue-50 text-blue-700 border border-blue-300 font-heading font-bold text-xs flex items-center justify-center gap-1 shadow-xs transition text-center"
                  >
                    <span>Register with OCR →</span>
                  </Link>
                </div>
              </div>
            )}

            {selectedRoleHint === 'member' && (
              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-blue-100"></div>
                <span className="flex-shrink mx-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Or Sign In with Mobile
                </span>
                <div className="flex-grow border-t border-blue-100"></div>
              </div>
            )}

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-semibold text-navy-900">
                  {selectedRoleHint === 'admin' ? 'Administrator Mobile Number' : 'Mobile Number'}
                </label>
                {selectedRoleHint === 'admin' ? (
                  <button
                    type="button"
                    onClick={() => setPhone('98765 43210')}
                    className="text-[11px] text-blue-600 hover:underline font-semibold cursor-pointer"
                  >
                    Use Admin: 98765 43210
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setPhone('98000 00014')}
                    className="text-[11px] text-blue-600 hover:underline font-semibold cursor-pointer"
                  >
                    Use Test Member: 98000 00014
                  </button>
                )}
              </div>
              <div className="flex items-center rounded-2xl border border-blue-200 bg-white overflow-hidden focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-200 shadow-xs transition-all">
                <div className="flex items-center gap-1.5 px-3.5 py-3 bg-blue-50 border-r border-blue-200 text-slate-700 font-bold text-xs select-none shrink-0">
                  <span className="text-sm">🇮🇳</span>
                  <span>+91</span>
                </div>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={selectedRoleHint === 'admin' ? '98765 43210' : '98000 00014'}
                  maxLength={13}
                  className="w-full px-3.5 py-3 text-sm text-navy-900 placeholder:text-slate-400 outline-none font-medium"
                  autoFocus
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3.5 px-4 rounded-2xl font-heading font-bold text-xs flex items-center justify-center gap-2 shadow-subtle hover:shadow-card transition-all cursor-pointer ${
                selectedRoleHint === 'admin'
                  ? 'bg-navy-900 hover:bg-navy-800 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              <span>{loading ? 'Sending Code...' : selectedRoleHint === 'admin' ? 'Send Authorization Code' : 'Send Verification Code'}</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </button>
          </form>
        )}

        {/* STEP 2: OTP */}
        {step === 'otp' && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            {import.meta.env.VITE_USE_EMULATOR === 'true' && (
              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1">
                <p className="font-bold flex items-center justify-between">
                  <span>🛠️ Auth Emulator Active</span>
                  <button
                    type="button"
                    onClick={() => {
                      const code =
                        (window as any).__lastEmulatorOtp ||
                        sessionStorage.getItem('sanchay_last_emulator_otp') ||
                        '123456';
                      setOtp(code);
                    }}
                    className="text-blue-700 hover:underline font-bold text-[11px] cursor-pointer"
                  >
                    Auto-fill Code
                  </button>
                </p>
                <p className="text-[11px] text-amber-800">
                  Verification OTP:{' '}
                  <strong className="text-navy-900 bg-amber-100 px-1 py-0.5 rounded font-mono">
                    {(window as any).__lastEmulatorOtp ||
                      sessionStorage.getItem('sanchay_last_emulator_otp') ||
                      '123456'}
                  </strong>
                </p>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-navy-900 mb-1.5">
                6-Digit Verification Code
              </label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                maxLength={6}
                placeholder="------"
                className="w-full tracking-[0.35em] text-center font-mono font-bold text-lg px-4 py-3 rounded-2xl border border-blue-200 bg-white text-navy-900 placeholder:text-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-200 outline-none shadow-xs transition-all"
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={loading || otp.length < 4}
              className={`w-full py-3.5 px-4 rounded-2xl font-heading font-bold text-xs flex items-center justify-center gap-2 shadow-subtle hover:shadow-card transition-all cursor-pointer ${
                selectedRoleHint === 'admin'
                  ? 'bg-navy-900 hover:bg-navy-800 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              <span>
                {loading
                  ? t('common:loading', 'Verifying...')
                  : selectedRoleHint === 'admin'
                  ? 'Authorize & Open Admin Dashboard →'
                  : 'Verify & Continue →'}
              </span>
            </button>

            <div className="flex items-center justify-between text-xs pt-1">
              <button
                type="button"
                onClick={() => setStep('phone')}
                className="text-slate-500 hover:text-navy-900 font-medium cursor-pointer"
              >
                Change mobile number
              </button>
              <button
                type="button"
                onClick={handleSendOtp}
                className="text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
              >
                Resend code
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: PROFILE SETUP */}
        {step === 'profile_setup' && (
          <form onSubmit={handleSaveProfile} className="space-y-4">
            {/* Quick Fill & OCR Scan Option */}
            <div className="p-3 rounded-2xl bg-blue-50 border border-blue-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div>
                <span className="text-xs font-semibold text-blue-900 block">Fast Profile Completion</span>
                <span className="text-[10px] text-blue-700 block">Scan Aadhaar card or use sample demo</span>
              </div>
              <div className="flex items-center gap-1.5 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setShowOcrModal(true)}
                  className="flex-1 sm:flex-initial text-xs bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded-xl shadow-xs transition cursor-pointer flex items-center justify-center gap-1"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Scan Card (OCR)</span>
                </button>
                <button
                  type="button"
                  onClick={handleQuickFillDemo}
                  className="flex-1 sm:flex-initial text-xs bg-white text-blue-700 border border-blue-300 hover:bg-blue-100 font-bold px-3 py-1.5 rounded-xl shadow-xs transition cursor-pointer"
                >
                  ⚡ Quick Fill
                </button>
              </div>
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-navy-900 mb-1.5">
                Full Name (as per Official ID) *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Meena Kumari"
                  required
                  className="w-full px-3.5 py-3 rounded-2xl border border-blue-200 bg-white text-sm text-navy-900 placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-200 outline-none shadow-xs font-medium"
                />
              </div>
            </div>

            {/* Date of Birth & Gender Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-navy-900 mb-1.5 flex items-center justify-between">
                  <span>Date of Birth *</span>
                  {calculatedAge !== null && (
                    <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded">
                      {calculatedAge} yrs
                    </span>
                  )}
                </label>
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 rounded-2xl border border-blue-200 bg-white text-xs text-navy-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-200 outline-none shadow-xs font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-navy-900 mb-1.5">Gender *</label>
                <div className="grid grid-cols-3 gap-1">
                  {(['FEMALE', 'MALE', 'OTHER'] as const).map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setGender(g)}
                      className={`py-2 px-1 rounded-xl text-[11px] font-bold cursor-pointer transition text-center ${
                        gender === g
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {g === 'FEMALE' ? 'Female' : g === 'MALE' ? 'Male' : 'Other'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Mobile Number for SMS alerts & passbook access */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-semibold text-navy-900">
                  Mobile Number (Linked to Passbook) *
                </label>
                <span className="text-[10px] text-blue-600 font-medium">For SMS alerts & sign-in</span>
              </div>
              <div className="flex items-center rounded-2xl border border-blue-200 bg-white overflow-hidden focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-200 shadow-xs transition-all">
                <div className="flex items-center gap-1.5 px-3.5 py-3 bg-blue-50 border-r border-blue-200 text-slate-700 font-bold text-xs select-none shrink-0">
                  <span className="text-sm">🇮🇳</span>
                  <span>+91</span>
                </div>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="98000 00014"
                  maxLength={13}
                  className="w-full px-3.5 py-3 text-sm text-navy-900 placeholder:text-slate-400 outline-none font-medium"
                  required
                />
              </div>
            </div>

            {/* Residential Address */}
            <div>
              <label className="block text-xs font-semibold text-navy-900 mb-1.5">
                Residential Address (Village / Ward) *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Ward 4, Pragati Nagar, Rampur Panchayat"
                  required
                  className="w-full px-3.5 py-3 rounded-2xl border border-blue-200 bg-white text-sm text-navy-900 placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-200 outline-none shadow-xs font-medium"
                />
              </div>
            </div>

            {/* Aadhaar Input with Verhoeff Checksum Check */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-navy-900">
                  Aadhaar Number (12 Digits) *
                </label>
                {isAadhaarFull12 ? (
                  isAadhaarChecksumValid ? (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Checksum Valid
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleFixAadhaarChecksum}
                      className="text-[10px] font-bold text-status-error bg-red-50 border border-red-200 hover:bg-red-100 px-2 py-0.5 rounded-full transition cursor-pointer"
                    >
                      Fix Checksum ↺
                    </button>
                  )
                ) : (
                  <span className="text-[10px] text-slate-500 font-medium">
                    {cleanAadhaar.length}/12 digits
                  </span>
                )}
              </div>
              <input
                type="text"
                value={aadhaarInput}
                onChange={(e) => setAadhaarInput(e.target.value)}
                maxLength={14}
                placeholder="999900001234"
                className={`w-full px-3.5 py-3 rounded-2xl border bg-white font-mono text-sm tracking-wider outline-none shadow-xs transition-all ${
                  isAadhaarFull12 && isAadhaarChecksumValid
                    ? 'border-emerald-500 text-emerald-900 focus:ring-2 focus:ring-emerald-200'
                    : isAadhaarFull12 && !isAadhaarChecksumValid
                    ? 'border-red-400 text-red-900 focus:ring-2 focus:ring-red-200'
                    : 'border-blue-200 text-navy-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-200'
                }`}
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Zero-surveillance: Only the last 4 digits (•••• {cleanAadhaar.slice(-4) || '1234'}) are stored.
              </p>
            </div>

            {/* Savings Group Code */}
            <div>
              <label className="block text-xs font-semibold text-navy-900 mb-1.5">
                Savings Group Code
              </label>
              <div className="flex items-center gap-2 p-2.5 rounded-2xl border border-blue-200 bg-blue-50/60">
                <Building2 className="w-4 h-4 text-blue-600 shrink-0 ml-1" />
                <input
                  type="text"
                  value={groupCode}
                  onChange={(e) => setGroupCode(e.target.value)}
                  className="bg-transparent font-bold text-xs text-navy-900 outline-none uppercase w-20"
                />
                <span className="text-xs text-slate-600 font-medium border-l border-blue-200 pl-2">
                  Pragati Mahila Bachat Gat
                </span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-2xl font-heading font-bold text-xs flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-subtle hover:shadow-card transition-all cursor-pointer mt-2"
            >
              <span>{loading ? 'Saving Profile...' : 'Complete Profile & Open Passbook →'}</span>
            </button>
          </form>
        )}

        {/* Footer info */}
        {step !== 'profile_setup' && (
          <div className="pt-4 border-t border-blue-100 text-center text-xs text-slate-600">
            {selectedRoleHint === 'member' ? (
              <div>
                <span>New SHG member without an account? </span>
                <Link
                  to="/register"
                  className="font-bold text-blue-600 hover:text-blue-700 underline cursor-pointer"
                >
                  Register with Aadhaar OCR Scanner →
                </Link>
              </div>
            ) : (
              <div>
                <span>Looking for Member Passbook? </span>
                <button
                  type="button"
                  onClick={() => handleSelectRoleTab('member')}
                  className="font-bold text-blue-600 hover:text-blue-700 underline cursor-pointer"
                >
                  Switch to Member Sign In →
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* On-Device Aadhaar OCR Scanner Modal */}
      <AadhaarOcrModal
        isOpen={showOcrModal}
        onClose={() => setShowOcrModal(false)}
        onScanComplete={handleOcrScanComplete}
      />
    </div>
  );
};

export default LoginView;
