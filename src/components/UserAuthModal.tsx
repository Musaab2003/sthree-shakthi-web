import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Building, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight,
  ShieldCheck,
  LogIn,
  UserPlus,
  KeyRound,
  RotateCcw
} from 'lucide-react';
import { storageService } from '../services/storageService';
import { UserAccount } from '../types';

interface UserAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: UserAccount) => void;
  initialMode?: 'login' | 'register';
  messageNotice?: string;
}

export const UserAuthModal: React.FC<UserAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialMode = 'login',
  messageNotice
}) => {
  const [mode, setMode] = useState<'login' | 'register' | 'otp_verify'>(initialMode);
  
  // Register Fields
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regClub, setRegClub] = useState('');

  // OTP Verification Fields
  const [otpCode, setOtpCode] = useState('');
  const [resendTimer, setResendTimer] = useState(0);

  // Login Fields
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // UI States
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Countdown timer for OTP resend
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setIsLoading(true);

    try {
      const res = await storageService.loginUser(loginEmail, loginPassword);
      if (res.success && res.user) {
        setSuccessMsg(`Welcome back, ${res.user.name}!`);
        setTimeout(() => {
          onSuccess(res.user!);
          onClose();
        }, 800);
      } else {
        setErrorMsg(res.message || 'Invalid email or password.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 1 of Registration: Request 6-digit OTP
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setIsLoading(true);

    if (regPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      setIsLoading(false);
      return;
    }

    try {
      const res = await storageService.sendRegistrationOtp(regEmail, regName);
      if (res.success) {
        setMode('otp_verify');
        setOtpCode('');
        setResendTimer(60);
        setSuccessMsg(`A 6-digit verification code has been dispatched to ${regEmail.trim().toLowerCase()}. Please check your Gmail/Inbox.`);
      } else {
        setErrorMsg(res.message || 'Failed to send verification code. Please try again.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to send verification code.');
    } finally {
      setIsLoading(false);
    }
  };

  // Resend OTP handler
  const handleResendOtp = async () => {
    if (resendTimer > 0 || isLoading) return;
    setErrorMsg('');
    setSuccessMsg('');
    setIsLoading(true);

    try {
      const res = await storageService.sendRegistrationOtp(regEmail, regName);
      if (res.success) {
        setResendTimer(60);
        setSuccessMsg(`A new 6-digit verification code has been dispatched to ${regEmail}. Please check your inbox and spam folder.`);
      } else {
        setErrorMsg(res.message || 'Could not resend code.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Could not resend code.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2 of Registration: Verify 6-digit OTP & Create Account
  const handleVerifyOtpAndRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setIsLoading(true);

    try {
      const verifyRes = await storageService.verifyRegistrationOtp(regEmail, otpCode);
      if (!verifyRes.success) {
        setErrorMsg(verifyRes.message || 'Invalid verification code.');
        setIsLoading(false);
        return;
      }

      // OTP verified! Finalize account registration in Cloud Firestore
      const regRes = await storageService.registerUser(
        regName,
        regEmail,
        regPassword,
        regClub
      );

      if (regRes.success && regRes.user) {
        setSuccessMsg('Email verified and account registered successfully! Please sign in.');
        setLoginEmail(regEmail.trim().toLowerCase());
        setLoginPassword('');
        setMode('login');
        setRegPassword('');
        setRegName('');
        setRegClub('');
        setOtpCode('');
      } else {
        setErrorMsg(regRes.message || 'Registration failed. Please try again.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#3E1028]/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-md bg-white rounded-[32px] shadow-2xl flex flex-col overflow-hidden border border-[#F4E5DA]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#F4E5DA] bg-[#FAF2EB]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#D95F7F] text-white flex items-center justify-center font-bold shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-serif text-base font-bold text-[#3E1028]">
                {mode === 'login' 
                  ? 'Contributor Sign In' 
                  : mode === 'register' 
                    ? 'Join Sthree Shakthi' 
                    : 'Verify Your Email'}
              </h2>
              <p className="text-[10px] text-[#5C1D3B]/70">
                {mode === 'login' 
                  ? 'Access your dashboard & submit blogs' 
                  : mode === 'register' 
                    ? 'Create an author profile to publish' 
                    : `Enter the 6-digit code sent to ${regEmail}`}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message Notice if triggered by Submit Blog action */}
        {messageNotice && (
          <div className="px-6 py-2.5 bg-amber-50 border-b border-amber-200 text-amber-800 text-xs font-semibold flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{messageNotice}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="p-6 sm:p-7 space-y-5 bg-[#FDF9F6]">
          
          {/* Tab Switcher (Visible in login and register modes) */}
          {mode !== 'otp_verify' && (
            <div className="flex items-center p-1 rounded-2xl bg-[#FAF2EB] border border-[#F4E5DA]">
              <button
                type="button"
                onClick={() => { setMode('login'); setErrorMsg(''); }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all ${
                  mode === 'login'
                    ? 'bg-white text-[#D95F7F] shadow-xs'
                    : 'text-[#5C1D3B]/70 hover:text-[#3E1028]'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>

              <button
                type="button"
                onClick={() => { setMode('register'); setErrorMsg(''); }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all ${
                  mode === 'register'
                    ? 'bg-white text-[#D95F7F] shadow-xs'
                    : 'text-[#5C1D3B]/70 hover:text-[#3E1028]'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Register Account</span>
              </button>
            </div>
          )}

          {/* Success Banner */}
          {successMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Error Banner */}
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold animate-in fade-in">
              ⚠️ {errorMsg}
            </div>
          )}

          {mode === 'login' ? (
            /* 1. Login Form */
            <form onSubmit={handleLogin} className="space-y-4 text-left">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#3E1028] uppercase tracking-wider">
                  Email Address <span className="text-[#D95F7F]">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    required
                    placeholder="you@rotaract.org"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-[#F4E5DA] text-xs text-[#3E1028] focus:outline-none focus:ring-2 focus:ring-[#D95F7F]/30"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#3E1028] uppercase tracking-wider">
                  Password <span className="text-[#D95F7F]">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Enter your password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-white border border-[#F4E5DA] text-xs font-mono text-[#3E1028] focus:outline-none focus:ring-2 focus:ring-[#D95F7F]/30"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4 text-[#D95F7F]" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-full bg-[#D95F7F] hover:bg-[#BE4465] text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-[#D95F7F]/25 transition-all hover:scale-101 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Sign In to Continue</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
          ) : mode === 'register' ? (
            /* 2. Registration Form (Step 1) */
            <form onSubmit={handleRequestOtp} className="space-y-3.5 text-left">
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-[#3E1028] uppercase tracking-wider">
                  Full Name / Author Name <span className="text-[#D95F7F]">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Amanda Silva"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-xl bg-white border border-[#F4E5DA] text-xs text-[#3E1028] focus:outline-none focus:ring-2 focus:ring-[#D95F7F]/30"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-[#3E1028] uppercase tracking-wider">
                  Email Address <span className="text-[#D95F7F]">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    placeholder="amanda@gmail.com"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-xl bg-white border border-[#F4E5DA] text-xs text-[#3E1028] focus:outline-none focus:ring-2 focus:ring-[#D95F7F]/30"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-[#3E1028] uppercase tracking-wider">
                  Rotaract Club or Organization (Optional)
                </label>
                <div className="relative">
                  <Building className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    placeholder="e.g. Rotaract Club of Colombo Central"
                    value={regClub}
                    onChange={(e) => setRegClub(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-xl bg-white border border-[#F4E5DA] text-xs text-[#3E1028] focus:outline-none focus:ring-2 focus:ring-[#D95F7F]/30"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-[#3E1028] uppercase tracking-wider">
                  Password <span className="text-[#D95F7F]">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="At least 6 characters"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2 rounded-xl bg-white border border-[#F4E5DA] text-xs font-mono text-[#3E1028] focus:outline-none focus:ring-2 focus:ring-[#D95F7F]/30"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-2.5 text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4 text-[#D95F7F]" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 rounded-full bg-[#D95F7F] hover:bg-[#BE4465] text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-[#D95F7F]/25 transition-all hover:scale-101 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Send Verification Code</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* 3. OTP Verification Form (Step 2) */
            <form onSubmit={handleVerifyOtpAndRegister} className="space-y-4 text-left animate-in fade-in">
              <div className="p-4 rounded-2xl bg-white border border-[#F4E5DA] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#3E1028] flex items-center gap-1.5">
                    <KeyRound className="w-4 h-4 text-[#D95F7F]" />
                    <span>Enter 6-Digit Code</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => { setMode('register'); setErrorMsg(''); }}
                    className="text-[11px] font-medium text-[#D95F7F] hover:underline cursor-pointer"
                  >
                    Edit Details
                  </button>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    autoComplete="one-time-code"
                    required
                    maxLength={6}
                    placeholder="• • • • • •"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                    className="w-full py-3 text-center tracking-[0.5em] font-mono text-xl font-black rounded-xl bg-[#FAF2EB]/60 border-2 border-[#D95F7F]/40 focus:border-[#D95F7F] text-[#3E1028] focus:outline-none"
                    autoFocus
                  />
                </div>

                <div className="p-3 rounded-xl bg-[#FAF2EB]/80 border border-[#F4E5DA] text-[11px] text-[#5C1D3B]/80 flex items-start gap-2 leading-relaxed">
                  <Mail className="w-4 h-4 text-[#D95F7F] shrink-0 mt-0.5" />
                  <span>
                    A unique 6-digit verification code was sent to <strong className="text-[#3E1028]">{regEmail}</strong>. Please check your Gmail / Inbox (and Spam/Junk folder) and enter it above.
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs px-1">
                <span className="text-[#5C1D3B]/70 text-[11px]">Didn't receive the email?</span>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendTimer > 0 || isLoading}
                  className="font-bold text-[#D95F7F] hover:text-[#BE4465] disabled:opacity-50 flex items-center gap-1 cursor-pointer text-[11px]"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>{resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend Code'}</span>
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading || otpCode.length < 4}
                className="w-full py-3 rounded-full bg-[#D95F7F] hover:bg-[#BE4465] text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-[#D95F7F]/25 transition-all hover:scale-101 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Verify Code & Complete Registration</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Privacy Footnote */}
          <div className="pt-1 text-center text-[10px] text-[#5C1D3B]/60 flex items-center justify-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Multi-device cloud synchronization & encrypted credentials</span>
          </div>

        </div>
      </div>
    </div>
  );
};
