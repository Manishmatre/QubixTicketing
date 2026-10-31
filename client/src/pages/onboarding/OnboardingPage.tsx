import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../api/client';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import {
  UserCheck,
  Building2,
  FolderKanban,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Phone,
  Briefcase,
  Layers,
  ShieldCheck,
  Check,
} from 'lucide-react';

export const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, reloadUser } = useAuth();
  const [step, setStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Step 1: Admin Info
  const [adminName, setAdminName] = useState<string>(user?.name || '');
  const [adminPhone, setAdminPhone] = useState<string>(user?.phoneNumber || '');
  const [jobTitle, setJobTitle] = useState<string>('Founder & Administrator');
  const [department, setDepartment] = useState<string>('Leadership');

  // Step 2: Company Details
  const [companyName, setCompanyName] = useState<string>('');
  const [industry, setIndustry] = useState<string>('Technology & SaaS');
  const [size, setSize] = useState<string>('11-50');
  const [website, setWebsite] = useState<string>('');

  // Step 3: Project & Team Setup
  const [projectName, setProjectName] = useState<string>('Core Development');
  const [projectKey, setProjectKey] = useState<string>('DEV');
  const [inviteEmails, setInviteEmails] = useState<string>('');

  useEffect(() => {
    if (user?.name && !adminName) setAdminName(user.name);
    if (user?.phoneNumber && !adminPhone) setAdminPhone(user.phoneNumber);
  }, [user]);

  const handleNext = () => {
    if (step === 1) {
      if (!adminName.trim()) {
        alert('Please enter your full name.');
        return;
      }
      if (!adminPhone.trim()) {
        alert('Please enter your contact phone number.');
        return;
      }
    }

    if (step === 2) {
      if (!companyName.trim()) {
        alert('Please enter your company or organization name.');
        return;
      }
    }

    setStep((s) => s + 1);
  };

  const handleFinish = async () => {
    setIsSubmitting(true);
    try {
      const emails = inviteEmails
        .split(',')
        .map((e) => e.trim())
        .filter(Boolean);

      // Auto-generate clean slug from company name
      const generatedSlug = companyName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 30);

      const res = await apiClient.post('/organizations/onboarding', {
        organizationName: companyName.trim(),
        slug: generatedSlug || 'workspace',
        industry,
        size,
        website: website.trim(),
        phoneNumber: adminPhone.trim(),
        jobTitle: jobTitle.trim(),
        department: department.trim(),
        subscriptionPlan: 'starter',
        invitedEmails: emails,
        projectName: projectName.trim(),
        projectKey: projectKey.trim().toUpperCase(),
        firstTicketTitle: `Welcome to ${companyName.trim()} issue workspace`,
        firstTicketPriority: 'High',
      });

      if (res.data.success) {
        await reloadUser();
        navigate('/workspace/dashboard');
      }
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Onboarding setup failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center items-center p-6 font-sans">
      <div className="mb-6 text-center">
        <img
          src="/logo.png"
          alt="QubixDesk"
          className="h-10 mx-auto object-contain"
        />
        <p className="text-xs text-slate-500 mt-1 font-medium">Work Smarter. Track Better. Deliver Faster.</p>
      </div>

      <div className="w-full max-w-xl bg-white border border-[#EAECF0] rounded-2xl shadow-sm overflow-hidden">
        {/* Progress Bar & Header */}
        <div className="bg-[#F8FAFC] px-8 py-4 border-b border-[#EAECF0] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
              {step}
            </span>
            <span className="text-xs font-bold text-slate-800">
              {step === 1 && 'Step 1: Administrator Profile'}
              {step === 2 && 'Step 2: Company Information'}
              {step === 3 && 'Step 3: Project & Team Launch'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-400">Step {step} of 3</span>
            <div className="w-24 bg-slate-200 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${(step / 3) * 100}%` }}
              />
            </div>
          </div>
        </div>

        <div className="p-8 space-y-6">
          {/* STEP 1: Administrator Information */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-blue-600">
                <UserCheck className="w-5 h-5" />
                <span className="text-xs font-bold uppercase tracking-wider">Admin Profile</span>
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">Tell us about yourself</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  As the workspace administrator, your profile will be used for system notifications and member invites.
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <Input
                  label="Full Name *"
                  placeholder="e.g. Sarah Jenkins"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  required
                />

                <Input
                  label="Contact Phone Number *"
                  placeholder="e.g. +1 (555) 234-5678"
                  type="tel"
                  value={adminPhone}
                  onChange={(e) => setAdminPhone(e.target.value)}
                  leftIcon={<Phone className="w-3.5 h-3.5 text-slate-400" />}
                  required
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Job Title / Role *"
                    placeholder="e.g. VP of Engineering"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    leftIcon={<Briefcase className="w-3.5 h-3.5 text-slate-400" />}
                    required
                  />

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Department *</label>
                    <select
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full bg-[#F8FAFC] border border-[#EAECF0] rounded-lg px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-blue-600 focus:bg-white"
                    >
                      <option value="Leadership">Executive / Leadership</option>
                      <option value="Engineering">Software Engineering</option>
                      <option value="Product">Product Management</option>
                      <option value="IT & DevOps">IT & Infrastructure</option>
                      <option value="Operations">Operations & Business</option>
                      <option value="Design">Product Design</option>
                      <option value="Customer Support">Customer Support</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Company Information */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-blue-600">
                <Building2 className="w-5 h-5" />
                <span className="text-xs font-bold uppercase tracking-wider">Company Identity</span>
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">What is your company or team name?</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  This will be your dedicated workspace on QubixDesk.
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <Input
                  label="Company / Organization Name *"
                  placeholder="e.g. Acme Innovations Inc."
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Industry *</label>
                    <select
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                      className="w-full bg-[#F8FAFC] border border-[#EAECF0] rounded-lg px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-blue-600 focus:bg-white"
                    >
                      <option value="Technology & SaaS">Technology & SaaS</option>
                      <option value="IT & Cloud Services">IT & Cloud Services</option>
                      <option value="Digital Agency">Digital Agency</option>
                      <option value="FinTech & Banking">FinTech & Banking</option>
                      <option value="Healthcare & Bio">Healthcare & Bio</option>
                      <option value="E-Commerce & Retail">E-Commerce & Retail</option>
                      <option value="Education">Education</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Organization Size *</label>
                    <select
                      value={size}
                      onChange={(e) => setSize(e.target.value)}
                      className="w-full bg-[#F8FAFC] border border-[#EAECF0] rounded-lg px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-blue-600 focus:bg-white"
                    >
                      <option value="1-10">1 - 10 people</option>
                      <option value="11-50">11 - 50 people</option>
                      <option value="51-200">51 - 200 people</option>
                      <option value="201-1000">201 - 1000 people</option>
                      <option value="1000+">1000+ enterprise</option>
                    </select>
                  </div>
                </div>

                <Input
                  label="Company Website (optional)"
                  placeholder="https://acme.com"
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* STEP 3: Setup Project & Launch 14-Day Full Access Trial */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-blue-600">
                <Sparkles className="w-5 h-5" />
                <span className="text-xs font-bold uppercase tracking-wider">Ready to Launch</span>
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">Set up your primary project workspace</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Projects hold tickets, Kanban columns, SLA tracking, and team members.
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <Input
                      label="Primary Project Name *"
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Input
                      label="Key Prefix *"
                      value={projectKey}
                      onChange={(e) => setProjectKey(e.target.value.toUpperCase())}
                      maxLength={6}
                      placeholder="DEV"
                      required
                    />
                  </div>
                </div>

                <Input
                  label="Invite Team Members (optional, comma-separated)"
                  placeholder="colleague1@company.com, colleague2@company.com"
                  value={inviteEmails}
                  onChange={(e) => setInviteEmails(e.target.value)}
                />

                {/* 14-Day Free Trial Full Access Card */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50/70 border border-blue-200/80 rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-2 text-blue-700">
                    <ShieldCheck className="w-4 h-4" />
                    <span className="font-bold text-xs">Included: 14-Day Full Access Free Trial</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Enjoy unlimited access to all QubixDesk features: real-time Kanban board, automated workflows, custom SLA policies, and priority performance. No credit card required.
                  </p>
                  <div className="flex items-center gap-4 pt-1 text-[11px] text-blue-800 font-semibold flex-wrap">
                    <span className="flex items-center gap-1"><Check className="w-3.5 h-3.5 text-blue-600" /> Full Features Unlocked</span>
                    <span className="flex items-center gap-1"><Check className="w-3.5 h-3.5 text-blue-600" /> No Card Required</span>
                    <span className="flex items-center gap-1"><Check className="w-3.5 h-3.5 text-blue-600" /> Instant Team Setup</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="flex items-center justify-between pt-4 border-t border-[#EAECF0]">
            {step > 1 ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStep((s) => s - 1)}
                leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
              >
                Back
              </Button>
            ) : <div />}

            {step < 3 ? (
              <Button
                size="sm"
                onClick={handleNext}
                rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
              >
                Continue
              </Button>
            ) : (
              <Button
                size="sm"
                variant="primary"
                isLoading={isSubmitting}
                onClick={handleFinish}
                rightIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
              >
                Launch Workspace (14-Day Trial)
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
