import React, { useState, useEffect } from 'react';
import { useSearchParams, useLocation, useNavigate, Link } from 'react-router-dom';
import { apiClient } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import {
  CheckCircle2,
  AlertCircle,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  KeyRound,
  Building,
  UserPlus,
  Sparkles,
} from 'lucide-react';

export const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { setAuthSession, reloadUser } = useAuth();

  const tokenFromUrl = searchParams.get('token');
  const emailFromUrl = searchParams.get('email') || (location.state as any)?.email || '';
  const nameFromState = (location.state as any)?.name || '';

  const [email, setEmail] = useState<string>(emailFromUrl);
  const [otp, setOtp] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');
  
  // Resend Countdown
  const [resendCooldown, setResendCooldown] = useState<number>(60);
  const [resendLoading, setResendLoading] = useState<boolean>(false);
  const [resendMsg, setResendMsg] = useState<string>('');

  // Handle countdown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // If token is present in URL (link clicked in email), verify automatically
  useEffect(() => {
    if (tokenFromUrl) {
      const verifyToken = async () => {
        setIsLoading(true);
        setError('');
        try {
          const res = await apiClient.post('/auth/verify-email', { token: tokenFromUrl });
          if (res.data.success) {
            setSuccessMsg('Email verified successfully!');
            const { user, accessToken } = res.data.data;
            if (user && accessToken) {
              setAuthSession(user, accessToken);
              await reloadUser();
            }
            setTimeout(() => {
              navigate('/onboarding', { replace: true });
            }, 1200);
          } else {
            setError(res.data.error?.message || 'Verification link is invalid or expired.');
          }
        } catch (err: any) {
          setError(err.response?.data?.error?.message || 'Verification link is invalid or expired.');
        } finally {
          setIsLoading(false);
        }
      };
      verifyToken();
    }
  }, [tokenFromUrl]);

  // Handle 6-digit OTP verification submit
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please provide your registered work email address.');
      return;
    }
    const cleanOtp = otp.trim().replace(/\s+/g, '');
    if (cleanOtp.length !== 6) {
      setError('Please enter the full 6-digit verification code.');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await apiClient.post('/auth/verify-email', {
        email: email.trim().toLowerCase(),
        otp: cleanOtp,
      });

      if (res.data.success) {
        setSuccessMsg('Email verified! Launching your workspace setup...');
        const { user, accessToken } = res.data.data;
        if (user && accessToken) {
          setAuthSession(user, accessToken);
          await reloadUser();
        }
        setTimeout(() => {
          navigate('/onboarding', { replace: true });
        }, 1200);
      } else {
        setError(res.data.error?.message || 'Invalid or expired verification code.');
      }
    } catch (err: any) {
      setError(
        err.response?.data?.error?.message ||
          'Invalid or expired verification code. Please check your inbox or resend code.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Resend Verification Code
  const handleResend = async () => {
    if (resendCooldown > 0 || !email.trim()) return;
    setResendLoading(true);
    setError('');
    setResendMsg('');

    try {
      const res = await apiClient.post('/auth/resend-verification', {
        email: email.trim().toLowerCase(),
      });
      setResendMsg(res.data.message || 'A fresh 6-digit code has been dispatched to your email.');
      setResendCooldown(60);
      setTimeout(() => setResendMsg(''), 5000);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to resend code. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center items-center p-6 text-slate-800 font-sans">
      <div className="w-full max-w-md bg-white border border-[#EAECF0] rounded-2xl shadow-subtle p-8 text-center space-y-6">
        <Link to="/" className="inline-block">
          <img src="/logo.png" alt="QubixDesk" className="h-10 mx-auto object-contain" />
        </Link>

        {/* Header Icon */}
        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto shadow-2xs border border-blue-100">
          <Mail className="w-8 h-8 text-blue-600" />
        </div>

        <div className="space-y-1.5">
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Check Your Email
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            {nameFromState ? `Welcome, ${nameFromState}! ` : ''}
            We have sent a 6-digit security code to:
          </p>
          <div className="inline-flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1 rounded-lg text-xs font-mono font-bold text-slate-800 mt-1">
            <Mail className="w-3.5 h-3.5 text-slate-400" />
            <span>{email || 'your email'}</span>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2 font-medium text-left">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Success Alert */}
        {successMsg && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2.5 font-bold text-left animate-pulse">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Resend Notice */}
        {resendMsg && (
          <div className="p-3 bg-blue-50 border border-blue-200 text-blue-700 text-xs rounded-xl flex items-center gap-2 font-medium text-left">
            <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
            <span>{resendMsg}</span>
          </div>
        )}

        {/* OTP Input Form */}
        <form onSubmit={handleVerifyOtp} className="space-y-5 text-left text-xs">
          {!emailFromUrl && (
            <Input
              label="Work Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alex@company.com"
              required
            />
          )}

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="block font-semibold text-slate-700 text-xs">
                Enter 6-Digit OTP Code
              </label>
              <span className="text-[11px] text-slate-400">Valid for 15 minutes</span>
            </div>

            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={otp}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9]/g, '');
                setOtp(val);
                if (val.length === 6) setError('');
              }}
              placeholder="••••••"
              autoFocus
              required
              className="w-full bg-[#F8FAFC] border-2 border-slate-200 focus:border-blue-600 rounded-xl px-4 py-3 text-center text-2xl font-mono font-black tracking-[0.5em] text-slate-900 outline-none focus:ring-4 focus:ring-blue-100 transition-all placeholder:tracking-normal placeholder:font-sans placeholder:text-sm placeholder:text-slate-400"
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full text-xs font-bold py-3 shadow-md shadow-blue-500/10"
            isLoading={isLoading}
          >
            Verify Email & Continue &rarr;
          </Button>
        </form>

        {/* Resend Action */}
        <div className="pt-2 border-t border-slate-100 flex flex-col items-center gap-2 text-xs">
          <p className="text-slate-500">
            Didn't receive the email code?
          </p>
          <button
            type="button"
            onClick={handleResend}
            disabled={resendCooldown > 0 || resendLoading}
            className={`font-semibold transition-colors ${
              resendCooldown > 0 || resendLoading
                ? 'text-slate-400 cursor-not-allowed'
                : 'text-blue-600 hover:text-blue-800 hover:underline cursor-pointer'
            }`}
          >
            {resendLoading
              ? 'Sending fresh code...'
              : resendCooldown > 0
              ? `Resend code in ${resendCooldown}s`
              : 'Resend Verification Code'}
          </button>
        </div>

        <div className="pt-1 text-center text-xs text-slate-400">
          <Link to="/register" className="hover:text-slate-600 transition-colors">
            ← Change email or return to sign up
          </Link>
        </div>
      </div>
    </div>
  );
};

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsLoading(true);
    setError('');

    try {
      const res = await apiClient.post('/auth/forgot-password', { email: email.trim() });
      if (res.data.success) {
        setIsSubmitted(true);
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to send reset link.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center items-center p-6 text-slate-800 font-sans">
      <div className="w-full max-w-md bg-white border border-[#EAECF0] rounded-2xl shadow-subtle p-8 space-y-6">
        <div className="text-center space-y-2">
          <Link to="/" className="inline-block">
            <img src="/logo.png" alt="QubixDesk" className="h-9 mx-auto object-contain" />
          </Link>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Reset your password</h2>
          <p className="text-xs text-slate-500">
            Enter your work email address and we will dispatch a secure recovery link.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
            {error}
          </div>
        )}

        {isSubmitted ? (
          <div className="text-center space-y-4 py-2">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto shadow-2xs">
              <Mail className="w-6 h-6" />
            </div>
            <p className="text-xs text-slate-700 leading-relaxed">
              If an account exists with <strong>{email}</strong>, a recovery email has been sent via SMTP with instructions to reset your password.
            </p>
            <div className="pt-2">
              <Link to="/login">
                <Button variant="outline" className="w-full text-xs font-semibold">
                  Back to Sign In
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <Input
              label="Work Email Address *"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              required
            />

            <Button type="submit" variant="primary" className="w-full text-xs font-semibold" isLoading={isLoading}>
              Send Password Reset Link
            </Button>

            <div className="pt-2 text-center">
              <Link to="/login" className="text-xs font-semibold text-slate-500 hover:text-blue-600 inline-flex items-center gap-1">
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Sign In</span>
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError('Missing recovery token.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const res = await apiClient.post('/auth/reset-password', {
        token,
        newPassword,
      });

      if (res.data.success) {
        setSuccess(true);
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Password reset failed. Link may have expired.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center items-center p-6 text-slate-800 font-sans">
      <div className="w-full max-w-md bg-white border border-[#EAECF0] rounded-2xl shadow-subtle p-8 space-y-6">
        <div className="text-center space-y-2">
          <Link to="/" className="inline-block">
            <img src="/logo.png" alt="QubixDesk" className="h-9 mx-auto object-contain" />
          </Link>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Choose a new password</h2>
          <p className="text-xs text-slate-500">Ensure your password is at least 6 characters.</p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
            {error}
          </div>
        )}

        {success ? (
          <div className="text-center space-y-4 py-4">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-2xs">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Password Updated!</h3>
            <p className="text-xs text-slate-600">
              Your password has been changed. You can now log into your workspace with your new credentials.
            </p>
            <div className="pt-2">
              <Button variant="primary" className="w-full text-xs font-semibold" onClick={() => navigate('/login')}>
                Sign In to Workspace &rarr;
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <Input
              label="New Password *"
              type={showPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••••••"
              required
            />

            <Input
              label="Confirm New Password *"
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••••••"
              required
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1.5 font-medium"
            >
              {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{showPassword ? 'Hide Passwords' : 'Show Passwords'}</span>
            </button>

            <Button type="submit" variant="primary" className="w-full text-xs font-semibold" isLoading={isLoading}>
              Update Password
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};

export const AcceptInvitePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const { reloadUser } = useAuth();

  const [invitation, setInvitation] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [name, setName] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      setError('No invitation token provided.');
      return;
    }

    const fetchDetails = async () => {
      try {
        const res = await apiClient.get(`/auth/invitation/${token}`);
        if (res.data.success) {
          setInvitation(res.data.data);
        } else {
          setError(res.data.error?.message || 'Invitation is invalid or has expired.');
        }
      } catch (err: any) {
        setError(err.response?.data?.error?.message || 'Invitation is invalid or has expired.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDetails();
  }, [token]);

  const handleAccept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setIsSubmitting(true);
    setError('');

    try {
      const res = await apiClient.post('/auth/accept-invitation', {
        token,
        name: name.trim(),
        password,
      });

      if (res.data.success) {
        localStorage.setItem('qubix_access_token', res.data.data.accessToken);
        await reloadUser();
        setSuccess(true);
        setTimeout(() => {
          navigate('/workspace/dashboard');
        }, 1500);
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to accept invitation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center items-center p-6 text-slate-800 font-sans">
      <div className="w-full max-w-md bg-white border border-[#EAECF0] rounded-2xl shadow-subtle p-8 space-y-6">
        <div className="text-center space-y-2">
          <Link to="/" className="inline-block">
            <img src="/logo.png" alt="QubixDesk" className="h-9 mx-auto object-contain" />
          </Link>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Team Workspace Invitation</h2>
        </div>

        {isLoading ? (
          <div className="py-8 text-center text-xs text-slate-400">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p>Loading invitation details...</p>
          </div>
        ) : error ? (
          <div className="text-center space-y-4 py-2">
            <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <p className="text-xs text-red-700">{error}</p>
            <Link to="/login">
              <Button variant="outline" className="w-full text-xs font-semibold">
                Back to Sign In
              </Button>
            </Link>
          </div>
        ) : success ? (
          <div className="text-center space-y-3 py-4">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Welcome to the Team!</h3>
            <p className="text-xs text-slate-600">Redirecting to your workspace dashboard...</p>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Invitation Details Banner */}
            <div className="bg-[#F8FAFC] border border-[#EAECF0] rounded-xl p-4 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <Building className="w-4 h-4 text-blue-600" />
                <span>{invitation?.organization?.name}</span>
              </div>
              <p className="text-slate-600 text-[11px]">
                Invited by <strong>{invitation?.invitedBy?.name || 'Workspace Lead'}</strong> as an <strong>{invitation?.role}</strong>.
              </p>
              <div className="font-mono text-[11px] text-blue-600 font-semibold">
                Invited Email: {invitation?.email}
              </div>
            </div>

            <form onSubmit={handleAccept} className="space-y-4 text-xs">
              <Input
                label="Your Full Name *"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Sarah Jenkins"
                required
              />

              <Input
                label="Set Password *"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                required
              />

              <Button type="submit" variant="primary" className="w-full text-xs font-semibold" isLoading={isSubmitting}>
                Accept & Join Workspace
              </Button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

