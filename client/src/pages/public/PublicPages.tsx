import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
  MousePointer2,
  Search,
  Bell,
  Plus,
  Filter,
  Eye,
  EyeOff,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [activeDemoTab, setActiveDemoTab] = useState<'kanban' | 'drawer' | 'workflow' | 'analytics'>('kanban');
  const [showBackToTop, setShowBackToTop] = useState<boolean>(false);

  // Interactive Software Demo State & Live Collaboration Simulation
  const [demoStep, setDemoStep] = useState<number>(0);
  const [selectedDemoTicket, setSelectedDemoTicket] = useState<any | null>(null);
  const [isTaskResolved, setIsTaskResolved] = useState<boolean>(false);
  const [isCursorClicking, setIsCursorClicking] = useState<boolean>(false);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number }>({ x: 380, y: 220 });

  const demoContainerRef = useRef<HTMLDivElement>(null);
  const ticketCardRef = useRef<HTMLDivElement>(null);
  const drawerActionBtnRef = useRef<HTMLButtonElement>(null);
  const resolvedCardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Automated interactive workflow cycle
    const timer = setInterval(() => {
      setDemoStep((prev) => {
        const next = (prev + 1) % 5;
        if (next === 0) {
          // Hover over QUB-000101 in Column 2
          if (ticketCardRef.current && demoContainerRef.current) {
            const cRect = demoContainerRef.current.getBoundingClientRect();
            const tRect = ticketCardRef.current.getBoundingClientRect();
            setCursorPos({
              x: tRect.left - cRect.left + tRect.width * 0.45,
              y: tRect.top - cRect.top + 35,
            });
          } else {
            setCursorPos({ x: 380, y: 220 });
          }
          setIsCursorClicking(false);
          setIsTaskResolved(false);
          setSelectedDemoTicket(null);
        } else if (next === 1) {
          // Click QUB-000101 -> Opens Details Drawer
          if (ticketCardRef.current && demoContainerRef.current) {
            const cRect = demoContainerRef.current.getBoundingClientRect();
            const tRect = ticketCardRef.current.getBoundingClientRect();
            setCursorPos({
              x: tRect.left - cRect.left + tRect.width * 0.45,
              y: tRect.top - cRect.top + 35,
            });
          }
          setIsCursorClicking(true);
          setTimeout(() => setIsCursorClicking(false), 500);
          setSelectedDemoTicket({
            code: 'QUB-000101',
            title: 'High latency on replica queries during peak reporting',
            priority: 'Critical',
            assignee: 'Alex Rivera',
            sla: '1h 45m left',
            status: 'In Progress',
          });
        } else if (next === 2) {
          // Cursor glides directly onto the "Mark as Resolved" action button in the slide-over drawer
          setTimeout(() => {
            if (drawerActionBtnRef.current && demoContainerRef.current) {
              const cRect = demoContainerRef.current.getBoundingClientRect();
              const bRect = drawerActionBtnRef.current.getBoundingClientRect();
              setCursorPos({
                x: bRect.left - cRect.left + bRect.width * 0.5,
                y: bRect.top - cRect.top + bRect.height * 0.5,
              });
            } else {
              setCursorPos({ x: 920, y: 250 });
            }
          }, 150);
        } else if (next === 3) {
          // Click "Mark as Resolved" -> Triggers Celebration & Done Animation!
          if (drawerActionBtnRef.current && demoContainerRef.current) {
            const cRect = demoContainerRef.current.getBoundingClientRect();
            const bRect = drawerActionBtnRef.current.getBoundingClientRect();
            setCursorPos({
              x: bRect.left - cRect.left + bRect.width * 0.5,
              y: bRect.top - cRect.top + bRect.height * 0.5,
            });
          } else {
            setCursorPos({ x: 920, y: 250 });
          }
          setIsCursorClicking(true);
          setTimeout(() => setIsCursorClicking(false), 500);
          setIsTaskResolved(true);
        } else if (next === 4) {
          // Cursor glides over to celebrate in RESOLVED column
          setTimeout(() => {
            if (resolvedCardRef.current && demoContainerRef.current) {
              const cRect = demoContainerRef.current.getBoundingClientRect();
              const rRect = resolvedCardRef.current.getBoundingClientRect();
              setCursorPos({
                x: rRect.left - cRect.left + rRect.width * 0.5,
                y: rRect.top - cRect.top + 40,
              });
            } else {
              setCursorPos({ x: 720, y: 230 });
            }
          }, 150);
        }
        return next;
      });
    }, 4200);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const elem = document.getElementById(id);
    if (elem) {
      const top = elem.getBoundingClientRect().top + window.pageYOffset - 80;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col selection:bg-blue-100 selection:text-blue-900 relative">
      {/* Background Decorative Ambient Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[800px] h-[480px] bg-gradient-to-tr from-blue-500/15 via-indigo-500/10 to-purple-500/10 blur-[140px] rounded-full animate-pulse-glow" />
        <div className="absolute top-[35%] -left-40 w-[450px] h-[450px] bg-blue-400/10 blur-[130px] rounded-full animate-float-soft" />
        <div className="absolute top-[65%] -right-40 w-[450px] h-[450px] bg-indigo-400/10 blur-[130px] rounded-full animate-float-soft" style={{ animationDelay: '3.5s' }} />
      </div>

      {/* Top Announcement Ribbon */}
      <div className="relative z-10 bg-gradient-to-r from-blue-700 via-indigo-600 to-blue-800 text-white text-[11px] font-semibold py-2 px-4 text-center flex items-center justify-center gap-2">
        <Sparkles className="w-3.5 h-3.5 text-blue-200 shrink-0" />
        <span>
          Announcing <strong>QubixDesk 2.0</strong> — Multi-Tenant Architecture, SLA Automations, and Real-Time WebSocket Collaboration.
        </span>
        <Link to="/register" className="underline font-bold text-white hover:text-blue-100 ml-1">
          Explore Free &rarr;
        </Link>
      </div>

      {/* Public Navbar */}
      <header className="h-16 bg-white/95 backdrop-blur-xl border-b border-slate-200/90 sticky top-0 z-40 px-6 sm:px-10 flex items-center justify-between shadow-xs transition-all">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center group">
            <img
              src="/logo.png"
              alt="QubixDesk - Work Smarter. Track Better. Deliver Faster."
              className="h-8 sm:h-9 w-auto object-contain group-hover:scale-102 transition-transform"
            />
          </Link>

          <nav className="hidden lg:flex items-center gap-6 text-xs font-semibold text-slate-600">
            <a href="#features" onClick={(e) => scrollToSection(e, 'features')} className="hover:text-blue-600 hover:bg-slate-50 px-2.5 py-1.5 rounded-lg transition-colors">Features</a>
            <a href="#preview" onClick={(e) => scrollToSection(e, 'preview')} className="hover:text-blue-600 hover:bg-slate-50 px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1.5">
              <span>Live Preview</span>
              <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-1.5 py-0.2 rounded-full">Interactive</span>
            </a>
            <a href="#solutions" onClick={(e) => scrollToSection(e, 'solutions')} className="hover:text-blue-600 hover:bg-slate-50 px-2.5 py-1.5 rounded-lg transition-colors">Solutions</a>
            <a href="#comparison" onClick={(e) => scrollToSection(e, 'comparison')} className="hover:text-blue-600 hover:bg-slate-50 px-2.5 py-1.5 rounded-lg transition-colors">Comparison</a>
            <a href="#pricing" onClick={(e) => scrollToSection(e, 'pricing')} className="hover:text-blue-600 hover:bg-slate-50 px-2.5 py-1.5 rounded-lg transition-colors">Pricing</a>
            <a href="#faq" onClick={(e) => scrollToSection(e, 'faq')} className="hover:text-blue-600 hover:bg-slate-50 px-2.5 py-1.5 rounded-lg transition-colors">FAQ</a>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/login">
            <Button variant="ghost" size="sm" className="text-slate-700 font-semibold text-xs hover:text-blue-600 hover:bg-slate-50 px-3.5 py-1.5">
              Sign In
            </Button>
          </Link>
          <Link to="/register">
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 text-xs font-bold px-4 py-1.5 rounded-lg transition-all hover:scale-102 active:scale-98">
              Start Free Trial
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 pt-3 sm:pt-6 pb-8 px-4 sm:px-6 max-w-7xl mx-auto text-center space-y-5">
        {/* Floating Live Interaction Badges */}
        <div className="hidden lg:block absolute left-8 top-28 pointer-events-none">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="bg-white/90 backdrop-blur-md border border-slate-200/90 rounded-2xl p-3 shadow-xl shadow-slate-200/50 flex items-center gap-3 animate-float-soft"
          >
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0">
              ⚡
            </div>
            <div className="text-left text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-bold text-slate-800">Live Socket Sync</span>
              </div>
              <p className="text-[11px] text-slate-500">Alex Rivera moved QUB-00102</p>
            </div>
          </motion.div>
        </div>

        <div className="hidden lg:block absolute right-8 top-32 pointer-events-none">
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="bg-white/90 backdrop-blur-md border border-slate-200/90 rounded-2xl p-3 shadow-xl shadow-slate-200/50 flex items-center gap-3 animate-float-soft"
            style={{ animationDelay: '2.5s' }}
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs shrink-0">
              🔒
            </div>
            <div className="text-left text-xs">
              <span className="font-bold text-slate-800">Tenant Isolation</span>
              <p className="text-[11px] text-slate-500">0 Cross-Workspace Leakage</p>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="inline-flex items-center gap-2 bg-blue-50/90 border border-blue-200/80 text-blue-700 px-4 py-1.5 rounded-full text-xs font-bold tracking-wide shadow-2xs backdrop-blur-sm"
        >
          <Sparkles className="w-3.5 h-3.5 text-blue-600 animate-spin" style={{ animationDuration: '8s' }} />
          <span>Next-Generation Multi-Tenant Issue & Project Ticketing</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="text-5xl sm:text-7xl lg:text-8xl font-black text-slate-900 tracking-tight leading-[1.08] max-w-5xl mx-auto"
        >
          Work Smarter. Track Better.{' '}
          <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 bg-clip-text text-transparent">
            Deliver Faster.
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="text-base sm:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed font-normal"
        >
          QubixDesk unifies project management, issue tracking, and client helpdesk into one ultra-fast, multi-tenant workspace. Built with strict data isolation, real-time collaboration, and intelligent workflow automation.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-wrap items-center justify-center gap-4 pt-3"
        >
          <Link to="/register">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-500/30 px-7 py-3 text-sm font-bold rounded-xl hover:scale-102 transition-all active:scale-98" rightIcon={<ArrowRight className="w-4 h-4" />}>
              Start Free Trial (14 Days)
            </Button>
          </Link>
          <a href="#preview" onClick={(e) => scrollToSection(e, 'preview')}>
            <Button size="lg" variant="outline" className="border-slate-300 font-semibold text-slate-700 hover:bg-slate-100 px-6 py-3 text-sm rounded-xl">
              Explore Live Workspace
            </Button>
          </a>
          <Link to="/login">
            <Button size="lg" variant="ghost" className="text-blue-700 font-semibold hover:bg-blue-50 px-5 py-3 text-sm">
              Demo Workspace Login &rarr;
            </Button>
          </Link>
        </motion.div>

        {/* Trust Badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="pt-6 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs font-semibold text-slate-500"
        >
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
        </motion.div>

        {/* Interactive Full Workspace Showcase Frame */}
        <motion.div
          id="preview"
          ref={demoContainerRef}
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="mt-14 rounded-2xl border border-slate-300/80 bg-white p-2 sm:p-3 shadow-2xl shadow-slate-300/50 max-w-6xl mx-auto text-left overflow-hidden hover:shadow-blue-500/10 transition-shadow relative"
        >
          {/* Animated Interactive Cursor Simulation (Authentic Figma/macOS Pointer) */}
          <motion.div
            className="hidden lg:flex absolute z-50 pointer-events-none items-center gap-1.5 drop-shadow-xl"
            animate={{
              x: cursorPos.x,
              y: cursorPos.y,
            }}
            transition={{
              duration: 1.1,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <div className="relative">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="drop-shadow-md">
                <path
                  d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87a.5.5 0 0 0 .35-.85L6.35 2.85a.5.5 0 0 0-.85.36Z"
                  fill="#2563EB"
                  stroke="#FFFFFF"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
              </svg>
              {isCursorClicking && (
                <span className="absolute top-0.5 left-1 w-6 h-6 rounded-full border-2 border-blue-400 bg-blue-400/30 animate-ping pointer-events-none" />
              )}
            </div>
            <div className="bg-slate-900/95 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-lg backdrop-blur-xs flex items-center gap-1.5 border border-slate-700 whitespace-nowrap">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Alex Rivera (Lead Engineer)</span>
            </div>
          </motion.div>

          {/* Mock Browser Top Header Bar */}
          <div className="bg-slate-100 rounded-t-xl px-4 py-2.5 flex items-center justify-between border-b border-slate-200/80">
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <div className="w-3 h-3 rounded-full bg-emerald-400" />
              </div>
              <span className="text-xs font-mono text-slate-500 ml-2 bg-white px-2.5 py-0.5 rounded border border-slate-200 flex items-center gap-1.5">
                <Lock className="w-3 h-3 text-emerald-600" />
                https://qubixdesk.toolio.tech/workspace/{activeDemoTab}
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-mono text-[11px] font-semibold text-slate-700">WebSocket Cluster: 12ms</span>
            </div>
          </div>

          {/* Interactive Feature Demo Tabs */}
          <div className="bg-white border-b border-slate-200 px-4 flex gap-2 pt-2 overflow-x-auto">
            {[
              { id: 'kanban', label: 'Full Sprint Kanban Workspace', icon: Kanban },
              { id: 'drawer', label: 'Ticket Drawer & Internal Notes', icon: FileText },
              { id: 'workflow', label: 'Automated SLA & Escalation Engine', icon: Workflow },
              { id: 'analytics', label: 'Velocity & Compliance Telemetry', icon: BarChart3 },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveDemoTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                    activeDemoTab === tab.id
                      ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                      : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeDemoTab}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
            >
              {/* Tab 1: Full Authentic Kanban Board Workspace Replica */}
              {activeDemoTab === 'kanban' && (
                <div className="bg-[#F8FAFC] flex min-h-[460px] text-xs">
                  {/* Left Workspace Sidebar Replica */}
                  <div className="w-56 bg-white border-r border-slate-200 p-3 hidden sm:flex flex-col justify-between shrink-0 select-none">
                    <div className="space-y-4">
                      {/* Org Header */}
                      <div className="bg-[#F8FAFC] border border-slate-200 rounded-lg p-2 flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-6 h-6 rounded-md bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                            A
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 truncate text-[11px] leading-tight">Acme Cloud Inc.</p>
                            <p className="text-[10px] text-blue-600 font-semibold leading-tight">Professional Plan</p>
                          </div>
                        </div>
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                      </div>

                      {/* Nav Links */}
                      <div className="space-y-0.5 text-[11px]">
                        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-600 hover:bg-slate-50 cursor-pointer">
                          <Layers2 className="w-3.5 h-3.5 text-slate-400" />
                          <span>Dashboard</span>
                        </div>
                        <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-700 font-semibold cursor-pointer">
                          <div className="flex items-center gap-2">
                            <Kanban className="w-3.5 h-3.5 text-blue-600" />
                            <span>Kanban Board</span>
                          </div>
                          <span className="bg-blue-600 text-white text-[9px] font-bold px-1.5 rounded-full">Live</span>
                        </div>
                        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-600 hover:bg-slate-50 cursor-pointer">
                          <Layers className="w-3.5 h-3.5 text-slate-400" />
                          <span>All Tickets</span>
                        </div>
                        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-600 hover:bg-slate-50 cursor-pointer">
                          <FileText className="w-3.5 h-3.5 text-slate-400" />
                          <span>Projects</span>
                        </div>
                        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-600 hover:bg-slate-50 cursor-pointer">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          <span>Teams</span>
                        </div>
                        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-600 hover:bg-slate-50 cursor-pointer">
                          <BarChart3 className="w-3.5 h-3.5 text-slate-400" />
                          <span>Analytics & SLA</span>
                        </div>
                        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-600 hover:bg-slate-50 cursor-pointer">
                          <Zap className="w-3.5 h-3.5 text-slate-400" />
                          <span>Automations</span>
                        </div>
                      </div>

                      {/* Workspace SLA & Health Telemetry */}
                      <div className="pt-2 border-t border-slate-100">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 block mb-1">
                          Workspace Telemetry
                        </span>
                        <div className="space-y-1.5 text-[11px] text-slate-600 px-2">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500">SLA Compliance</span>
                            <span className="text-emerald-600 font-bold font-mono text-[10px]">99.4%</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500">Avg Resolution</span>
                            <span className="text-blue-600 font-bold font-mono text-[10px]">18 min</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500">Active Sockets</span>
                            <span className="text-purple-600 font-bold font-mono text-[10px]">142 peers</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* User profile bottom */}
                    <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                          AR
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 truncate text-[11px]">Alex Rivera</p>
                          <p className="text-[10px] text-slate-400 truncate">Lead Engineer</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Main Kanban Content Area */}
                  <div className="flex-1 flex flex-col min-w-0 relative overflow-hidden">
                    {/* Live Task Resolution Celebration Toast - Positioned at bottom-left so it NEVER collides with drawer */}
                    <AnimatePresence>
                      {isTaskResolved && (
                        <motion.div
                          initial={{ opacity: 0, y: 15, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 15, scale: 0.95 }}
                          className="absolute bottom-4 left-6 z-40 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-3 text-xs font-bold border border-emerald-400 backdrop-blur-md max-w-sm"
                        >
                          <span className="w-6 h-6 rounded-full bg-white text-emerald-600 flex items-center justify-center font-black text-xs shrink-0 shadow-xs">✓</span>
                          <div className="min-w-0">
                            <p className="font-extrabold text-white text-xs truncate">QUB-000101 Marked as Resolved</p>
                            <p className="text-[10px] text-emerald-100 font-normal truncate">SLA Met (14m ahead) • Real-time socket sync broadcasted</p>
                          </div>
                          <span className="bg-emerald-800 text-emerald-200 text-[9px] font-mono font-bold px-2 py-0.5 rounded uppercase shrink-0">Live</span>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Top Workspace Bar */}
                    <div className="h-12 border-b border-slate-200 bg-white px-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-xs">Core Engineering (DEV)</span>
                        <span className="text-slate-300">/</span>
                        <span className="text-slate-500 text-xs">Sprint Board</span>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="relative hidden md:block">
                          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                          <input
                            type="text"
                            placeholder="Search tickets (QUB-)..."
                            className="bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1 text-[11px] w-48 outline-none focus:border-blue-500"
                            readOnly
                          />
                        </div>

                        <button className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-3 py-1.5 text-xs font-semibold shadow-xs">
                          <Plus className="w-3.5 h-3.5" />
                          <span>New ticket</span>
                        </button>

                        <div className="relative p-1.5 text-slate-500 rounded-lg">
                          <Bell className="w-4 h-4" />
                          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                        </div>
                      </div>
                    </div>

                    {/* Columns Grid */}
                    <div className="p-4 flex-1 overflow-x-auto grid grid-cols-1 md:grid-cols-4 gap-3">
                      {/* Column 1: TO DO */}
                      <div className="space-y-2.5 min-w-[200px]">
                        <div className="flex items-center justify-between text-slate-600 text-[11px] font-bold uppercase tracking-wider px-1">
                          <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-slate-400" />
                            To Do
                          </span>
                          <span className="bg-slate-200 text-slate-700 rounded-full px-2 py-0.2 text-[10px]">3</span>
                        </div>

                        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs space-y-2 hover:border-slate-300 transition-colors">
                          <div className="flex justify-between items-center">
                            <span className="font-mono text-blue-600 font-bold text-[11px]">QUB-000102</span>
                            <span className="bg-amber-50 text-amber-700 px-1.5 py-0.2 rounded text-[10px] font-bold border border-amber-200">High</span>
                          </div>
                          <p className="font-semibold text-slate-900 text-xs">OAuth2 GitHub SSO Integration with Token Rotation</p>
                          <div className="flex items-center gap-1 text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded w-fit font-medium">
                            #security #backend
                          </div>
                          <div className="flex justify-between text-slate-400 text-[10px] pt-2 border-t border-slate-100">
                            <span className="flex items-center gap-1 text-slate-500"><Clock className="w-3 h-3" /> Due 5d</span>
                            <span>💬 3 • ☑️ 4/4</span>
                          </div>
                        </div>

                        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs space-y-2 hover:border-slate-300 transition-colors">
                          <div className="flex justify-between items-center">
                            <span className="font-mono text-blue-600 font-bold text-[11px]">QUB-000105</span>
                            <span className="bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded text-[10px] font-bold">Normal</span>
                          </div>
                          <p className="font-semibold text-slate-900 text-xs">Dark mode preference synchronization</p>
                          <div className="flex justify-between text-slate-400 text-[10px] pt-2 border-t border-slate-100">
                            <span className="flex items-center gap-1 text-slate-500"><Clock className="w-3 h-3" /> Due 7d</span>
                            <span>💬 1</span>
                          </div>
                        </div>
                      </div>

                      {/* Column 2: IN PROGRESS */}
                      <div className="space-y-2.5 min-w-[200px]">
                        <div className="flex items-center justify-between text-blue-600 text-[11px] font-bold uppercase tracking-wider px-1">
                          <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                            In Progress
                          </span>
                          <span className="bg-blue-100 text-blue-700 rounded-full px-2 py-0.2 text-[10px]">
                            {isTaskResolved ? '1' : '2'}
                          </span>
                        </div>

                        {/* Interactive Clickable Ticket Card - In Column 2 while not resolved */}
                        {!isTaskResolved && (
                          <div
                            onClick={() => {
                              setSelectedDemoTicket({
                                code: 'QUB-000101',
                                title: 'High latency on replica queries during peak reporting',
                                priority: 'Critical',
                                assignee: 'Alex Rivera',
                                sla: '1h 45m left',
                                status: 'In Progress',
                              });
                            }}
                            ref={ticketCardRef}
                            className="bg-white border-2 border-blue-500 rounded-xl p-3 shadow-md space-y-2 ring-3 ring-blue-500/10 cursor-pointer transition-all hover:scale-102"
                          >
                            <div className="flex justify-between items-center">
                              <span className="font-mono text-blue-600 font-bold text-[11px]">QUB-000101</span>
                              <span className="bg-red-50 text-red-700 px-1.5 py-0.2 rounded text-[10px] font-bold border border-red-200">
                                Critical
                              </span>
                            </div>
                            <p className="font-semibold text-slate-900 text-xs">High latency on replica queries during peak reporting</p>
                            <div className="flex items-center gap-1.5 text-[10px] text-red-600 font-bold bg-red-50 px-2 py-0.5 rounded border border-red-200 w-fit">
                              <AlertTriangle className="w-3 h-3" /> SLA: 1h 45m left
                            </div>
                            <div className="flex justify-between text-slate-400 text-[10px] pt-2 border-t border-slate-100">
                              <span className="text-slate-600 font-medium">Alex Rivera</span>
                              <span>💬 7 • 📎 3</span>
                            </div>
                          </div>
                        )}

                        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs space-y-2 hover:border-slate-300 transition-colors">
                          <div className="flex justify-between items-center">
                            <span className="font-mono text-blue-600 font-bold text-[11px]">QUB-000106</span>
                            <span className="bg-amber-50 text-amber-700 px-1.5 py-0.2 rounded text-[10px] font-bold border border-amber-200">High</span>
                          </div>
                          <p className="font-semibold text-slate-900 text-xs">Socket.io real-time connection reconnect backoff</p>
                          <div className="flex justify-between text-slate-400 text-[10px] pt-2 border-t border-slate-100">
                            <span className="text-slate-500">Emma Watson</span>
                            <span>💬 4</span>
                          </div>
                        </div>
                      </div>

                      {/* Column 3: CODE REVIEW */}
                      <div className="space-y-2.5 min-w-[200px]">
                        <div className="flex items-center justify-between text-indigo-600 text-[11px] font-bold uppercase tracking-wider px-1">
                          <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-indigo-500" />
                            Code Review
                          </span>
                          <span className="bg-indigo-100 text-indigo-700 rounded-full px-2 py-0.2 text-[10px]">2</span>
                        </div>

                        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs space-y-2 hover:border-slate-300 transition-colors">
                          <div className="flex justify-between items-center">
                            <span className="font-mono text-blue-600 font-bold text-[11px]">QUB-000103</span>
                            <span className="bg-blue-50 text-blue-700 px-1.5 py-0.2 rounded text-[10px] font-bold">Normal</span>
                          </div>
                          <p className="font-semibold text-slate-900 text-xs">Automated PDF & CSV SLA report generator</p>
                          <div className="flex justify-between text-slate-400 text-[10px] pt-2 border-t border-slate-100">
                            <span className="text-emerald-600 font-medium">PR #84 Ready</span>
                            <span>💬 2</span>
                          </div>
                        </div>
                      </div>

                      {/* Column 4: RESOLVED */}
                      <div className="space-y-2.5 min-w-[200px]">
                        <div className="flex items-center justify-between text-emerald-600 text-[11px] font-bold uppercase tracking-wider px-1">
                          <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            Resolved
                          </span>
                          <span className="bg-emerald-100 text-emerald-700 rounded-full px-2 py-0.2 text-[10px]">
                            {isTaskResolved ? '5' : '4'}
                          </span>
                        </div>

                        {/* Animated Done Task */}
                        {isTaskResolved && (
                          <motion.div
                            initial={{ scale: 0.8, opacity: 0, y: -10 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            transition={{ duration: 0.4 }}
                            onClick={() => {
                              setSelectedDemoTicket({
                                code: 'QUB-000101',
                                title: 'High latency on replica queries during peak reporting',
                                priority: 'Critical',
                                assignee: 'Alex Rivera',
                                sla: 'SLA Met (14m ahead)',
                                status: 'Resolved',
                              });
                            }}
                            ref={resolvedCardRef}
                            className="bg-emerald-50/70 border-2 border-emerald-500 rounded-xl p-3 shadow-md space-y-2 ring-3 ring-emerald-500/10 cursor-pointer"
                          >
                            <div className="flex justify-between items-center">
                              <span className="font-mono text-blue-600 font-bold text-[11px]">QUB-000101</span>
                              <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded text-[10px] font-bold border border-emerald-300 flex items-center gap-1">
                                <Check className="w-2.5 h-2.5" /> Resolved
                              </span>
                            </div>
                            <p className="font-semibold text-slate-900 text-xs">High latency on replica queries during peak reporting</p>
                            <div className="flex justify-between text-slate-400 text-[10px] pt-2 border-t border-emerald-100">
                              <span className="text-emerald-700 font-medium flex items-center gap-1"><Check className="w-3 h-3" /> SLA Met (14m ahead)</span>
                              <span>💬 8</span>
                            </div>
                          </motion.div>
                        )}

                        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs space-y-2 opacity-85 hover:opacity-100 transition-opacity">
                          <div className="flex justify-between items-center">
                            <span className="font-mono text-blue-600 font-bold text-[11px]">QUB-000104</span>
                            <span className="bg-emerald-50 text-emerald-700 px-1.5 py-0.2 rounded text-[10px] font-bold border border-emerald-200">Done</span>
                          </div>
                          <p className="font-semibold text-slate-800 text-xs">Tenant compound index isolation optimization</p>
                          <div className="flex justify-between text-slate-400 text-[10px] pt-2 border-t border-slate-100">
                            <span className="text-emerald-600 font-medium flex items-center gap-1"><Check className="w-3 h-3" /> SLA Met (14m)</span>
                            <span>💬 6</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Slide-over Ticket Details Drawer Preview */}
                    <AnimatePresence>
                      {selectedDemoTicket && (
                        <motion.div
                          initial={{ x: 340, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          exit={{ x: 340, opacity: 0 }}
                          transition={{ duration: 0.3, ease: 'easeOut' }}
                          className="absolute top-0 right-0 w-80 h-full bg-white border-l border-slate-200 shadow-2xl z-30 flex flex-col justify-between p-4 text-xs"
                        >
                          <div className="space-y-3">
                            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-blue-600 font-bold">{selectedDemoTicket.code}</span>
                                <span
                                  className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${
                                    isTaskResolved
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                      : 'bg-red-50 text-red-700 border-red-200'
                                  }`}
                                >
                                  {isTaskResolved ? 'Done' : selectedDemoTicket.priority}
                                </span>
                              </div>
                              <button
                                onClick={() => setSelectedDemoTicket(null)}
                                className="text-slate-400 hover:text-slate-700 font-bold text-sm p-1 rounded hover:bg-slate-100"
                              >
                                ✕
                              </button>
                            </div>

                            <h4 className="font-bold text-slate-900 text-xs leading-snug">
                              {selectedDemoTicket.title}
                            </h4>

                            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 text-[11px]">
                              <span className="text-slate-500">SLA Status:</span>
                              {isTaskResolved ? (
                                <span className="text-emerald-600 font-bold flex items-center gap-1">
                                  ✓ SLA Met (14m ahead)
                                </span>
                              ) : (
                                <span className="text-red-600 font-bold flex items-center gap-1">
                                  <AlertTriangle className="w-3 h-3" /> 1h 45m left
                                </span>
                              )}
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                Workflow Action
                              </label>
                              <button
                                ref={drawerActionBtnRef}
                                onClick={() => setIsTaskResolved(!isTaskResolved)}
                                className={`w-full py-2 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                                  isTaskResolved
                                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20'
                                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20'
                                }`}
                              >
                                {isTaskResolved ? (
                                  <>
                                    <Check className="w-4 h-4" />
                                    <span>Task Completed ✓</span>
                                  </>
                                ) : (
                                  <>
                                    <span>Mark as Resolved</span>
                                    <ArrowRight className="w-3.5 h-3.5" />
                                  </>
                                )}
                              </button>
                            </div>

                            <div className="pt-2 border-t border-slate-100 space-y-2">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                Internal Note
                              </span>
                              <div className="p-2.5 rounded bg-amber-50/70 border border-amber-200 text-[11px] text-slate-700 space-y-1">
                                <div className="flex justify-between font-bold text-amber-900 text-[10px]">
                                  <span>Alex Rivera (Tech Lead)</span>
                                  <span className="text-slate-400 font-normal">Just now</span>
                                </div>
                                <p>
                                  Root cause identified in replica aggregation query. Optimization verified on staging.
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                            <span>Assignee: Alex Rivera</span>
                            <span className="text-blue-600 font-semibold cursor-pointer">Live Workspace →</span>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
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
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </section>

      {/* Metrics Banner */}
      <section className="bg-slate-950 text-white py-16 px-6 border-y border-slate-800/80 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-950/20 via-indigo-950/10 to-transparent pointer-events-none" />
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xs hover:border-blue-500/40 transition-colors"
          >
            <div className="text-3xl sm:text-5xl font-black text-blue-400 tracking-tight">48%</div>
            <div className="text-xs text-slate-300 font-semibold mt-2">Faster Bug Resolution</div>
            <p className="text-[11px] text-slate-500 mt-1">Automated triage & assignments</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xs hover:border-emerald-500/40 transition-colors"
          >
            <div className="text-3xl sm:text-5xl font-black text-emerald-400 tracking-tight">99.9%</div>
            <div className="text-xs text-slate-300 font-semibold mt-2">SLA Compliance Met</div>
            <p className="text-[11px] text-slate-500 mt-1">Real-time countdown monitors</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xs hover:border-indigo-500/40 transition-colors"
          >
            <div className="text-3xl sm:text-5xl font-black text-indigo-400 tracking-tight">3.4x</div>
            <div className="text-xs text-slate-300 font-semibold mt-2">Ticket Triage Velocity</div>
            <p className="text-[11px] text-slate-500 mt-1">Zero-delay Socket.io engine</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xs hover:border-purple-500/40 transition-colors"
          >
            <div className="text-3xl sm:text-5xl font-black text-purple-400 tracking-tight">0</div>
            <div className="text-xs text-slate-300 font-semibold mt-2">Cross-Tenant Leakage</div>
            <p className="text-[11px] text-slate-500 mt-1">Verified middleware isolation</p>
          </motion.div>
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
            <motion.div
              whileHover={{ y: -6 }}
              transition={{ duration: 0.2 }}
              className="p-7 rounded-2xl bg-[#F8FAFC] border border-slate-200/90 space-y-3.5 hover:shadow-card hover:border-blue-300 transition-all cursor-default"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
                <Kanban className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-slate-900">Real-Time Kanban Boards</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Smooth drag-and-drop status transitions with optimistic UI rendering. Powered by Socket.IO so your entire engineering team stays in sync without reloading.
              </p>
            </motion.div>

            <motion.div
              whileHover={{ y: -6 }}
              transition={{ duration: 0.2 }}
              className="p-7 rounded-2xl bg-[#F8FAFC] border border-slate-200/90 space-y-3.5 hover:shadow-card hover:border-indigo-300 transition-all cursor-default"
            >
              <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-slate-900">Multi-Tenant Isolation</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Strict organization boundaries in middleware and database query layers ensure zero data leakage between different companies, clients, or internal branches.
              </p>
            </motion.div>

            <motion.div
              whileHover={{ y: -6 }}
              transition={{ duration: 0.2 }}
              className="p-7 rounded-2xl bg-[#F8FAFC] border border-slate-200/90 space-y-3.5 hover:shadow-card hover:border-emerald-300 transition-all cursor-default"
            >
              <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
                <Zap className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-slate-900">Workflow Automation</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Configure conditional actions to auto-assign engineers, notify leads on critical issues, or apply tags without manual effort or external webhook scripts.
              </p>
            </motion.div>

            <motion.div
              whileHover={{ y: -6 }}
              transition={{ duration: 0.2 }}
              className="p-7 rounded-2xl bg-[#F8FAFC] border border-slate-200/90 space-y-3.5 hover:shadow-card hover:border-amber-300 transition-all cursor-default"
            >
              <div className="w-12 h-12 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-md shadow-amber-500/20">
                <Lock className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-slate-900">Protected Internal Notes</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Allow external clients and customers to submit tickets while keeping sensitive architectural discussions, root-cause investigations, and debug notes strictly private.
              </p>
            </motion.div>

            <motion.div
              whileHover={{ y: -6 }}
              transition={{ duration: 0.2 }}
              className="p-7 rounded-2xl bg-[#F8FAFC] border border-slate-200/90 space-y-3.5 hover:shadow-card hover:border-purple-300 transition-all cursor-default"
            >
              <div className="w-12 h-12 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-md shadow-purple-500/20">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-slate-900">Executive SLA & PDF Reports</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Track team velocity, overdue issues, and category breakdowns. Generate audit-ready formatted PDF summaries and raw CSV datasets with one click.
              </p>
            </motion.div>

            <motion.div
              whileHover={{ y: -6 }}
              transition={{ duration: 0.2 }}
              className="p-7 rounded-2xl bg-[#F8FAFC] border border-slate-200/90 space-y-3.5 hover:shadow-card hover:border-sky-300 transition-all cursor-default"
            >
              <div className="w-12 h-12 rounded-xl bg-sky-600 text-white flex items-center justify-center shadow-md shadow-sky-500/20">
                <Globe2 className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-slate-900">Cloud Storage & Attachments</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Integrated Cloudinary cloud storage for screenshots, log files, crash dumps, and specs with automated previewing and secure file streaming.
              </p>
            </motion.div>
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
                <div className="my-4">
                  <div className="flex items-baseline">
                    <span className="text-3xl font-extrabold text-slate-900">${plan.price}</span>
                    <span className="text-slate-500 font-semibold ml-1.5 text-xs">/ user / mo</span>
                  </div>
                  <p className="text-[10px] text-blue-600 font-medium mt-0.5">Pay only for active team seats</p>
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
              <li><a href="#features" onClick={(e) => scrollToSection(e, 'features')} className="hover:text-white transition-colors">Features</a></li>
              <li><a href="#preview" onClick={(e) => scrollToSection(e, 'preview')} className="hover:text-white transition-colors">Live Preview</a></li>
              <li><a href="#solutions" onClick={(e) => scrollToSection(e, 'solutions')} className="hover:text-white transition-colors">Solutions</a></li>
              <li><a href="#pricing" onClick={(e) => scrollToSection(e, 'pricing')} className="hover:text-white transition-colors">Pricing</a></li>
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

      {/* Floating Back-to-Top Button */}
      <AnimatePresence>
        {showBackToTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            onClick={scrollToTop}
            className="fixed bottom-6 right-6 z-50 p-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/30 transition-colors cursor-pointer group"
            title="Scroll to top"
          >
            <ChevronUp className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform" />
          </motion.button>
        )}
      </AnimatePresence>
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
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    const res = await register(name, email, password, undefined, phoneNumber);
    setIsLoading(false);
    if (res.success) {
      // Promptly redirect to OTP email verification before workspace onboarding
      navigate('/verify-email', { state: { email: email.toLowerCase().trim(), name } });
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
            placeholder="e.g. Alex Rivera"
            required
          />

          <Input
            label="Work Email *"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="alex@company.com"
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

          <div className="space-y-1.5">
            <label className="block font-semibold text-slate-700 text-xs">
              Password (min 8 characters) *
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                minLength={8}
                className="w-full bg-white border border-slate-200 rounded-lg pl-3 pr-10 py-2 text-xs outline-none focus:border-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <Button type="submit" variant="primary" className="w-full text-xs font-bold py-2.5" isLoading={isLoading}>
            Verify Email & Continue &rarr;
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
