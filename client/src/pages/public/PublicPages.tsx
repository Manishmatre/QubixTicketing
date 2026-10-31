import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import {
  Layers,
  Kanban,
  Zap,
  ShieldCheck,
  BarChart3,
  Users,
  Check,
  ArrowRight,
  Sparkles,
  Lock,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Clock,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const faqs = [
    {
      q: 'How does QUBIX ensure multi-tenant security?',
      a: 'Each organization has an isolated database context keyed with strict organizationId tenant validation enforced in server middleware and MongoDB query isolation layers. Cross-tenant data leaks are mathematically prevented.',
    },
    {
      q: 'Can clients or external reporters submit tickets without seeing internal notes?',
      a: 'Yes. QUBIX includes dedicated Reporter and Client roles. Internal engineering discussions and notes are strictly hidden from external parties.',
    },
    {
      q: 'Does QUBIX include real-time collaboration?',
      a: 'Yes! Real-time Socket.IO synchronization instantly broadcasts ticket status updates, comments, and notifications across your team with zero latency.',
    },
    {
      q: 'Can we automate workflows when urgent bugs arrive?',
      a: 'Yes. The built-in workflow engine lets you automatically assign engineers, dispatch notifications, or update tags when priorities or statuses change.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col">
      {/* Public Navbar */}
      <header className="h-18 bg-white/80 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-40 px-8 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/20">
              <Layers className="w-5 h-5" />
            </div>
            <span className="text-xl font-extrabold tracking-tight text-slate-900">QUBIX</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-600">
            <a href="#features" className="hover:text-blue-600 transition-colors">Features</a>
            <a href="#solutions" className="hover:text-blue-600 transition-colors">Solutions</a>
            <a href="#pricing" className="hover:text-blue-600 transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-blue-600 transition-colors">FAQ</a>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/login">
            <Button variant="ghost" size="sm">Sign In</Button>
          </Link>
          <Link to="/register">
            <Button size="sm">Start Free Trial</Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-20 pb-16 px-6 max-w-6xl mx-auto text-center space-y-6">
        <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 px-3 py-1 rounded-full text-xs font-bold tracking-wide animate-fade-in">
          <Sparkles className="w-3.5 h-3.5" />
          Enterprise Multi-Tenant Issue Tracking & Ticketing Platform
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15] max-w-4xl mx-auto">
          Bring Every Project, Ticket & Team Into{' '}
          <span className="text-blue-600">One Workspace.</span>
        </h1>

        <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          QUBIX helps modern engineering and product teams report issues, manage sprints, collaborate faster, and deliver work with complete visibility.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <Link to="/register">
            <Button size="lg" rightIcon={<ArrowRight className="w-4 h-4" />}>
              Start Free Trial (14 Days)
            </Button>
          </Link>
          <Link to="/login">
            <Button size="lg" variant="outline">
              Sign In to Demo Workspace
            </Button>
          </Link>
        </div>

        {/* Dashboard Preview Frame matching Reference Image */}
        <div className="mt-12 rounded-2xl border border-slate-200/90 bg-white p-3 shadow-2xl shadow-slate-200/60 max-w-5xl mx-auto text-left overflow-hidden">
          <div className="bg-slate-100 rounded-t-xl px-4 py-2.5 flex items-center gap-2 border-b border-slate-200/80">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-amber-400" />
              <div className="w-3 h-3 rounded-full bg-emerald-400" />
            </div>
            <span className="text-xs font-mono text-slate-400 ml-2">qubix.io/acme-corp/kanban</span>
          </div>

          <div className="p-6 bg-[#F8FAFC] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <span className="font-bold text-sm text-slate-900">Sprint Kanban Board</span>
                <span className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded font-mono font-semibold">
                  ECP • Enterprise Cloud Portal
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="bg-white border px-2 py-1 rounded shadow-2xs font-medium">To Do (3)</span>
                <span className="bg-white border px-2 py-1 rounded shadow-2xs font-medium">In Progress (2)</span>
                <span className="bg-white border px-2 py-1 rounded shadow-2xs font-medium">Resolved (3)</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 text-xs">
              {/* To Do Card Preview */}
              <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-subtle space-y-2">
                <div className="flex justify-between">
                  <span className="font-mono text-blue-600 font-bold">QUB-000102</span>
                  <span className="bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded text-[10px] font-bold">High</span>
                </div>
                <p className="font-semibold text-slate-800">OAuth2 GitHub SSO Integration</p>
                <div className="flex justify-between text-slate-400 text-[10px] pt-2 border-t">
                  <span>Due in 7 days</span>
                  <span>💬 3</span>
                </div>
              </div>

              {/* In Progress Card Preview */}
              <div className="bg-white border border-blue-400 rounded-xl p-3.5 shadow-card space-y-2 ring-1 ring-blue-500/20">
                <div className="flex justify-between">
                  <span className="font-mono text-blue-600 font-bold">QUB-000101</span>
                  <span className="bg-red-50 text-red-700 px-1.5 py-0.5 rounded text-[10px] font-bold">Critical</span>
                </div>
                <p className="font-semibold text-slate-800">High latency on replica queries during peak load</p>
                <div className="flex justify-between text-slate-400 text-[10px] pt-2 border-t">
                  <span>Due in 2 days</span>
                  <span>💬 5 • 📎 2</span>
                </div>
              </div>

              {/* Resolved Card Preview */}
              <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-subtle space-y-2">
                <div className="flex justify-between">
                  <span className="font-mono text-blue-600 font-bold">QUB-000103</span>
                  <span className="bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded text-[10px] font-bold">Resolved</span>
                </div>
                <p className="font-semibold text-slate-800">Rotate stale JWT refresh tokens</p>
                <div className="flex justify-between text-slate-400 text-[10px] pt-2 border-t">
                  <span>Completed</span>
                  <span>💬 2</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Section */}
      <section id="features" className="py-20 bg-white border-y border-slate-200 px-8">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-xs font-bold text-blue-600 uppercase tracking-wider">Features Built For Speed</h2>
            <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Enterprise Grade Power, Consumer Grade Simplicity
            </h3>
            <p className="text-xs text-slate-500">
              Everything your organization needs to eliminate bottlenecks and resolve tickets faster.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                <Kanban className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-slate-900">Interactive Kanban Boards</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Smooth drag-and-drop workflow with instant optimistic updates, column counters, and real-time socket syncing across all open browsers.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-slate-900">Multi-Tenant Isolation</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Strict organization boundaries in middleware and database query layers ensure zero data leakage between different companies and clients.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                <Zap className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-slate-900">Workflow Automation</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Configure conditional actions to auto-assign engineers, notify leads on critical issues, or apply tags without manual effort.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-8 max-w-6xl mx-auto space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <h2 className="text-xs font-bold text-blue-600 uppercase tracking-wider">Transparent SaaS Pricing</h2>
          <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Plans That Scale With Your Team
          </h3>
          <p className="text-xs text-slate-500">
            Start free with a 14-day trial. No surprise lock-ins.
          </p>

          <div className="inline-flex bg-slate-100 p-1 rounded-lg text-xs font-semibold mt-4">
            <button
              onClick={() => setBillingInterval('monthly')}
              className={`px-3 py-1 rounded transition-all ${
                billingInterval === 'monthly' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingInterval('yearly')}
              className={`px-3 py-1 rounded transition-all ${
                billingInterval === 'yearly' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
              }`}
            >
              Yearly (Save 20%)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-xs">
          {[
            {
              name: 'Starter',
              price: billingInterval === 'yearly' ? 15 : 19,
              desc: 'For small agile teams launching their issue tracking.',
              features: ['Up to 5 team seats', '3 active projects', 'Kanban & List views', 'Standard ticket workflows', 'Community support'],
            },
            {
              name: 'Professional',
              price: billingInterval === 'yearly' ? 39 : 49,
              desc: 'For growing teams requiring robust workflow automation.',
              features: ['Up to 25 team seats', '20 active projects', 'Automation workflow engine', 'Custom ticket fields', 'Email notifications', 'Priority support'],
              popular: true,
            },
            {
              name: 'Business',
              price: billingInterval === 'yearly' ? 99 : 129,
              desc: 'High velocity companies scaling multiple project departments.',
              features: ['Up to 100 team seats', 'Unlimited projects', 'Advanced analytics & PDF reports', 'Full audit logs', 'Custom RBAC permissions', '99.9% uptime SLA'],
            },
            {
              name: 'Enterprise',
              price: billingInterval === 'yearly' ? 319 : 399,
              desc: 'Large organizations with dedicated governance & SLA requirements.',
              features: ['Unlimited team seats', 'Unlimited storage', 'Dedicated account manager', 'Custom integrations', 'SSO & SAML ready', 'Custom data retention'],
            },
          ].map((plan) => (
            <div
              key={plan.name}
              className={`bg-white border rounded-2xl p-6 shadow-subtle flex flex-col justify-between ${
                plan.popular ? 'border-blue-600 ring-2 ring-blue-500/20 shadow-card' : 'border-slate-200'
              }`}
            >
              <div>
                <div className="flex justify-between items-center mb-1">
                  <h4 className="font-bold text-sm text-slate-900">{plan.name}</h4>
                  {plan.popular && (
                    <span className="text-[10px] font-bold uppercase bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                      Popular
                    </span>
                  )}
                </div>
                <p className="text-slate-500 text-[11px] h-8 leading-snug">{plan.desc}</p>
                <div className="my-4 flex items-baseline">
                  <span className="text-3xl font-extrabold text-slate-900">${plan.price}</span>
                  <span className="text-slate-400 ml-1">/ month</span>
                </div>
                <div className="space-y-2 border-t border-slate-100 pt-4">
                  {plan.features.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 text-slate-700">
                      <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100">
                <Link to="/register">
                  <Button variant={plan.popular ? 'primary' : 'outline'} className="w-full">
                    Start 14-Day Free Trial
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-16 bg-white border-t border-slate-200 px-8">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <h3 className="text-2xl font-bold text-slate-900">Frequently Asked Questions</h3>
            <p className="text-xs text-slate-500">Everything you need to know about getting started with QUBIX.</p>
          </div>

          <div className="space-y-3">
            {faqs.map((f, i) => (
              <div
                key={i}
                onClick={() => toggleFaq(i)}
                className="border border-slate-200 rounded-xl p-4 cursor-pointer hover:border-slate-300 transition-colors bg-slate-50/50"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900">{f.q}</h4>
                  {openFaq === i ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </div>
                {openFaq === i && (
                  <p className="text-xs text-slate-600 mt-2.5 leading-relaxed pt-2 border-t border-slate-200/60">
                    {f.a}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 py-10 px-8 bg-slate-900 text-slate-400 text-xs">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-xs">
              Q
            </div>
            <span className="font-bold text-white text-sm">QUBIX SaaS</span>
            <span className="text-slate-500 ml-2">© 2026 QUBIX Technologies Inc. All rights reserved.</span>
          </div>

          <div className="flex gap-6">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <Link to="/login" className="hover:text-white transition-colors">Sign In</Link>
            <Link to="/register" className="hover:text-white transition-colors">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    const res = await login(email, password);
    setIsLoading(false);
    if (res.success) {
      navigate('/workspace/dashboard');
    } else {
      setError(res.error || 'Login failed');
    }
  };

  const fillDemoOwner = () => {
    setEmail('sarah.jenkins@acme.com');
    setPassword('Password123!');
  };

  const fillSuperAdmin = () => {
    setEmail('admin@qubix.io');
    setPassword('Password123!');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center items-center p-6">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-card p-8 space-y-6">
        <div className="text-center space-y-1">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold mx-auto shadow-md shadow-blue-500/20 mb-3">
            <Layers className="w-5 h-5" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Sign in to QUBIX</h2>
          <p className="text-xs text-slate-500">Access your organization issue tracking workspace</p>
        </div>

        {/* Demo Fast-fill Buttons for seamless evaluation */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2 text-xs">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Quick Fill Demo Accounts:</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={fillDemoOwner}
              className="flex-1 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-blue-700 py-1.5 px-2 rounded-lg font-semibold text-[11px] transition-colors"
            >
              Acme Owner
            </button>
            <button
              type="button"
              onClick={fillSuperAdmin}
              className="flex-1 bg-white hover:bg-purple-50 border border-slate-200 hover:border-purple-300 text-purple-700 py-1.5 px-2 rounded-lg font-semibold text-[11px] transition-colors"
            >
              Platform Super Admin
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <Input
            label="Work Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@company.com"
            required
          />

          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••••"
            required
          />

          <Button type="submit" variant="primary" className="w-full text-xs" isLoading={isLoading}>
            Sign In
          </Button>
        </form>

        <p className="text-center text-xs text-slate-500">
          Don't have an organization workspace?{' '}
          <Link to="/register" className="text-blue-600 font-semibold hover:underline">
            Start Free Trial
          </Link>
        </p>
      </div>
    </div>
  );
};

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [orgName, setOrgName] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    const res = await register(name, email, password, orgName);
    setIsLoading(false);
    if (res.success) {
      navigate('/onboarding');
    } else {
      setError(res.error || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center items-center p-6">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-card p-8 space-y-6">
        <div className="text-center space-y-1">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold mx-auto shadow-md shadow-blue-500/20 mb-3">
            <Layers className="w-5 h-5" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Create your workspace</h2>
          <p className="text-xs text-slate-500">14-day full feature trial • No credit card required</p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <Input
            label="Your Full Name *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Sarah Jenkins"
            required
          />

          <Input
            label="Company / Team Name *"
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            placeholder="Acme Technologies"
            required
          />

          <Input
            label="Work Email *"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="sarah@acme.com"
            required
          />

          <Input
            label="Password *"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            required
          />

          <Button type="submit" variant="primary" className="w-full text-xs" isLoading={isLoading}>
            Create Company Workspace
          </Button>
        </form>

        <p className="text-center text-xs text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-600 font-semibold hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};

