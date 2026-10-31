import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../api/client';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import {
  Building2,
  FolderKanban,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Briefcase,
  Layers,
  ShieldCheck,
  Check,
  Zap,
  Globe,
  Radio,
} from 'lucide-react';

export const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, reloadUser } = useAuth();
  const [step, setStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isCelebrating, setIsCelebrating] = useState<boolean>(false);
  const [celebrateStep, setCelebrateStep] = useState<number>(0);

  // Step 1: Workspace & Company Setup
  const [companyName, setCompanyName] = useState<string>('');
  const [jobTitle, setJobTitle] = useState<string>(user?.designation || 'Founder & Administrator');
  const [department, setDepartment] = useState<string>('Engineering');
  const [industry, setIndustry] = useState<string>('Technology & SaaS');
  const [size, setSize] = useState<string>('11-50');
  const [website, setWebsite] = useState<string>('');

  // Step 2: Project & Team Launch
  const [projectName, setProjectName] = useState<string>('Core Development');
  const [projectKey, setProjectKey] = useState<string>('DEV');
  const [inviteEmails, setInviteEmails] = useState<string>('');

  // Generated workspace slug
  const generatedSlug = companyName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 30);

  const handleNext = () => {
    if (step === 1) {
      if (!companyName.trim()) {
        alert('Please enter your company or workspace name.');
        return;
      }
      if (!jobTitle.trim()) {
        alert('Please enter your role or designation.');
        return;
      }
      setStep(2);
    }
  };

  const handleFinish = async () => {
    if (!projectName.trim() || !projectKey.trim()) {
      alert('Please provide a project name and uppercase key.');
      return;
    }

    setIsSubmitting(true);
    try {
      const emails = inviteEmails
        .split(',')
        .map((e) => e.trim())
        .filter(Boolean);

      const res = await apiClient.post('/organizations/onboarding', {
        organizationName: companyName.trim(),
        slug: generatedSlug || 'workspace',
        industry,
        size,
        website: website.trim(),
        phoneNumber: user?.phoneNumber || '',
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
        // Trigger celebratory animated welcome overlay
        setIsCelebrating(true);

        // Sequence of progress checklist items
        setTimeout(() => setCelebrateStep(1), 500);
        setTimeout(() => setCelebrateStep(2), 1100);
        setTimeout(() => setCelebrateStep(3), 1700);
        setTimeout(() => setCelebrateStep(4), 2300);

        // Seamless transition to the dashboard
        setTimeout(async () => {
          await reloadUser();
          navigate('/workspace/dashboard', { replace: true });
        }, 3000);
      }
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Onboarding setup failed. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center items-center p-6 font-sans relative overflow-hidden">
      {/* Background Decorative Accents */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-gradient-to-b from-blue-100/50 via-indigo-50/20 to-transparent blur-3xl pointer-events-none -z-10" />

      {/* Brand Header */}
      <div className="mb-6 text-center">
        <img
          src="/logo.png"
          alt="QubixDesk"
          className="h-10 mx-auto object-contain"
        />
        <p className="text-xs text-slate-500 mt-1 font-medium">
          Work Smarter. Track Better. Deliver Faster.
        </p>
      </div>

      <div className="w-full max-w-xl bg-white border border-[#EAECF0] rounded-2xl shadow-subtle overflow-hidden relative">
        {/* Progress Bar & Header */}
        <div className="bg-[#F8FAFC] px-8 py-4 border-b border-[#EAECF0] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
              {step}
            </span>
            <span className="text-xs font-bold text-slate-800">
              {step === 1 && 'Step 1: Workspace & Company Setup'}
              {step === 2 && 'Step 2: Project & Team Launch'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-400">Step {step} of 2</span>
            <div className="w-24 bg-slate-200 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${(step / 2) * 100}%` }}
              />
            </div>
          </div>
        </div>

        <div className="p-8 space-y-6">
          {/* STEP 1: Workspace & Company Setup */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 text-blue-600">
                <Building2 className="w-5 h-5" />
                <span className="text-xs font-bold uppercase tracking-wider">Workspace Setup</span>
              </div>

              <div>
                <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                  Welcome{user?.name ? `, ${user.name}` : ''}! Let's set up your workspace
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Configure your dedicated multi-tenant organization and executive designation.
                </p>
              </div>

              <div className="space-y-4 pt-1">
                <div>
                  <Input
                    label="Company / Workspace Name *"
                    placeholder="e.g. Acme Cloud Innovations"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    required
                  />
                  {companyName && (
                    <p className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1 font-mono">
                      <Globe className="w-3 h-3 text-blue-500" />
                      Workspace URL: <span className="text-blue-600 font-bold">qubixdesk.toolio.tech/workspace/{generatedSlug}</span>
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Your Role / Designation *"
                    placeholder="e.g. CTO & Co-Founder"
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
                      <option value="Executive">Executive Leadership</option>
                      <option value="Engineering">Software Engineering</option>
                      <option value="Product">Product Management</option>
                      <option value="DevOps">DevOps & Cloud Operations</option>
                      <option value="Support">Customer Support & Helpdesk</option>
                      <option value="Design">UI/UX & Product Design</option>
                      <option value="Operations">Operations & Business</option>
                    </select>
                  </div>
                </div>

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
                  placeholder="https://yourcompany.com"
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* STEP 2: Project & Team Launch */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 text-blue-600">
                <Sparkles className="w-5 h-5" />
                <span className="text-xs font-bold uppercase tracking-wider">Ready to Launch</span>
              </div>

              <div>
                <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                  Set up your primary project workspace
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Projects hold sprint Kanban boards, SLA automation policies, and team tickets.
                </p>
              </div>

              <div className="space-y-4 pt-1">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <Input
                      label="Primary Project Name *"
                      placeholder="e.g. Core Engineering"
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      leftIcon={<FolderKanban className="w-3.5 h-3.5 text-slate-400" />}
                      required
                    />
                  </div>
                  <div>
                    <Input
                      label="Key Prefix *"
                      placeholder="DEV"
                      value={projectKey}
                      onChange={(e) => setProjectKey(e.target.value.toUpperCase().slice(0, 5))}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Invite Teammates (optional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="teammate@company.com, engineer@company.com"
                    value={inviteEmails}
                    onChange={(e) => setInviteEmails(e.target.value)}
                    className="w-full bg-[#F8FAFC] border border-[#EAECF0] rounded-lg p-3 text-xs font-mono text-slate-800 outline-none focus:border-blue-600 focus:bg-white resize-none"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Comma-separated emails. They will receive instant access invites with secure magic tokens.
                  </p>
                </div>

                {/* 14-Day Free Full Access Pro Trial Banner */}
                <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50/80 border border-blue-200/90 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-blue-800 font-bold text-xs">
                    <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>14-Day Full Access Pro Trial Active</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Enjoy unlimited tickets, automated SLA countdown triggers, live socket sync, and full-resolution telemetry. No credit card required.
                  </p>
                  <div className="flex items-center gap-4 text-[10px] text-blue-700 font-semibold pt-1">
                    <span className="flex items-center gap-1"><Check className="w-3 h-3 text-emerald-600" /> Real-time Kanban</span>
                    <span className="flex items-center gap-1"><Check className="w-3 h-3 text-emerald-600" /> Automated SLA</span>
                    <span className="flex items-center gap-1"><Check className="w-3 h-3 text-emerald-600" /> Zero Cross-Tenant Leakage</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-4 border-t border-[#EAECF0] flex items-center justify-between">
            {step > 1 ? (
              <Button
                type="button"
                variant="ghost"
                onClick={() => setStep(step - 1)}
                className="text-xs font-semibold"
                disabled={isSubmitting}
              >
                <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
                Back
              </Button>
            ) : (
              <div />
            )}

            {step < 2 ? (
              <Button
                type="button"
                variant="primary"
                onClick={handleNext}
                className="text-xs font-bold px-6 py-2.5"
              >
                Next: Project Setup &rarr;
              </Button>
            ) : (
              <Button
                type="button"
                variant="primary"
                onClick={handleFinish}
                isLoading={isSubmitting}
                className="text-xs font-bold px-7 py-2.5 shadow-lg shadow-blue-500/20"
              >
                Complete Setup & Launch &rarr;
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* CELEBRATORY ANIMATED WELCOME SCREEN */}
      {isCelebrating && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-white text-center animate-fadeIn">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl shadow-blue-500/10 space-y-6 relative overflow-hidden">
            {/* Top Glowing Orb */}
            <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />

            {/* Glowing Trophy / Sparkle Icon */}
            <div className="w-20 h-20 bg-gradient-to-tr from-blue-600 to-emerald-500 text-white rounded-3xl flex items-center justify-center mx-auto shadow-xl shadow-blue-500/25 ring-8 ring-blue-500/10 animate-bounce">
              <Sparkles className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-black tracking-tight text-white">
                🎉 Welcome to QubixDesk!
              </h2>
              <p className="text-xs text-slate-400">
                Setting up your isolated workspace: <strong className="text-blue-400">{companyName}</strong>
              </p>
            </div>

            {/* Step-by-step Animated Checklist */}
            <div className="space-y-3 text-left text-xs bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${celebrateStep >= 1 ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-500'}`}>
                  {celebrateStep >= 1 ? '✓' : '1'}
                </span>
                <span className={celebrateStep >= 1 ? 'text-slate-200 font-semibold' : 'text-slate-500'}>
                  Workspace isolated and provisioned
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${celebrateStep >= 2 ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-500'}`}>
                  {celebrateStep >= 2 ? '✓' : '2'}
                </span>
                <span className={celebrateStep >= 2 ? 'text-slate-200 font-semibold' : 'text-slate-500'}>
                  Multi-tenant data encryption active
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${celebrateStep >= 3 ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-500'}`}>
                  {celebrateStep >= 3 ? '✓' : '3'}
                </span>
                <span className={celebrateStep >= 3 ? 'text-slate-200 font-semibold' : 'text-slate-500'}>
                  Real-time event stream & socket connected
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${celebrateStep >= 4 ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-500 animate-pulse'}`}>
                  {celebrateStep >= 4 ? '✓' : '•'}
                </span>
                <span className={celebrateStep >= 4 ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                  Launching your executive dashboard...
                </span>
              </div>
            </div>

            {/* Glowing animated progress bar */}
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-500 to-emerald-400 h-2 rounded-full transition-all duration-500"
                style={{ width: `${(celebrateStep / 4) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
