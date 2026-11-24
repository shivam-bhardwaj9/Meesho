import React, { useEffect, useRef, useState } from 'react';
import { Eye, EyeOff, Lock, ShieldCheck, X } from 'lucide-react';
import { AuthUser } from '../types/meesho';

interface AuthPageProps {
  source?: 'profile' | 'cart' | 'supplier';
  onBack: () => void;
  onLoginSuccess: (token: string, user: AuthUser) => void;
}

type AuthStep = 'identifier' | 'otp' | 'admin_claim' | 'admin_password';

export const AuthPage: React.FC<AuthPageProps> = ({
  source = 'profile',
  onBack,
  onLoginSuccess,
}) => {
  const [authType, setAuthType] = useState<'phone' | 'email'>('phone');
  const [identifier, setIdentifier] = useState('');
  const [step, setStep] = useState<AuthStep>('identifier');
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [previewOtp, setPreviewOtp] = useState<string | null>(null);
  const [smsDelivered, setSmsDelivered] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(0);
  const [adminPassword, setAdminPassword] = useState('');
  const [confirmAdminPassword, setConfirmAdminPassword] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (step !== 'otp' || resendSeconds <= 0) return;
    const timer = window.setInterval(() => {
      setResendSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [step, resendSeconds]);

  const requestOtpOrAdmin = async () => {
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authType, identifier }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Could not initiate sign-in.');
        return;
      }

      setIdentifier(data.identifier);

      if (data.requiresAdminAuth) {
        setAdminPassword('');
        setConfirmAdminPassword('');
        setSmsDelivered(false);
        setPreviewOtp(null);
        setStep(data.isAdminClaimed ? 'admin_password' : 'admin_claim');
      } else {
        setSmsDelivered(Boolean(data.smsDelivered));
        setPreviewOtp(data.previewOtp || null);
        setOtpDigits(['', '', '', '', '', '']);
        setResendSeconds(59);
        setStep('otp');
        window.setTimeout(() => otpRefs.current[0]?.focus(), 40);
      }
    } catch {
      setError('Network error while connecting to server.');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    await requestOtpOrAdmin();
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullOtp = otpDigits.join('');
    if (fullOtp.length < 6) {
      setError('Please enter the 6-digit OTP.');
      return;
    }
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authType,
          identifier,
          otp: fullOtp,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'OTP verification failed.');
        return;
      }
      onLoginSuccess(data.token, data.user);
    } catch {
      setError('Network error verifying OTP.');
    } finally {
      setLoading(false);
    }
  };

  const fillOtpDigits = (digits: string) => {
    const clean = digits.replace(/\D/g, '').slice(0, 6);
    setOtpDigits(Array.from({ length: 6 }, (_, i) => clean[i] || ''));
    const focusIdx = Math.min(5, Math.max(0, clean.length - 1));
    otpRefs.current[focusIdx]?.focus();
  };

  const handleOtpSlotChange = (index: number, rawValue: string) => {
    const cleaned = rawValue.replace(/\D/g, '');
    if (!cleaned) {
      setOtpDigits((prev) => {
        const next = [...prev];
        next[index] = '';
        return next;
      });
      return;
    }

    if (cleaned.length > 1) {
      fillOtpDigits(cleaned);
      return;
    }

    setOtpDigits((prev) => {
      const next = [...prev];
      next[index] = cleaned;
      return next;
    });
    if (index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpSlotKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      if (otpDigits[index]) {
        setOtpDigits((prev) => {
          const next = [...prev];
          next[index] = '';
          return next;
        });
      } else if (index > 0) {
        setOtpDigits((prev) => {
          const next = [...prev];
          next[index - 1] = '';
          return next;
        });
        otpRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      otpRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    e.preventDefault();
    fillOtpDigits(pasted);
  };

  const handleClaimAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (adminPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (adminPassword !== confirmAdminPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/claim-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authType,
          identifier,
          password: adminPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Admin setup failed.');
        return;
      }
      onLoginSuccess(data.token, data.user);
    } catch {
      setError('Network error during admin setup.');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authType,
          identifier,
          password: adminPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Incorrect admin password.');
        return;
      }
      onLoginSuccess(data.token, data.user);
    } catch {
      setError('Network error during admin sign-in.');
    } finally {
      setLoading(false);
    }
  };

  const headingText =
    step === 'identifier'
      ? source === 'cart'
        ? 'Sign Up to continue shopping'
        : source === 'supplier'
        ? 'Sign Up to publish products'
        : 'Sign Up to view your profile'
      : step === 'otp'
      ? `Enter OTP sent to ${identifier}`
      : step === 'admin_claim'
      ? 'Activate Admin Panel Access'
      : 'Admin Account Sign In';

  const resetToIdentifier = () => {
    setStep('identifier');
    setError(null);
    setOtpDigits(['', '', '', '', '', '']);
    setAdminPassword('');
    setConfirmAdminPassword('');
  };

  return (
    <div
      className="min-h-[calc(100vh-72px)] w-full flex flex-col items-center justify-start pt-8 sm:pt-10 pb-12 px-4"
      style={{
        background: 'linear-gradient(180deg, rgb(253, 233, 242) 0%, rgb(253, 240, 232) 100%)',
      }}
    >
      {/* Mobile-only compact back bar */}
      <div className="md:hidden w-full max-w-[433px] flex items-center justify-between mb-3 px-1">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#616173] hover:text-[#353543] cursor-pointer"
        >
          <X className="w-4 h-4" />
          <span>Back to Meesho</span>
        </button>
      </div>

      {/* Centered Meesho Auth Card (433px) */}
      <div className="w-full max-w-[433px] bg-white rounded-lg overflow-hidden shadow-[0_4px_24px_rgba(53,53,67,0.06)] flex flex-col">
        {/* Top Promo Banner */}
        <div className="w-full h-[200px] sm:h-[214px] bg-[#A72185] relative overflow-hidden">
          <img
            src="/assets/aistudio/1661417516766_3ccb5842.webp"
            alt="Great Quality Lowest prices"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-center"
          />
        </div>

        {/* Card Form Body */}
        <div className="px-8 sm:px-12 pt-9 pb-6 flex flex-col justify-between min-h-[420px]">
          <div>
            <h1
              className={`text-[19px] sm:text-[20px] font-bold text-[#353543] ${
                step !== 'identifier' ? 'mb-1.5' : 'mb-7'
              }`}
            >
              {headingText}
            </h1>

            {step !== 'identifier' && (
              <button
                type="button"
                onClick={resetToIdentifier}
                className="text-[13px] font-bold text-[#9F2089] tracking-wide uppercase hover:underline mb-8 cursor-pointer"
              >
                CHANGE {authType === 'phone' ? 'NUMBER' : 'EMAIL'}
              </button>
            )}

            {error && (
              <div className="mb-4 p-3 rounded-md bg-red-50 border border-red-200 text-xs font-medium text-red-700">
                {error}
              </div>
            )}

            {/* STEP 1: Country + Phone Number (or Email toggle) */}
            {step === 'identifier' && (
              <form onSubmit={handleRequestOtp} className="space-y-7">
                {authType === 'phone' ? (
                  <div className="flex items-end gap-3.5">
                    <div className="shrink-0 w-[68px] pb-2 border-b border-[#D5D5DF]">
                      <span className="block text-[12px] text-[#8B8BA3] mb-1.5">
                        Country
                      </span>
                      <span className="inline-flex items-baseline gap-1 text-[#353543] whitespace-nowrap">
                        <span className="text-[11px] font-bold tracking-tight">IN</span>
                        <span className="text-[15px] font-bold">+91</span>
                      </span>
                    </div>

                    <div className="flex-1 pb-2 border-b border-[#D5D5DF] focus-within:border-[#9F2089] transition-colors">
                      <label htmlFor="meesho-auth-phone" className="sr-only">
                        Phone Number
                      </label>
                      <input
                        id="meesho-auth-phone"
                        type="tel"
                        required
                        autoComplete="off"
                        value={identifier}
                        onChange={(e) => {
                          let digits = e.target.value.replace(/\D/g, '');
                          if (digits.length === 12 && digits.startsWith('91')) {
                            digits = digits.slice(2);
                          } else if (digits.length === 11 && digits.startsWith('0')) {
                            digits = digits.slice(1);
                          }
                          setIdentifier(digits.slice(0, 10));
                        }}
                        placeholder="Phone Number"
                        className="w-full text-[15px] font-medium text-[#353543] placeholder:text-[#8B8BA3] focus:outline-none bg-transparent tabular-nums"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="pb-2 border-b border-[#D5D5DF] focus-within:border-[#9F2089] transition-colors">
                    <label
                      htmlFor="meesho-auth-email"
                      className="block text-[12px] text-[#8B8BA3] mb-1"
                    >
                      Email Address
                    </label>
                    <input
                      id="meesho-auth-email"
                      type="email"
                      required
                      autoComplete="email"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full text-[15px] font-medium text-[#353543] placeholder:text-[#8B8BA3] focus:outline-none bg-transparent"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 bg-[#9F2089] hover:bg-[#831871] disabled:opacity-60 text-white font-semibold text-[15px] rounded-[4px] transition-colors cursor-pointer"
                >
                  {loading ? 'Please wait...' : 'Continue'}
                </button>

                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthType((prev) => (prev === 'phone' ? 'email' : 'phone'));
                      setIdentifier('');
                      setError(null);
                    }}
                    className="text-xs font-semibold text-[#9F2089] hover:underline cursor-pointer"
                  >
                    {authType === 'phone'
                      ? 'Continue with Email instead'
                      : 'Continue with Phone Number (+91) instead'}
                  </button>
                </div>
              </form>
            )}

            {/* STEP 2A: Shopper OTP Verification (6 separate underlined slots matching Meesho) */}
            {step === 'otp' && (
              <form onSubmit={handleVerifyOtp} className="space-y-6">
                <div>
                  <div className="grid grid-cols-6 gap-3">
                    {Array.from({ length: 6 }, (_, idx) => (
                      <input
                        key={idx}
                        ref={(el) => {
                          otpRefs.current[idx] = el;
                        }}
                        type="tel"
                        inputMode="numeric"
                        maxLength={6}
                        autoComplete={idx === 0 ? 'one-time-code' : 'off'}
                        aria-label={`OTP digit ${idx + 1}`}
                        value={otpDigits[idx] || ''}
                        onChange={(e) => handleOtpSlotChange(idx, e.target.value)}
                        onKeyDown={(e) => handleOtpSlotKeyDown(idx, e)}
                        onPaste={handleOtpPaste}
                        className="w-full h-11 text-center text-[18px] font-bold text-[#353543] border-b border-[#B8B8C7] focus:border-b-2 focus:border-[#9F2089] focus:outline-none bg-transparent tabular-nums transition-colors"
                      />
                    ))}
                  </div>

                  <div className="mt-4">
                    {resendSeconds > 0 ? (
                      <p className="text-[12.5px] text-[#8B8BA3] tabular-nums">
                        Resend OTP in {resendSeconds} s
                      </p>
                    ) : (
                      <button
                        type="button"
                        disabled={loading}
                        onClick={requestOtpOrAdmin}
                        className="text-[12.5px] font-bold text-[#9F2089] hover:underline disabled:opacity-50 uppercase tracking-wide cursor-pointer"
                      >
                        Resend OTP
                      </button>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 bg-[#9F2089] hover:bg-[#831871] disabled:opacity-60 text-white font-semibold text-[15px] rounded-[4px] transition-colors cursor-pointer"
                >
                  {loading ? 'Verifying...' : 'Verify'}
                </button>

                {!smsDelivered && previewOtp && (
                  <div className="pt-1 text-center text-[11.5px] text-[#8B8BA3]">
                    <span>Test OTP: </span>
                    <button
                      type="button"
                      onClick={() => fillOtpDigits(previewOtp)}
                      className="font-mono font-bold text-[#9F2089] hover:underline cursor-pointer"
                    >
                      {previewOtp}
                    </button>
                    <span> (Tap to fill)</span>
                  </div>
                )}
              </form>
            )}

            {/* STEP 2B: First-Time Admin Setup */}
            {step === 'admin_claim' && (
              <form onSubmit={handleClaimAdmin} className="space-y-4">
                <div className="p-3 rounded-md bg-[#9F2089]/5 border border-[#9F2089]/25 flex items-start gap-2.5 text-xs text-[#353543]">
                  <ShieldCheck className="w-4 h-4 text-[#9F2089] shrink-0 mt-0.5" />
                  <span>
                    Admin number/account recognized (
                    <strong className="font-semibold">
                      {authType === 'phone' ? `+91 ${identifier}` : identifier}
                    </strong>
                    ). Create a password to protect your Admin Panel.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#616173] mb-1">
                    Create Admin Password (min 6 characters)
                  </label>
                  <div className="relative">
                    <input
                      type={showAdminPassword ? 'text' : 'password'}
                      required
                      autoFocus
                      minLength={6}
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      placeholder="Enter password"
                      className="w-full border border-[#EAEAEF] focus:border-[#9F2089] rounded-md px-3.5 pr-10 py-2.5 text-sm focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAdminPassword((v) => !v)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8B8BA3] hover:text-[#353543] cursor-pointer"
                      aria-label={showAdminPassword ? 'Hide password' : 'Show password'}
                    >
                      {showAdminPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#616173] mb-1">
                    Confirm Admin Password
                  </label>
                  <input
                    type={showAdminPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={confirmAdminPassword}
                    onChange={(e) => setConfirmAdminPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full border border-[#EAEAEF] focus:border-[#9F2089] rounded-md px-3.5 py-2.5 text-sm focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 bg-[#9F2089] hover:bg-[#831871] disabled:opacity-60 text-white font-semibold text-[15px] rounded-md transition-colors cursor-pointer"
                >
                  {loading ? 'Setting up...' : 'Activate & Open Admin Panel'}
                </button>
              </form>
            )}

            {/* STEP 2C: Returning Admin Password Login */}
            {step === 'admin_password' && (
              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div className="p-3 rounded-md bg-[#F8F8FA] border border-[#EAEAEF] flex items-start gap-2.5 text-xs text-[#353543]">
                  <Lock className="w-4 h-4 text-[#9F2089] shrink-0 mt-0.5" />
                  <span>
                    Admin account:{' '}
                    <strong>
                      {authType === 'phone' ? `+91 ${identifier}` : identifier}
                    </strong>
                    . Enter the Admin Panel password you created.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#616173] mb-1">
                    Admin Panel Password
                  </label>
                  <div className="relative">
                    <input
                      type={showAdminPassword ? 'text' : 'password'}
                      required
                      autoFocus
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      placeholder="Enter your admin password"
                      className="w-full border border-[#EAEAEF] focus:border-[#9F2089] rounded-md px-3.5 pr-10 py-2.5 text-sm focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAdminPassword((v) => !v)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8B8BA3] hover:text-[#353543] cursor-pointer"
                      aria-label={showAdminPassword ? 'Hide password' : 'Show password'}
                    >
                      {showAdminPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 bg-[#9F2089] hover:bg-[#831871] disabled:opacity-60 text-white font-semibold text-[15px] rounded-md transition-colors cursor-pointer"
                >
                  {loading ? 'Verifying...' : 'Sign In to Admin Panel'}
                </button>
              </form>
            )}
          </div>

          <p className="mt-8 text-center text-[11.5px] text-[#8B8BA3] leading-relaxed">
            By continuing, you agree to Meesho&rsquo;s
            <br />
            <span className="text-[#9F2089] font-semibold">Terms &amp; Conditions</span>{' '}
            and{' '}
            <span className="text-[#9F2089] font-semibold">Privacy Policy</span>
          </p>
        </div>
      </div>
    </div>
  );
};
