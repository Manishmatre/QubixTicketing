import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../api/client';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { StatusBadge, PriorityBadge } from '../../components/ui/Badge';
import { Ticket } from '../../types';
import {
  User as UserIcon,
  Shield,
  Bell,
  Activity,
  KeyRound,
  CheckCircle2,
  Mail,
  Building,
  Phone,
  MapPin,
  Clock,
  Laptop,
  Smartphone,
  Save,
  Check,
  AlertCircle,
  ExternalLink,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  Camera,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

export const UserProfilePage: React.FC = () => {
  const { user, organization, updateUser, reloadUser } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'notifications' | 'activity'>('profile');

  // Personal Info Form State
  const [name, setName] = useState<string>('');
  const [jobTitle, setJobTitle] = useState<string>('Senior Software Architect');
  const [department, setDepartment] = useState<string>('Engineering');
  const [phone, setPhone] = useState<string>('+1 (555) 019-2834');
  const [location, setLocation] = useState<string>('San Francisco, CA (Remote)');
  const [timezone, setTimezone] = useState<string>('America/Los_Angeles');
  const [bio, setBio] = useState<string>(
    'Leading architecture, multi-tenant isolation protocols, and real-time collaboration engines at QubixDesk.'
  );
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [isSavingProfile, setIsSavingProfile] = useState<boolean>(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string>('');
  const [profileErrorMsg, setProfileErrorMsg] = useState<string>('');

  // Password & Security Form State
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isChangingPassword, setIsChangingPassword] = useState<boolean>(false);
  const [securitySuccessMsg, setSecuritySuccessMsg] = useState<string>('');
  const [securityErrorMsg, setSecurityErrorMsg] = useState<string>('');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState<boolean>(false);

  // Notifications State
  const [emailAssign, setEmailAssign] = useState<boolean>(true);
  const [emailStatus, setEmailStatus] = useState<boolean>(true);
  const [emailMention, setEmailMention] = useState<boolean>(true);
  const [emailDigest, setEmailDigest] = useState<boolean>(false);
  const [emailSla, setEmailSla] = useState<boolean>(true);
  const [desktopNotifs, setDesktopNotifs] = useState<boolean>(true);
  const [soundAlerts, setSoundAlerts] = useState<boolean>(false);
  const [notifSaved, setNotifSaved] = useState<boolean>(false);

  // User Tickets State
  const [myTickets, setMyTickets] = useState<Ticket[]>([]);
  const [isLoadingTickets, setIsLoadingTickets] = useState<boolean>(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setAvatarUrl(user.avatarUrl || '');
    }
  }, [user]);

  // Fetch assigned tickets
  useEffect(() => {
    const fetchUserTickets = async () => {
      setIsLoadingTickets(true);
      try {
        const res = await apiClient.get('/tickets?limit=15');
        if (res.data.success) {
          setMyTickets(res.data.data);
        }
      } catch (err) {
        console.error('Fetch user tickets error:', err);
      } finally {
        setIsLoadingTickets(false);
      }
    };
    fetchUserTickets();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setProfileSuccessMsg('');
    setProfileErrorMsg('');

    try {
      const res = await apiClient.patch('/auth/profile', {
        name: name.trim(),
        avatarUrl: avatarUrl.trim(),
      });

      if (res.data.success) {
        updateUser(res.data.data);
        setProfileSuccessMsg('Profile details updated successfully!');
        setTimeout(() => setProfileSuccessMsg(''), 4000);
      }
    } catch (err: any) {
      setProfileErrorMsg(err.response?.data?.error?.message || 'Failed to update profile.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSecuritySuccessMsg('');
    setSecurityErrorMsg('');

    if (newPassword !== confirmPassword) {
      setSecurityErrorMsg('New password and confirmation do not match.');
      return;
    }

    if (newPassword.length < 6) {
      setSecurityErrorMsg('New password must be at least 6 characters.');
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await apiClient.patch('/auth/profile', {
        currentPassword,
        newPassword,
      });

      if (res.data.success) {
        setSecuritySuccessMsg('Password changed successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setSecuritySuccessMsg(''), 4000);
      }
    } catch (err: any) {
      setSecurityErrorMsg(err.response?.data?.error?.message || 'Failed to change password.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleSaveNotifications = (e: React.FormEvent) => {
    e.preventDefault();
    setNotifSaved(true);
    setTimeout(() => setNotifSaved(false), 3000);
  };

  const activeSessions = [
    {
      id: 'sess-1',
      device: 'Windows 11 • Google Chrome 129',
      location: 'San Francisco, United States',
      ip: '192.0.2.45',
      current: true,
      time: 'Active now',
      icon: Laptop,
    },
    {
      id: 'sess-2',
      device: 'Apple iPhone 15 Pro • QubixDesk Mobile',
      location: 'San Francisco, United States',
      ip: '198.51.100.82',
      current: false,
      time: '2 hours ago',
      icon: Smartphone,
    },
    {
      id: 'sess-3',
      device: 'macOS Sonoma • Safari 17.5',
      location: 'San Jose, United States',
      ip: '203.0.113.19',
      current: false,
      time: '3 days ago',
      icon: Laptop,
    },
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-white font-sans text-slate-800 p-5 space-y-4">
      {/* 1. Profile Hero Overview Card - Compact, balanced padding */}
      <div className="bg-[#F8FAFC] border border-[#EAECF0] rounded-xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {/* Avatar with Status Badge */}
          <div className="relative group">
            <Avatar name={user?.name} src={avatarUrl || user?.avatarUrl} size="lg" className="w-16 h-16 text-lg ring-4 ring-white shadow-2xs" />
            <span
              className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-white"
              title="Online"
            />
          </div>

          <div className="space-y-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg md:text-xl font-bold text-slate-900 tracking-tight">
                {user?.name || 'Workspace Member'}
              </h2>
              <span className="bg-blue-50 text-blue-700 border border-blue-200/80 font-semibold text-[11px] px-2.5 py-0.5 rounded-full capitalize">
                {organization?.role || 'Organization Member'}
              </span>
              {user?.isSuperAdmin && (
                <span className="bg-purple-50 text-purple-700 border border-purple-200 font-semibold text-[11px] px-2 py-0.5 rounded-full">
                  Super Admin
                </span>
              )}
            </div>

            <p className="text-xs text-slate-500 font-mono flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              <span>{user?.email || 'user@example.com'}</span>
            </p>

            <p className="text-xs text-slate-600 font-medium flex items-center gap-2 pt-0.5">
              <Building className="w-3.5 h-3.5 text-slate-400" />
              <span>{organization?.name || 'Acme Technologies Inc.'}</span>
              <span>•</span>
              <span className="text-blue-600 font-semibold">{jobTitle}</span>
            </p>
          </div>
        </div>

        {/* Quick Telemetry Statistics - Subtle, Sentence-case labels */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 w-full md:w-auto">
          <div className="bg-white border border-[#EAECF0] rounded-xl px-4 py-2.5 text-center shadow-2xs">
            <span className="block text-base font-bold text-slate-900">{myTickets.length}</span>
            <span className="text-xs font-medium text-slate-500">Tickets</span>
          </div>
          <div className="bg-white border border-[#EAECF0] rounded-xl px-4 py-2.5 text-center shadow-2xs">
            <span className="block text-base font-bold text-emerald-600">
              {myTickets.filter((t) => t.status === 'Resolved').length}
            </span>
            <span className="text-xs font-medium text-slate-500">Resolved</span>
          </div>
          <div className="bg-white border border-[#EAECF0] rounded-xl px-4 py-2.5 text-center shadow-2xs col-span-2 sm:col-span-1">
            <span className="block text-base font-bold text-blue-600">99.4%</span>
            <span className="text-xs font-medium text-slate-500">SLA met</span>
          </div>
        </div>
      </div>

      {/* 2. Navigation Tabs */}
      <div className="flex items-center gap-4 border-b border-[#EAECF0] text-xs font-bold">
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 pb-3 border-b-2 transition-all ${
            activeTab === 'profile'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <UserIcon className="w-4 h-4" />
          <span>Personal Information</span>
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2 pb-3 border-b-2 transition-all ${
            activeTab === 'security'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Security & Sessions</span>
        </button>

        <button
          onClick={() => setActiveTab('notifications')}
          className={`flex items-center gap-2 pb-3 border-b-2 transition-all ${
            activeTab === 'notifications'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>Notification Preferences</span>
        </button>

        <button
          onClick={() => setActiveTab('activity')}
          className={`flex items-center gap-2 pb-3 border-b-2 transition-all ${
            activeTab === 'activity'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Assigned Tickets ({myTickets.length})</span>
        </button>
      </div>

      {/* 3. Tab Contents */}

      {/* TAB 1: Personal Information */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSaveProfile} className="space-y-6">
          {profileSuccessMsg && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{profileSuccessMsg}</span>
            </div>
          )}

          {profileErrorMsg && (
            <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{profileErrorMsg}</span>
            </div>
          )}

          <div className="bg-white border border-[#EAECF0] rounded-xl p-6 shadow-2xs space-y-5">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <UserIcon className="w-4 h-4 text-blue-600" />
              <span>General Information</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
              <Input
                label="Full Name *"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Sarah Jenkins"
                required
              />

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5 text-xs">Work Email (Account ID)</label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full bg-slate-50 border border-[#EAECF0] rounded-lg px-3 py-2 text-xs text-slate-500 cursor-not-allowed font-mono"
                />
              </div>

              <Input
                label="Job Title"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="Senior Architect"
              />

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5 text-xs">Department</label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full bg-white border border-[#EAECF0] rounded-lg px-3 py-2 text-xs text-slate-800 outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="Engineering">Engineering & Development</option>
                  <option value="Product">Product Management</option>
                  <option value="DevOps">DevOps & Cloud Infrastructure</option>
                  <option value="QA">Quality Assurance & Testing</option>
                  <option value="Design">UI/UX & Product Design</option>
                  <option value="Support">Customer Support & Helpdesk</option>
                </select>
              </div>

              <Input
                label="Phone Number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
              />

              <Input
                label="Location / Office"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="San Francisco, CA"
              />

              <div className="md:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1.5 text-xs">Avatar Image URL</label>
                <input
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/... or direct image link"
                  className="w-full bg-white border border-[#EAECF0] rounded-lg px-3 py-2 text-xs text-slate-800 outline-none focus:border-blue-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Paste a link to any public profile image or leave empty for automatic color initials.
                </p>
              </div>

              <div className="md:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1.5 text-xs">Personal Bio</label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Brief summary of your responsibilities..."
                  className="w-full bg-white border border-[#EAECF0] rounded-lg p-3 text-xs text-slate-800 outline-none focus:border-blue-500 resize-y"
                />
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <Button type="submit" variant="primary" isLoading={isSavingProfile} leftIcon={<Save className="w-3.5 h-3.5" />}>
                Save Profile
              </Button>
            </div>
          </div>
        </form>
      )}

      {/* TAB 2: Security & Sessions */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          {securitySuccessMsg && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{securitySuccessMsg}</span>
            </div>
          )}

          {securityErrorMsg && (
            <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{securityErrorMsg}</span>
            </div>
          )}

          {/* Change Password */}
          <form onSubmit={handleChangePassword} className="bg-white border border-[#EAECF0] rounded-xl p-6 shadow-2xs space-y-5">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-blue-600" />
              <span>Update Password</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
              <div className="relative">
                <Input
                  label="Current Password *"
                  type={showPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                />
              </div>

              <div className="relative">
                <Input
                  label="New Password *"
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  required
                />
              </div>

              <div className="relative">
                <Input
                  label="Confirm New Password *"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1.5 font-medium"
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{showPassword ? 'Hide Passwords' : 'Show Passwords'}</span>
              </button>

              <Button type="submit" variant="primary" isLoading={isChangingPassword} leftIcon={<Lock className="w-3.5 h-3.5" />}>
                Update Password
              </Button>
            </div>
          </form>

          {/* Two-Factor Authentication (2FA) */}
          <div className="bg-white border border-[#EAECF0] rounded-xl p-6 shadow-2xs space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-600" />
                  <span>Two-Factor Authentication (2FA)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Add an extra layer of security to your QubixDesk account using an authenticator app (TOTP).
                </p>
              </div>

              <button
                type="button"
                onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                  twoFactorEnabled ? 'bg-blue-600' : 'bg-slate-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    twoFactorEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {twoFactorEnabled ? (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Two-Factor Authentication is currently active for your workspace account.</span>
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">2FA is currently disabled.</p>
            )}
          </div>

          {/* Active Sessions */}
          <div className="bg-white border border-[#EAECF0] rounded-xl p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Active Browser Sessions</h3>
                <p className="text-xs text-slate-500 mt-0.5">Devices currently authenticated to your account.</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => alert('Other sessions have been revoked.')}>
                Revoke All Others
              </Button>
            </div>

            <div className="space-y-3">
              {activeSessions.map((sess) => {
                const Icon = sess.icon;
                return (
                  <div
                    key={sess.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-[#EAECF0] bg-[#F8FAFC] text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900">{sess.device}</span>
                          {sess.current && (
                            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.2 rounded">
                              Current Session
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {sess.location} • IP: {sess.ip} • {sess.time}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Notifications */}
      {activeTab === 'notifications' && (
        <form onSubmit={handleSaveNotifications} className="space-y-6">
          {notifSaved && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Notification preferences saved!</span>
            </div>
          )}

          <div className="bg-white border border-[#EAECF0] rounded-xl p-6 shadow-2xs space-y-5">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <Mail className="w-4 h-4 text-blue-600" />
              <span>Email Notifications</span>
            </h3>

            <div className="space-y-4 text-xs">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={emailAssign}
                  onChange={(e) => setEmailAssign(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 mt-0.5 w-4 h-4"
                />
                <div>
                  <span className="font-bold text-slate-800">Ticket Assignments</span>
                  <p className="text-slate-500 text-[11px]">Send an email whenever an issue or ticket is assigned to you.</p>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={emailStatus}
                  onChange={(e) => setEmailStatus(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 mt-0.5 w-4 h-4"
                />
                <div>
                  <span className="font-bold text-slate-800">Status & Priority Transitions</span>
                  <p className="text-slate-500 text-[11px]">Notify when tickets you reported or follow change status.</p>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={emailMention}
                  onChange={(e) => setEmailMention(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 mt-0.5 w-4 h-4"
                />
                <div>
                  <span className="font-bold text-slate-800">Direct Mentions (@name)</span>
                  <p className="text-slate-500 text-[11px]">Receive immediate email when a teammate mentions you in a comment.</p>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={emailSla}
                  onChange={(e) => setEmailSla(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 mt-0.5 w-4 h-4"
                />
                <div>
                  <span className="font-bold text-slate-800">Critical SLA Escalations</span>
                  <p className="text-slate-500 text-[11px]">Immediate alert if a Critical or Urgent ticket breaches target resolution window.</p>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={emailDigest}
                  onChange={(e) => setEmailDigest(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 mt-0.5 w-4 h-4"
                />
                <div>
                  <span className="font-bold text-slate-800">Daily Morning Digest</span>
                  <p className="text-slate-500 text-[11px]">Receive a 9:00 AM summary of your upcoming tickets and deliverables.</p>
                </div>
              </label>
            </div>
          </div>

          <div className="bg-white border border-[#EAECF0] rounded-xl p-6 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <Laptop className="w-4 h-4 text-blue-600" />
              <span>In-App & Desktop Alerts</span>
            </h3>

            <div className="space-y-4 text-xs">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={desktopNotifs}
                  onChange={(e) => setDesktopNotifs(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 mt-0.5 w-4 h-4"
                />
                <div>
                  <span className="font-bold text-slate-800">Browser Push Notifications</span>
                  <p className="text-slate-500 text-[11px]">Display desktop banners for real-time WebSocket ticket updates.</p>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={soundAlerts}
                  onChange={(e) => setSoundAlerts(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 mt-0.5 w-4 h-4"
                />
                <div>
                  <span className="font-bold text-slate-800">Audio Chimes</span>
                  <p className="text-slate-500 text-[11px]">Play a subtle tone when new comments arrive in active tickets.</p>
                </div>
              </label>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <Button type="submit" variant="primary" leftIcon={<Save className="w-3.5 h-3.5" />}>
                Save Notification Settings
              </Button>
            </div>
          </div>
        </form>
      )}

      {/* TAB 4: Assigned Tickets */}
      {activeTab === 'activity' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2">
            <h3 className="text-sm font-bold text-slate-900">Assigned Issues & Deliverables</h3>
            <span className="text-xs text-slate-500 font-medium">{myTickets.length} active tickets</span>
          </div>

          {isLoadingTickets ? (
            <div className="py-12 text-center text-xs text-slate-400">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mb-2" />
              <p>Loading assigned tickets...</p>
            </div>
          ) : myTickets.length === 0 ? (
            <div className="p-8 text-center bg-[#F8FAFC] border border-[#EAECF0] rounded-xl text-xs text-slate-400">
              No tickets assigned to your account.
            </div>
          ) : (
            <div className="bg-white border border-[#EAECF0] rounded-xl shadow-2xs divide-y divide-[#EAECF0] overflow-hidden">
              {myTickets.map((t) => (
                <div
                  key={t._id}
                  onClick={() => navigate(`/workspace/tickets/${t._id}`)}
                  className="p-4 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-colors group text-xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200/60">
                      {t.ticketNumber}
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 group-hover:text-blue-600 truncate transition-colors">
                        {t.title}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {t.projectId?.name || 'General Project'} • {t.category || 'Issue'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <PriorityBadge priority={t.priority} size="sm" />
                    <StatusBadge status={t.status} size="sm" />
                    <ExternalLink className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-600 transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

