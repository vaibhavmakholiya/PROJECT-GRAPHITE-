import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Phone, KeyRound, ArrowRight, Sparkles, AlertCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export const LoginView: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login } = useAuth();

  const [phone, setPhone] = useState('98000 00014'); // Default pre-filled demo member Meena Kumari
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const cleanPhone = phone.replace(/\s+/g, '');

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (cleanPhone.length < 10) {
      setError(t('auth.invalidPhone', 'Please enter a valid 10-digit mobile number'));
      return;
    }
    setError(null);
    setStep('otp');
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(cleanPhone, otp);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err?.message || t('auth.invalidOtp', 'Invalid OTP. Use 123456 for testing.'));
    } finally {
      setLoading(false);
    }
  };

  const fillTestOtp = () => {
    setOtp('123456');
    setError(null);
  };

  return (
    <div className="max-w-md mx-auto my-6 sm:my-10 p-6 sm:p-8 bg-white rounded-3xl border border-blue-200 shadow-card animate-fade-in">
      <div className="space-y-6">
        {/* Back Link to Landing */}
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="text-xs text-slate-600 hover:text-blue-600 flex items-center gap-1 font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
          </Link>
          <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-blue-100 text-blue-600 border border-blue-200">
            Member Portal
          </span>
        </div>

        <div>
          {/* Header Icon */}
          <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mb-3 shadow-subtle">
            {step === 'phone' ? <Phone className="w-6 h-6" /> : <KeyRound className="w-6 h-6" />}
          </div>

          <h1 className="font-heading font-extrabold text-2xl text-navy-900 tracking-tight mb-1">
            {step === 'phone'
              ? t('auth.loginTitle', 'Member Login')
              : t('auth.otpTitle', 'Enter Verification Code')}
          </h1>
          <p className="text-xs text-slate-600 font-medium">
            {step === 'phone'
              ? t('auth.loginSubtitle', 'Enter your registered mobile number')
              : t('auth.otpSubtitle', 'Sent to {{phone}}', { phone })}
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl bg-status-error-bg border border-status-error/30 text-status-error text-xs flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {step === 'phone' ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-navy-900 mb-1.5">
                {t('auth.phoneLabel', 'Mobile Number')}
              </label>
              <div className="flex items-center rounded-2xl border border-blue-200 bg-white overflow-hidden focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-200 shadow-xs transition-all">
                <div className="flex items-center gap-1.5 px-3.5 py-3 bg-blue-50 border-r border-blue-200 text-slate-700 font-bold text-xs select-none shrink-0">
                  <span className="text-sm">🇮🇳</span>
                  <span>+91</span>
                </div>
                <input
                  type="tel"
                  maxLength={15}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={t('auth.phonePlaceholder', '98000 00014')}
                  className="w-full text-sm font-semibold px-4 py-3 bg-transparent text-navy-900 outline-none placeholder:text-slate-400"
                  autoFocus
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full min-h-[48px] py-3.5 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-heading font-bold text-xs flex items-center justify-center gap-2 shadow-subtle hover:shadow-card transition-all cursor-pointer focus:ring-3 focus:ring-blue-300"
            >
              <span>{t('auth.sendOtp', 'Get OTP Code')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-semibold text-navy-900">
                  {t('auth.otpPlaceholder', '6-digit code')}
                </label>
                <button
                  type="button"
                  onClick={fillTestOtp}
                  className="text-[11px] text-blue-600 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>{t('auth.fillDemoCode', 'Fill Test OTP (123456)')}</span>
                </button>
              </div>

              <input
                type="text"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                className="w-full text-center font-mono font-extrabold text-2xl tracking-[0.5em] py-3 rounded-2xl border border-blue-200 bg-white text-navy-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className={`w-full min-h-[48px] py-3.5 px-4 rounded-2xl font-heading font-bold text-xs flex items-center justify-center gap-2 shadow-subtle transition-all cursor-pointer focus:ring-3 focus:ring-blue-300 ${
                otp.length === 6 && !loading
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-card'
                  : 'bg-blue-100 text-slate-600 cursor-not-allowed'
              }`}
            >
              <span>{loading ? 'Verifying...' : t('auth.verifyOtp', 'Verify & Login')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="flex items-center justify-between text-xs pt-1">
              <button
                type="button"
                onClick={() => setStep('phone')}
                className="text-slate-600 hover:text-navy-900 font-medium cursor-pointer"
              >
                {t('auth.changeNumber', 'Change Number')}
              </button>
              <button
                type="button"
                onClick={() => alert('New test OTP: 123456')}
                className="text-blue-600 font-semibold hover:underline cursor-pointer"
              >
                {t('auth.resendOtp', 'Resend Code')}
              </button>
            </div>
          </form>
        )}

        <div className="pt-4 border-t border-blue-200 text-center">
          <p className="text-xs text-slate-600 font-medium">
            New member to Sanchay?{' '}
            <Link to="/register" className="text-blue-600 font-bold hover:underline">
              Register with Aadhaar
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginView;
