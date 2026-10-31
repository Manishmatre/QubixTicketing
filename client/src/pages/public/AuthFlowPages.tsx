import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
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
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState<string>('');
  const [resendEmail, setResendEmail] = useState<string>('');
  const [resendLoading, setResendLoading] = useState<boolean>(false);
  const [resendSent, setResendSent] = useState<boolean>(false);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('No verification token provided. Please use the link sent to your email.');
      return;
    }

    const verify = async () => {
      try {
        const res = await apiClient.post('/auth/verify-email', { token });
        if (res.data.success) {
          setStatus('success');
          setMessage(res.data.message || 'Your email has been verified successfully!');
        } else {
          setStatus('error');
          setMessage(res.data.error?.message || 'Verification link is invalid or expired.');
        }
      } catch (err: any) {
        setStatus('error');
        setMessage(err.response?.data?.error?.message || 'Verification link is invalid or has expired.');
      }
    };

    verify();
  }, [token]);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resendEmail) return;
    setResendLoading(true);
    try {
      await apiClient.post('/auth/resend-verification', { email: resendEmail.trim() });
      setResendSent(true);
    } catch (err) {
      // ignore
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center items-center p-6 text-slate-800 font-sans">
      <div className="w-full max-w-md bg-white border border-[#EAECF0] rounded-2xl shadow-subtle p-8 text-center space-y-6">
        <Link to="/" className="inline-block">
          <img src="/logo.png" alt="QubixDesk" className="h-9 mx-auto object-contain" />
        </Link>

        {status === 'verifying' && (
          <div className="space-y-3 py-6">
            <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <h2 className="text-base font-bold text-slate-900">Verifying Email Address...</h2>
            <p className="text-xs text-slate-500">Checking your secure cryptographic verification token.</p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-4 py-4">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-2xs">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-extrabold text-slate-900">Email Verified!</h2>
            <p className="text-xs text-slate-600 leading-relaxed">{message}</p>
            <div className="pt-2">
              <Button
                variant="primary"
                className="w-full text-xs font-semibold"
                onClick={() => navigate('/login')}
              >
                Proceed to Sign In &rarr;
              </Button>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-4 py-2">
            <div className="w-14 h-14 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto shadow-2xs">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Verification Expired</h2>
            <p className="text-xs text-slate-500 leading-relaxed">{message}</p>

            {resendSent ? (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl font-medium">
                New verification email sent! Check your inbox.
              </div>
            ) : (
              <form onSubmit={handleResend} className="space-y-3 pt-2 text-left text-xs">
                <Input
                  label="Enter your email to receive a new link"
                  type="email"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  placeholder="name@company.com"
                  required
                />
                <Button type="submit" variant="primary" className="w-full text-xs font-semibold" isLoading={resendLoading}>
                  Resend Verification Email
                </Button>
              </form>
            )}

            <div className="pt-3 border-t border-slate-100">
              <Link to="/login" className="text-xs font-semibold text-blue-600 hover:underline">
                Back to Sign In
              </Link>
            </div>
          </div>
        )}
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

