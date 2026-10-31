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
  CheckCircle2,
  AlertTriangle,
  FileText,
  Workflow,
  Globe2,
  TrendingUp,
  Cpu,
  Mail,
  Send,
  Star,
  ExternalLink,
  Sliders,
  Shield,
  Layers2,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [activeDemoTab, setActiveDemoTab] = useState<'kanban' | 'drawer' | 'workflow' | 'analytics'>('kanban');

  // Contact / Demo form state
  const [demoName, setDemoName] = useState('');
  const [demoEmail, setDemoEmail] = useState('');
  const [demoCompany, setDemoCompany] = useState('');
  const [demoSubmitted, setDemoSubmitted] = useState(false);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const handleDemoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (demoEmail) {
      setDemoSubmitted(true);
      setTimeout(() => {
        setDemoSubmitted(false);
        setDemoName('');
        setDemoEmail('');
        setDemoCompany('');
      }, 5000);
    }
  };

  const faqs = [
    {
      q: 'How does QubixDesk enforce true multi-tenant data isolation?',
      a: 'Every organization is provisioned with a mathematically isolated workspace. Tenant context is validated in backend middleware and injected directly into Mongoose database queries using compound indexes on { organizationId, _id }. Cross-tenant queries are blocked before reaching the database, ensuring zero possibility of cross-organization data leakage.',
    },
    {
      q: 'Can external clients or reporters view internal team comments?',
      a: 'Never. QubixDesk enforces strict role separation. Internal notes and discussion threads are accessible exclusively to internal employees, leads, and administrators. External reporters and clients see only sanitized public replies.',
    },
    {
      q: 'How do real-time updates work across team members?',
      a: 'QubixDesk runs a dedicated Socket.IO event engine. When a ticket is moved on the Kanban board, assigned, or updated, events are broadcast directly to the specific organization channel (org_${organizationId}). All team members see immediate updates on their screens without refreshing.',
    },
    {
      q: 'Can we automate assignments when critical or urgent bugs occur?',
      a: 'Yes! The QubixDesk Workflow Engine enables conditional rules without writing any code. For example, configure rules like: "IF Priority becomes Critical THEN Auto-Assign to Tech Lead AND send immediate email notification AND tag #escalated".',
    },
    {
      q: 'Can we export reports for management or executive audits?',
      a: 'Yes. Every workspace provides one-click export of ticket data to clean CSV spreadsheets as well as formatted PDF summary reports complete with SLA metrics, velocity charts, and status breakdowns.',
    },
    {
      q: 'How quickly can our team get started?',
      a: 'In less than 2 minutes. The guided 5-step onboarding wizard lets you name your organization, pick a workspace slug (qubixdesk.io/your-company), select a starter project, invite team members, and create your first ticket immediately.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col selection:bg-blue-100 selection:text-blue-900">
      {/* Top Announcement Ribbon */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-600 to-blue-800 text-white text-[11px] font-semibold py-2 px-4 text-center flex items-center justify-center gap-2">
        <Sparkles className="w-3.5 h-3.5 text-blue-200 shrink-0" />
        <span>
          Announcing <strong>QubixDesk 2.0</strong> — Multi-Tenant Architecture, SLA Automations, and Real-Time WebSocket Collaboration.
        </span>
        <Link to="/register" className="underline font-bold text-white hover:text-blue-100 ml-1">
          Explore Free &rarr;
        </Link>
      </div>

      {/* Public Navbar */}
      <header className="h-18 bg-white/85 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-40 px-6 sm:px-10 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center">
            <img
              src="/logo.png"
              alt="QubixDesk - Work Smarter. Track Better. Deliver Faster."
              className="h-9 sm:h-10 w-auto object-contain"
            />
          </Link>

          <nav className="hidden lg:flex items-center gap-7 text-xs font-semibold text-slate-600">
            <a href="#features" className="hover:text-blue-600 transition-colors">Features</a>
            <a href="#preview" className="hover:text-blue-600 transition-colors">Live Preview</a>
            <a href="#solutions" className="hover:text-blue-600 transition-colors">Solutions</a>
            <a href="#comparison" className="hover:text-blue-600 transition-colors">Comparison</a>
            <a href="#pricing" className="hover:text-blue-600 transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-blue-600 transition-colors">FAQ</a>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/login">
            <Button variant="ghost" size="sm" className="text-slate-700 font-semibold hover:text-blue-600">
              Sign In
            </Button>
          </Link>
          <Link to="/register">
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 text-xs font-bold px-4">
              Start Free Trial
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-20 pb-16 px-6 max-w-6xl mx-auto text-center space-y-6">
        <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200/80 text-blue-700 px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wide shadow-2xs">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Next-Generation Multi-Tenant Issue & Project Ticketing</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-slate-900 tracking-tight leading-[1.12] max-w-5xl mx-auto">
          Work Smarter. Track Better.{' '}
          <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 bg-clip-text text-transparent">
            Deliver Faster.
          </span>
        </h1>

        <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          QubixDesk unifies project management, issue tracking, and client helpdesk into one ultra-fast, multi-tenant workspace. Built with strict data isolation, real-time collaboration, and intelligent workflow automation.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-3">
          <Link to="/register">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/25 px-6 font-bold" rightIcon={<ArrowRight className="w-4 h-4" />}>
              Start Free Trial (14 Days)
            </Button>
          </Link>
          <a href="#preview">
            <Button size="lg" variant="outline" className="border-slate-300 font-semibold text-slate-700 hover:bg-slate-100">
              Explore Interactive Preview
            </Button>
          </a>
          <Link to="/login">
            <Button size="lg" variant="ghost" className="text-blue-700 font-semibold hover:bg-blue-50">
              Demo Workspace Login &rarr;
            </Button>
          </Link>
        </div>

        {/* Trust Badges */}
        <div className="pt-6 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs font-semibold text-slate-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Strict Tenant Isolation</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            <span>Real-Time WebSocket Sync</span>
          </div>
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-blue-600" />
            <span>Protected Internal Notes</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>99.99% Uptime SLA</span>
          </div>
        </div>

        {/* Interactive Product Demo Showcase Frame */}
        <div id="preview" className="mt-14 rounded-2xl border border-slate-200/90 bg-white p-3 shadow-2xl shadow-slate-200/60 max-w-5xl mx-auto text-left overflow-hidden">
          {/* Mock Browser Header */}
          <div className="bg-slate-100 rounded-t-xl px-4 py-2.5 flex items-center justify-between border-b border-slate-200/80">
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <div className="w-3 h-3 rounded-full bg-emerald-400" />
              </div>
              <span className="text-xs font-mono text-slate-500 ml-2 bg-white px-2 py-0.5 rounded border border-slate-200">
                qubixdesk.io/acme-corp/{activeDemoTab}
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-mono text-[11px] font-semibold text-slate-700">Live Socket Sync Active</span>
            </div>
          </div>

          {/* Interactive Demo Tab Bar */}
          <div className="bg-white border-b border-slate-200 px-4 flex gap-2 pt-2">
            {[
              { id: 'kanban', label: 'Interactive Kanban Board', icon: Kanban },
              { id: 'drawer', label: 'Ticket Drawer & Internal Notes', icon: FileText },
              { id: 'workflow', label: 'Workflow Automation Builder', icon: Workflow },
              { id: 'analytics', label: 'SLA & Velocity Analytics', icon: BarChart3 },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveDemoTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
                    activeDemoTab === tab.id
                      ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab 1: Kanban Board Preview */}
          {activeDemoTab === 'kanban' && (
            <div className="p-6 bg-[#F8FAFC] space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-sm text-slate-900">Sprint Kanban Board</span>
                  <span className="bg-blue-50 text-blue-700 text-xs px-2.5 py-0.5 rounded font-mono font-semibold border border-blue-200/60">
                    ECP • Enterprise Cloud Portal
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="bg-white border border-slate-200 px-2 py-1 rounded shadow-2xs font-semibold text-slate-700">To Do (3)</span>
                  <span className="bg-white border border-blue-200 px-2 py-1 rounded shadow-2xs font-semibold text-blue-700">In Progress (2)</span>
                  <span className="bg-white border border-emerald-200 px-2 py-1 rounded shadow-2xs font-semibold text-emerald-700">Resolved (3)</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                {/* To Do Column Preview */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-slate-500 text-[11px] font-bold uppercase tracking-wider px-1">
                    <span>To Do</span>
                    <span className="bg-slate-200 text-slate-700 rounded-full px-2 py-0.5 text-[10px]">3</span>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-subtle space-y-2 hover:border-slate-300 transition-colors">
                    <div className="flex justify-between items-center">
                      <span className="font-mono text-blue-600 font-bold">QUB-000102</span>
                      <span className="bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded text-[10px] font-bold border border-amber-200">High</span>
                    </div>
                    <p className="font-semibold text-slate-800">OAuth2 GitHub SSO Integration</p>
                    <div className="flex justify-between text-slate-400 text-[10px] pt-2 border-t">
                      <span className="flex items-center gap-1 text-slate-500"><Clock className="w-3 h-3" /> Due in 7 days</span>
                      <span>💬 3</span>
                    </div>
                  </div>
                </div>

                {/* In Progress Column Preview */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-blue-600 text-[11px] font-bold uppercase tracking-wider px-1">
                    <span>In Progress</span>
                    <span className="bg-blue-100 text-blue-700 rounded-full px-2 py-0.5 text-[10px]">2</span>
                  </div>
                  <div className="bg-white border border-blue-400 rounded-xl p-3.5 shadow-card space-y-2 ring-2 ring-blue-500/20">
                    <div className="flex justify-between items-center">
                      <span className="font-mono text-blue-600 font-bold">QUB-000101</span>
                      <span className="bg-red-50 text-red-700 px-1.5 py-0.5 rounded text-[10px] font-bold border border-red-200">Critical</span>
                    </div>
                    <p className="font-semibold text-slate-900">High latency on replica queries during peak reporting</p>
                    <div className="flex justify-between text-slate-400 text-[10px] pt-2 border-t border-slate-100">
                      <span className="text-red-600 font-medium flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> SLA: 4 hrs left</span>
                      <span>💬 5 • 📎 2</span>
                    </div>
                  </div>
                </div>

                {/* Resolved Column Preview */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-emerald-600 text-[11px] font-bold uppercase tracking-wider px-1">
                    <span>Resolved</span>
                    <span className="bg-emerald-100 text-emerald-700 rounded-full px-2 py-0.5 text-[10px]">3</span>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-subtle space-y-2 hover:border-slate-300 transition-colors">
                    <div className="flex justify-between items-center">
                      <span className="font-mono text-blue-600 font-bold">QUB-000103</span>
                      <span className="bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded text-[10px] font-bold border border-emerald-200">Resolved</span>
                    </div>
                    <p className="font-semibold text-slate-800">Rotate stale JWT refresh tokens</p>
                    <div className="flex justify-between text-slate-400 text-[10px] pt-2 border-t">
                      <span className="text-emerald-600 font-medium flex items-center gap-1"><Check className="w-3 h-3" /> Completed</span>
                      <span>💬 2</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Ticket Drawer & Internal Notes Preview */}
          {activeDemoTab === 'drawer' && (
            <div className="p-6 bg-[#F8FAFC] space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-blue-600" />
                      <span className="font-bold text-slate-800">Public Client Discussion</span>
                    </div>
                    <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-semibold">
                      Visible to Reporters
                    </span>
                  </div>
                  <div className="space-y-2.5">
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                      <div className="flex justify-between text-[11px] mb-1">
                        <strong className="text-slate-800">Acme Client Support</strong>
                        <span className="text-slate-400">10:14 AM</span>
                      </div>
                      <p className="text-slate-600">We have deployed the initial patch to staging and are validating query performance.</p>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                      <div className="flex justify-between text-[11px] mb-1">
                        <strong className="text-slate-800">External Reporter (Client)</strong>
                        <span className="text-slate-400">10:20 AM</span>
                      </div>
                      <p className="text-slate-600">Thank you! Looking forward to the staging verification.</p>
                    </div>
                  </div>
                </div>

                <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-amber-200">
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-amber-700" />
                      <span className="font-bold text-amber-900">Protected Internal Notes</span>
                    </div>
                    <span className="text-[10px] bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded font-bold uppercase">
                      🔒 Strictly Hidden From Clients
                    </span>
                  </div>
                  <div className="space-y-2.5">
                    <div className="bg-white p-2.5 rounded-lg border border-amber-200 shadow-2xs">
                      <div className="flex justify-between text-[11px] mb-1">
                        <strong className="text-amber-900">Alex Rivera (Tech Lead)</strong>
                        <span className="text-slate-400">10:11 AM</span>
                      </div>
                      <p className="text-slate-700">
                        Root cause was missing compound index on tenant aggregation pipeline. Fix merged in PR #42. Do not disclose internal pipeline details to client.
                      </p>
                    </div>
                    <div className="bg-white p-2.5 rounded-lg border border-amber-200 shadow-2xs">
                      <div className="flex justify-between text-[11px] mb-1">
                        <strong className="text-amber-900">Sarah Jenkins (Owner)</strong>
                        <span className="text-slate-400">10:13 AM</span>
                      </div>
                      <p className="text-slate-700">
                        Approved. Ensure automated test coverage is added before promoting to production.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Workflow Automation Builder Preview */}
          {activeDemoTab === 'workflow' && (
            <div className="p-6 bg-[#F8FAFC] space-y-4 text-xs">
              <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-blue-600" />
                    <span className="font-bold text-slate-800">Rule: Auto-Escalate Critical Incidents</span>
                  </div>
                  <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-200">
                    Active Automation
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">Trigger (WHEN)</span>
                    <p className="font-semibold text-slate-800">Ticket Priority becomes Critical</p>
                    <p className="text-[11px] text-slate-500">Any project or service category</p>
                  </div>

                  <div className="text-center font-bold text-slate-400">&rarr; THEN EXECUTE &rarr;</div>

                  <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">Actions (DO)</span>
                    <ul className="space-y-1 text-[11px] text-slate-700">
                      <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-indigo-600" /> Auto-assign to Lead Architect</li>
                      <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-indigo-600" /> Dispatch push notification & email</li>
                      <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-indigo-600" /> Attach tag: #urgent-sla</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 4: SLA & Analytics Preview */}
          {activeDemoTab === 'analytics' && (
            <div className="p-6 bg-[#F8FAFC] space-y-4 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Total Tickets</span>
                  <p className="text-2xl font-black text-slate-900 mt-1">128</p>
                  <span className="text-[10px] text-emerald-600 font-bold">&uarr; +14% this month</span>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
                  <span className="text-[10px] uppercase font-bold text-slate-400">SLA Compliance</span>
                  <p className="text-2xl font-black text-blue-600 mt-1">98.4%</p>
                  <span className="text-[10px] text-emerald-600 font-bold">Target: &gt;95.0%</span>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Avg Resolution</span>
                  <p className="text-2xl font-black text-slate-900 mt-1">1.8h</p>
                  <span className="text-[10px] text-emerald-600 font-bold">&darr; 42% faster</span>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Export Ready</span>
                  <p className="text-xs font-bold text-slate-700 mt-2">1-Click PDF & CSV</p>
                  <span className="text-[10px] text-slate-400">Audit-compliant</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Metrics Banner */}
      <section className="bg-slate-900 text-white py-12 px-6 border-y border-slate-800">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <div className="text-3xl sm:text-4xl font-extrabold text-blue-400">48%</div>
            <div className="text-xs text-slate-400 font-medium mt-1">Faster Bug Resolution</div>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-extrabold text-emerald-400">99.9%</div>
            <div className="text-xs text-slate-400 font-medium mt-1">SLA Compliance Met</div>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-extrabold text-indigo-400">3.4x</div>
            <div className="text-xs text-slate-400 font-medium mt-1">Ticket Triage Velocity</div>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-extrabold text-purple-400">0</div>
            <div className="text-xs text-slate-400 font-medium mt-1">Cross-Tenant Leakage</div>
          </div>
        </div>
      </section>

      {/* Feature Deep Dive Section */}
      <section id="features" className="py-24 bg-white border-b border-slate-200 px-6 sm:px-8">
        <div className="max-w-6xl mx-auto space-y-16">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-xs font-bold text-blue-600 uppercase tracking-wider">Engineered for Velocity</h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Enterprise Power. Modern Simplicity.
            </h3>
            <p className="text-sm text-slate-500">
              Everything high-growth software teams and service providers need to run projects with zero friction.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-7 rounded-2xl bg-[#F8FAFC] border border-slate-200/90 space-y-3.5 hover:shadow-card transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
                <Kanban className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-slate-900">Real-Time Kanban Boards</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Smooth drag-and-drop status transitions with optimistic UI rendering. Powered by Socket.IO so your entire engineering team stays in sync without reloading.
              </p>
            </div>

            <div className="p-7 rounded-2xl bg-[#F8FAFC] border border-slate-200/90 space-y-3.5 hover:shadow-card transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-slate-900">Multi-Tenant Isolation</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Strict organization boundaries in middleware and database query layers ensure zero data leakage between different companies, clients, or internal branches.
              </p>
            </div>

            <div className="p-7 rounded-2xl bg-[#F8FAFC] border border-slate-200/90 space-y-3.5 hover:shadow-card transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
                <Zap className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-slate-900">Workflow Automation</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Configure conditional actions to auto-assign engineers, notify leads on critical issues, or apply tags without manual effort or external webhook scripts.
              </p>
            </div>

            <div className="p-7 rounded-2xl bg-[#F8FAFC] border border-slate-200/90 space-y-3.5 hover:shadow-card transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-md shadow-amber-500/20">
                <Lock className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-slate-900">Protected Internal Notes</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Allow external clients and customers to submit tickets while keeping sensitive architectural discussions, root-cause investigations, and debug notes strictly private.
              </p>
            </div>

            <div className="p-7 rounded-2xl bg-[#F8FAFC] border border-slate-200/90 space-y-3.5 hover:shadow-card transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-md shadow-purple-500/20">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-slate-900">Executive SLA & PDF Reports</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Track team velocity, overdue issues, and category breakdowns. Generate audit-ready formatted PDF summaries and raw CSV datasets with one click.
              </p>
            </div>

            <div className="p-7 rounded-2xl bg-[#F8FAFC] border border-slate-200/90 space-y-3.5 hover:shadow-card transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-sky-600 text-white flex items-center justify-center shadow-md shadow-sky-500/20">
                <Globe2 className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-slate-900">Cloud Storage & Attachments</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Integrated Cloudinary cloud storage for screenshots, log files, crash dumps, and specs with automated previewing and secure file streaming.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Solutions by Team Section */}
      <section id="solutions" className="py-24 bg-[#F8FAFC] px-6 sm:px-8">
        <div className="max-w-6xl mx-auto space-y-16">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-xs font-bold text-blue-600 uppercase tracking-wider">Tailored Solutions</h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Built for Every High-Output Team
            </h3>
            <p className="text-sm text-slate-500">
              Whether you are an engineering sprint team, digital agency, or internal IT department.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-xs">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-3 shadow-2xs">
              <span className="text-blue-600 font-bold uppercase tracking-wider text-[10px]">For Engineering</span>
              <h4 className="text-base font-bold text-slate-900">Software & DevOps</h4>
              <p className="text-slate-600 leading-relaxed">
                Track sprints, link bug fixes to releases, manage backlog grooming, and automate assignment of critical production incidents.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-3 shadow-2xs">
              <span className="text-indigo-600 font-bold uppercase tracking-wider text-[10px]">For IT Service</span>
              <h4 className="text-base font-bold text-slate-900">IT Helpdesk & Support</h4>
              <p className="text-slate-600 leading-relaxed">
                SLA countdown timers, automatic priority escalations, and segregated client vs internal resolution notes.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-3 shadow-2xs">
              <span className="text-emerald-600 font-bold uppercase tracking-wider text-[10px]">For Agencies</span>
              <h4 className="text-base font-bold text-slate-900">Digital Agencies</h4>
              <p className="text-slate-600 leading-relaxed">
                Give each client their own isolated workspace or project with branded URLs while maintaining master control across all accounts.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-3 shadow-2xs">
              <span className="text-purple-600 font-bold uppercase tracking-wider text-[10px]">For Product</span>
              <h4 className="text-base font-bold text-slate-900">Product & QA Teams</h4>
              <p className="text-slate-600 leading-relaxed">
                Triage user feedback, attach high-res design wireframes and bug screen recordings, and prioritize release roadmaps.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Head-to-Head Comparison Table */}
      <section id="comparison" className="py-24 bg-white border-t border-slate-200 px-6 sm:px-8">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-xs font-bold text-blue-600 uppercase tracking-wider">Why Choose QubixDesk?</h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              How QubixDesk Outperforms Legacy Platforms
            </h3>
            <p className="text-sm text-slate-500">
              Clean architecture, sub-100ms response times, and zero unnecessary configuration bloat.
            </p>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-2xl shadow-subtle">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700">
                <tr>
                  <th className="py-4 px-6 font-bold">Platform Capability</th>
                  <th className="py-4 px-6 font-extrabold text-blue-600 bg-blue-50/50">QubixDesk</th>
                  <th className="py-4 px-6 font-semibold text-slate-500">Legacy Jira</th>
                  <th className="py-4 px-6 font-semibold text-slate-500">Zendesk</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-3.5 px-6 font-semibold text-slate-800">True Multi-Tenant Isolation Out-of-the-Box</td>
                  <td className="py-3.5 px-6 font-bold text-emerald-600 bg-blue-50/30">✓ Built-In Core</td>
                  <td className="py-3.5 px-6 text-slate-400">✗ Enterprise Add-on</td>
                  <td className="py-3.5 px-6 text-slate-400">✗ Complex Custom Setup</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-6 font-semibold text-slate-800">Protected Internal Notes (Hidden from Clients)</td>
                  <td className="py-3.5 px-6 font-bold text-emerald-600 bg-blue-50/30">✓ Native Toggle</td>
                  <td className="py-3.5 px-6 text-slate-400">Requires Permission Schemes</td>
                  <td className="py-3.5 px-6 text-slate-400">Limited Support</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-6 font-semibold text-slate-800">Real-Time WebSocket Syncing (Zero Refresh)</td>
                  <td className="py-3.5 px-6 font-bold text-emerald-600 bg-blue-50/30">✓ Instant Socket.IO</td>
                  <td className="py-3.5 px-6 text-slate-400">✗ Manual Refresh / Polling</td>
                  <td className="py-3.5 px-6 text-slate-400">✗ Polling Delays</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-6 font-semibold text-slate-800">Setup & Onboarding Time</td>
                  <td className="py-3.5 px-6 font-bold text-blue-600 bg-blue-50/30">&lt; 2 Minutes</td>
                  <td className="py-3.5 px-6 text-slate-400">Several Days / Weeks</td>
                  <td className="py-3.5 px-6 text-slate-400">Days of Configuration</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-6 font-semibold text-slate-800">Automated Workflow Engine</td>
                  <td className="py-3.5 px-6 font-bold text-emerald-600 bg-blue-50/30">✓ Included All Tiers</td>
                  <td className="py-3.5 px-6 text-slate-400">Paid Plugin / Jira Automation</td>
                  <td className="py-3.5 px-6 text-slate-400">Higher Tier Only</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Customer Testimonials */}
      <section className="py-20 bg-[#F8FAFC] border-t border-slate-200 px-6 sm:px-8">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-xs font-bold text-blue-600 uppercase tracking-wider">Trusted by Industry Leaders</h2>
            <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Loved by Engineers, Managers, and Clients Alike
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-subtle space-y-4">
              <div className="flex gap-1 text-amber-400">
                {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-current" />)}
              </div>
              <p className="text-slate-600 italic leading-relaxed">
                "QubixDesk cut our sprint bug turnaround time by almost half. The real-time Kanban board and protected internal notes make collaborating with clients painless."
              </p>
              <div className="pt-2 border-t flex items-center gap-3">
                <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100" className="w-9 h-9 rounded-full object-cover" alt="Sarah" />
                <div>
                  <h5 className="font-bold text-slate-900">Sarah Jenkins</h5>
                  <p className="text-[11px] text-slate-400">VP of Engineering, Acme Tech</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-subtle space-y-4">
              <div className="flex gap-1 text-amber-400">
                {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-current" />)}
              </div>
              <p className="text-slate-600 italic leading-relaxed">
                "We replaced three separate disjointed tools with QubixDesk. The workflow engine auto-assigns urgent tickets immediately, and the PDF executive reports save us hours of prep."
              </p>
              <div className="pt-2 border-t flex items-center gap-3">
                <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100" className="w-9 h-9 rounded-full object-cover" alt="Alex" />
                <div>
                  <h5 className="font-bold text-slate-900">Alex Rivera</h5>
                  <p className="text-[11px] text-slate-400">Lead Cloud Architect, HyperCloud</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-subtle space-y-4">
              <div className="flex gap-1 text-amber-400">
                {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-current" />)}
              </div>
              <p className="text-slate-600 italic leading-relaxed">
                "The multi-tenant isolation gives our enterprise security reviewers complete peace of mind. Fast, lightweight, and modern."
              </p>
              <div className="pt-2 border-t flex items-center gap-3">
                <img src="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100" className="w-9 h-9 rounded-full object-cover" alt="Emma" />
                <div>
                  <h5 className="font-bold text-slate-900">Emma Watson</h5>
                  <p className="text-[11px] text-slate-400">Product Design Lead, Studio X</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 px-6 sm:px-8 max-w-6xl mx-auto space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <h2 className="text-xs font-bold text-blue-600 uppercase tracking-wider">Transparent SaaS Pricing</h2>
          <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Plans That Scale With Your Ambition
          </h3>
          <p className="text-sm text-slate-500">
            Start free with a 14-day trial. No credit card required. Upgrade or downgrade anytime.
          </p>

          <div className="inline-flex bg-slate-100 p-1 rounded-xl text-xs font-semibold mt-4 border border-slate-200">
            <button
              onClick={() => setBillingInterval('monthly')}
              className={`px-4 py-1.5 rounded-lg transition-all ${
                billingInterval === 'monthly' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-500'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingInterval('yearly')}
              className={`px-4 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                billingInterval === 'yearly' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-500'
              }`}
            >
              <span>Yearly</span>
              <span className="bg-emerald-100 text-emerald-700 text-[10px] px-1.5 py-0.5 rounded font-extrabold">Save 20%</span>
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
                      Most Popular
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
                  <Button variant={plan.popular ? 'primary' : 'outline'} className="w-full text-xs font-bold">
                    Start 14-Day Free Trial
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Book a Demo / Contact Sales Section */}
      <section className="py-20 bg-gradient-to-br from-slate-900 to-slate-950 text-white px-6 sm:px-8">
        <div className="max-w-4xl mx-auto rounded-3xl p-8 sm:p-12 border border-slate-800 bg-slate-900/90 shadow-2xl flex flex-col md:flex-row items-center gap-8">
          <div className="flex-1 space-y-4">
            <span className="text-blue-400 font-bold uppercase text-[10px] tracking-wider">Enterprise Inquiries</span>
            <h3 className="text-2xl sm:text-3xl font-black tracking-tight">Ready to transform your issue tracking?</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Schedule a personalized walkthrough with our product architects or get answers to your enterprise compliance questions.
            </p>
            <div className="space-y-2 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Dedicated deployment & tenant isolation consulting</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Custom SLA & migration assistance from Jira/Zendesk</span>
              </div>
            </div>
          </div>

          <div className="w-full md:w-80 bg-slate-800/80 p-6 rounded-2xl border border-slate-700/80 space-y-4 text-xs">
            {demoSubmitted ? (
              <div className="text-center py-6 space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                <h5 className="font-bold text-white text-sm">Demo Request Received!</h5>
                <p className="text-slate-400 text-xs">Our team will reach out to {demoEmail} within 2 hours.</p>
              </div>
            ) : (
              <form onSubmit={handleDemoSubmit} className="space-y-3">
                <h5 className="font-bold text-white text-sm">Request Product Demo</h5>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Your Name</label>
                  <input
                    type="text"
                    required
                    value={demoName}
                    onChange={(e) => setDemoName(e.target.value)}
                    placeholder="Sarah Jenkins"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white placeholder:text-slate-500 outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Work Email</label>
                  <input
                    type="email"
                    required
                    value={demoEmail}
                    onChange={(e) => setDemoEmail(e.target.value)}
                    placeholder="sarah@company.com"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white placeholder:text-slate-500 outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Company / Organization</label>
                  <input
                    type="text"
                    required
                    value={demoCompany}
                    onChange={(e) => setDemoCompany(e.target.value)}
                    placeholder="Acme Technologies"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white placeholder:text-slate-500 outline-none focus:border-blue-500"
                  />
                </div>
                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 text-xs">
                  Schedule Walkthrough &rarr;
                </Button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 bg-white border-t border-slate-200 px-6 sm:px-8">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Frequently Asked Questions</h3>
            <p className="text-xs text-slate-500">Everything you need to know about getting started with QubixDesk.</p>
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
      <footer className="mt-auto border-t border-slate-800 py-14 px-6 sm:px-10 bg-slate-950 text-slate-400 text-xs">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          <div className="space-y-3">
            <div className="bg-white/95 p-2 rounded-xl inline-block shadow-sm">
              <img
                src="/logo.png"
                alt="QubixDesk"
                className="h-7 w-auto object-contain"
              />
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Work Smarter. Track Better. Deliver Faster. The multi-tenant enterprise issue and project ticketing platform.
            </p>
          </div>

          <div className="space-y-2">
            <h5 className="font-bold text-white text-xs uppercase tracking-wider">Product</h5>
            <ul className="space-y-1.5 text-slate-400">
              <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
              <li><a href="#preview" className="hover:text-white transition-colors">Live Preview</a></li>
              <li><a href="#solutions" className="hover:text-white transition-colors">Solutions</a></li>
              <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
            </ul>
          </div>

          <div className="space-y-2">
            <h5 className="font-bold text-white text-xs uppercase tracking-wider">Security & Compliance</h5>
            <ul className="space-y-1.5 text-slate-400">
              <li><span className="text-slate-500">Multi-Tenant Isolation</span></li>
              <li><span className="text-slate-500">Role-Based Access Control</span></li>
              <li><span className="text-slate-500">Encrypted Cloud Storage</span></li>
              <li><span className="text-slate-500">99.99% Uptime Guarantee</span></li>
            </ul>
          </div>

          <div className="space-y-2">
            <h5 className="font-bold text-white text-xs uppercase tracking-wider">Administration</h5>
            <ul className="space-y-1.5">
              <li>
                <Link to="/login" className="hover:text-white text-slate-400 transition-colors">
                  Workspace Login
                </Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-white text-slate-400 transition-colors">
                  Register Company
                </Link>
              </li>
              <li>
                <Link to="/admin/login" className="text-purple-400 hover:text-purple-300 font-semibold transition-colors flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5" />
                  Super Admin Portal
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="max-w-6xl mx-auto pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <span>&copy; {new Date().getFullYear()} QubixDesk Technologies Inc. All rights reserved.</span>
          <div className="flex gap-6">
            <span className="hover:text-slate-400 cursor-pointer">Privacy Policy</span>
            <span className="hover:text-slate-400 cursor-pointer">Terms of Service</span>
            <span className="hover:text-slate-400 cursor-pointer">Security Overview</span>
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

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center items-center p-6">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-card p-8 space-y-6">
        <div className="text-center space-y-2">
          <Link to="/" className="inline-block">
            <img
              src="/logo.png"
              alt="QubixDesk"
              className="h-10 mx-auto object-contain"
            />
          </Link>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Sign In to QubixDesk</h2>
          <p className="text-xs text-slate-500">Access your organization issue tracking workspace</p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg font-medium space-y-2">
            <div>{error}</div>
            {error.toLowerCase().includes('already exists') && (
              <div className="flex items-center gap-3 pt-1 border-t border-red-200 text-[11px]">
                <Link to="/login" className="text-blue-700 underline font-bold hover:text-blue-900">
                  Log in to your account &rarr;
                </Link>
                <Link to="/forgot-password" className="text-slate-600 underline hover:text-slate-900">
                  Forgot password?
                </Link>
              </div>
            )}
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

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block font-semibold text-slate-700 text-xs">Password</label>
              <Link to="/forgot-password" className="text-[11px] text-blue-600 hover:underline font-semibold">
                Forgot password?
              </Link>
            </div>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              required
            />
          </div>

          <Button type="submit" variant="primary" className="w-full text-xs font-bold" isLoading={isLoading}>
            Sign In to Workspace
          </Button>
        </form>

        <div className="pt-2 border-t border-slate-100 flex flex-col items-center gap-2 text-xs text-slate-500">
          <p>
            Don't have an organization workspace?{' '}
            <Link to="/register" className="text-blue-600 font-semibold hover:underline">
              Start 14-Day Free Trial
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    const res = await register(name, email, password, undefined, phoneNumber);
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
        <div className="text-center space-y-2">
          <Link to="/" className="inline-block">
            <img
              src="/logo.png"
              alt="QubixDesk"
              className="h-10 mx-auto object-contain"
            />
          </Link>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Create your account</h2>
          <p className="text-xs text-slate-500">14-day full access free trial • No credit card required</p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg font-medium space-y-2">
            <div>{error}</div>
            {error.toLowerCase().includes('already exists') && (
              <div className="flex items-center gap-3 pt-1 border-t border-red-200 text-[11px]">
                <Link to="/login" className="text-blue-700 underline font-bold hover:text-blue-900">
                  Log in to your account &rarr;
                </Link>
                <Link to="/forgot-password" className="text-slate-600 underline hover:text-slate-900">
                  Forgot password?
                </Link>
              </div>
            )}
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
            label="Work Email *"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="sarah@company.com"
            required
          />

          <Input
            label="Phone Number *"
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="+1 (555) 000-0000"
            required
          />

          <Input
            label="Password (min 8 characters) *"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••••"
            required
            minLength={8}
          />

          <Button type="submit" variant="primary" className="w-full text-xs font-bold" isLoading={isLoading}>
            Continue to Workspace Setup &rarr;
          </Button>
        </form>

        <div className="pt-2 border-t border-slate-100 text-center text-xs text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-600 font-semibold hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};
