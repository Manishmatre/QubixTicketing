import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../api/client';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import {
  Building2,
  Globe,
  CreditCard,
  UserPlus,
  FolderKanban,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';

export const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const { reloadUser } = useAuth();
  const [step, setStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Form State across steps
  const [orgName, setOrgName] = useState<string>('');
  const [slug, setSlug] = useState<string>('');
  const [industry, setIndustry] = useState<string>('Technology');
  const [size, setSize] = useState<string>('1-10');
  const [plan, setPlan] = useState<string>('professional');
  const [inviteEmails, setInviteEmails] = useState<string>('');
  const [projectName, setProjectName] = useState<string>('Core Development');
  const [projectKey, setProjectKey] = useState<string>('DEV');
  const [firstTicketTitle, setFirstTicketTitle] = useState<string>('Configure initial environment and CI/CD pipelines');
  const [firstTicketPriority, setFirstTicketPriority] = useState<string>('High');

  const handleNext = () => {
    if (step === 1 && !orgName) {
      alert('Please enter an organization name.');
      return;
    }
    if (step === 2 && !slug) {
      alert('Please enter a workspace URL slug.');
      return;
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

      const res = await apiClient.post('/organizations/onboarding', {
        organizationName: orgName,
        slug,
        industry,
        size,
        subscriptionPlan: plan,
        invitedEmails: emails,
        projectName,
        projectKey,
        firstTicketTitle,
        firstTicketPriority,
      });

      if (res.data.success) {
        await reloadUser();
        navigate('/workspace/dashboard');
      }
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Onboarding failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center items-center p-6">
      <div className="w-full max-w-xl bg-white border border-slate-200 rounded-2xl shadow-card overflow-hidden">
        {/* Progress Bar */}
        <div className="bg-slate-50 px-8 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
              {step}
            </span>
            <span className="text-xs font-bold text-slate-700">Step {step} of 5</span>
          </div>
          <div className="w-32 bg-slate-200 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${(step / 5) * 100}%` }}
            />
          </div>
        </div>

        <div className="p-8 space-y-6">
          {/* Step 1: Company Name */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-blue-600">
                <Building2 className="w-5 h-5" />
                <span className="text-xs font-bold uppercase tracking-wider">Company Identity</span>
              </div>
              <h2 className="text-xl font-extrabold text-slate-900">What is your company or team name?</h2>
              <p className="text-xs text-slate-500">
                This will be your shared team workspace on QUBIX.
              </p>
              <Input
                label="Organization Name"
                placeholder="e.g. Acme Innovations"
                value={orgName}
                onChange={(e) => {
                  setOrgName(e.target.value);
                  if (!slug) {
                    setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 20));
                  }
                }}
                required
              />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Industry</label>
                  <select
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-600"
                  >
                    <option value="Technology">Technology & SaaS</option>
                    <option value="IT Services">IT Services</option>
                    <option value="Agency">Digital Agency</option>
                    <option value="Construction">Construction</option>
                    <option value="Education">Education</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Team Size</label>
                  <select
                    value={size}
                    onChange={(e) => setSize(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-600"
                  >
                    <option value="1-10">1 - 10 people</option>
                    <option value="11-50">11 - 50 people</option>
                    <option value="51-200">51 - 200 people</option>
                    <option value="200+">200+ people</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Slug */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-blue-600">
                <Globe className="w-5 h-5" />
                <span className="text-xs font-bold uppercase tracking-wider">Workspace URL</span>
              </div>
              <h2 className="text-xl font-extrabold text-slate-900">Choose your workspace address</h2>
              <p className="text-xs text-slate-500">
                Team members will sign in and collaborate using this unique URL slug.
              </p>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Workspace Slug</label>
                <div className="flex items-center">
                  <span className="bg-slate-100 border border-r-0 border-slate-300 rounded-l-lg px-3 py-2 text-xs text-slate-500">
                    qubix.io/
                  </span>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    placeholder="acme"
                    className="w-full bg-white border border-slate-300 rounded-r-lg px-3 py-2 text-sm font-mono text-slate-900 outline-none focus:border-blue-600"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Subscription Plan */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-blue-600">
                <CreditCard className="w-5 h-5" />
                <span className="text-xs font-bold uppercase tracking-wider">Select Trial Plan</span>
              </div>
              <h2 className="text-xl font-extrabold text-slate-900">Choose your 14-day free trial tier</h2>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'starter', name: 'Starter', price: '$19/mo', desc: 'Up to 5 seats, 3 projects' },
                  { id: 'professional', name: 'Professional', price: '$49/mo', desc: 'Up to 25 seats, workflows' },
                  { id: 'business', name: 'Business', price: '$129/mo', desc: 'Up to 100 seats, analytics' },
                  { id: 'enterprise', name: 'Enterprise', price: '$399/mo', desc: 'Custom governance' },
                ].map((p) => (
                  <div
                    key={p.id}
                    onClick={() => setPlan(p.id)}
                    className={`border rounded-xl p-3.5 cursor-pointer transition-all ${
                      plan === p.id
                        ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-500/20'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-xs text-slate-900">{p.name}</span>
                      <span className="text-[11px] font-semibold text-blue-600">{p.price}</span>
                    </div>
                    <p className="text-[11px] text-slate-500">{p.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: First Project */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-blue-600">
                <FolderKanban className="w-5 h-5" />
                <span className="text-xs font-bold uppercase tracking-wider">First Project</span>
              </div>
              <h2 className="text-xl font-extrabold text-slate-900">Set up your primary project</h2>
              <p className="text-xs text-slate-500">
                Projects hold all your issues, Kanban columns, and tasks.
              </p>
              <Input
                label="Project Name *"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                required
              />
              <Input
                label="Project Prefix Key (e.g. CORE, DEV) *"
                value={projectKey}
                onChange={(e) => setProjectKey(e.target.value.toUpperCase())}
                maxLength={6}
                required
              />
            </div>
          )}

          {/* Step 5: First Ticket & Team */}
          {step === 5 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-blue-600">
                <Sparkles className="w-5 h-5" />
                <span className="text-xs font-bold uppercase tracking-wider">Ready to Launch</span>
              </div>
              <h2 className="text-xl font-extrabold text-slate-900">Create your initial ticket</h2>
              <Input
                label="First Ticket Title *"
                value={firstTicketTitle}
                onChange={(e) => setFirstTicketTitle(e.target.value)}
                required
              />
              <Input
                label="Invite Colleague Emails (optional, comma-separated)"
                placeholder="dev1@company.com, dev2@company.com"
                value={inviteEmails}
                onChange={(e) => setInviteEmails(e.target.value)}
              />
            </div>
          )}

          {/* Navigation Controls */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            {step > 1 ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStep((s) => s - 1)}
                leftIcon={<ArrowLeft className="w-4 h-4" />}
              >
                Back
              </Button>
            ) : <div />}

            {step < 5 ? (
              <Button
                size="sm"
                onClick={handleNext}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Continue
              </Button>
            ) : (
              <Button
                size="sm"
                variant="primary"
                isLoading={isSubmitting}
                onClick={handleFinish}
                rightIcon={<CheckCircle2 className="w-4 h-4" />}
              >
                Launch Workspace
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

