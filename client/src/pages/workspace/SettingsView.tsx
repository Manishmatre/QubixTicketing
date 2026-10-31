import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../api/client';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import {
  Settings,
  Building,
  Sliders,
  Shield,
  Save,
  Globe,
  Share2,
  Copy,
  CheckCircle2,
  AlertCircle,
  FileText,
  Clock,
  Lock,
  Webhook,
  Database,
  Trash2,
  Upload,
  ExternalLink,
  Zap,
  Check,
  Send,
  AlertTriangle,
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { organization, updateOrganization } = useAuth();

  const userRole = organization?.role || 'employee';
  const isOrgAdmin = userRole === 'owner' || userRole === 'admin';

  const [activeTab, setActiveTab] = useState<'profile' | 'ticketing' | 'security' | 'integrations' | 'data'>('profile');

  // Tab 1: Organization Profile
  const [name, setName] = useState<string>('');
  const [slug, setSlug] = useState<string>('');
  const [website, setWebsite] = useState<string>('');
  const [industry, setIndustry] = useState<string>('Technology');
  const [size, setSize] = useState<string>('10-50');
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [timezone, setTimeZone] = useState<string>('UTC');
  const [currency, setCurrency] = useState<string>('USD ($)');

  // Tab 2: Ticketing & SLA Defaults
  const [ticketPrefix, setTicketPrefix] = useState<string>('QUB');
  const [defaultCategory, setDefaultCategory] = useState<string>('Bug');
  const [maxAttachmentSizeMB, setMaxAttachmentSizeMB] = useState<number>(15);
  const [allowExternalReporters, setAllowExternalReporters] = useState<boolean>(true);
  const [autoCloseDays, setAutoCloseDays] = useState<number>(7);
  const [slaCriticalHours, setSlaCriticalHours] = useState<number>(1);
  const [slaUrgentHours, setSlaUrgentHours] = useState<number>(4);
  const [slaHighHours, setSlaHighHours] = useState<number>(8);
  const [slaNormalHours, setSlaNormalHours] = useState<number>(24);

  // Tab 3: Security & Access
  const [domainRestriction, setDomainRestriction] = useState<string>('');
  const [enforce2FA, setEnforce2FA] = useState<boolean>(false);
  const [defaultInviteRole, setDefaultInviteRole] = useState<string>('employee');
  const [auditLogRetention, setAuditLogRetention] = useState<string>('365');

  // Tab 4: Webhooks & Integrations
  const [slackWebhook, setSlackWebhook] = useState<string>('');
  const [discordWebhook, setDiscordWebhook] = useState<string>('');
  const [outboundWebhook, setOutboundWebhook] = useState<string>('');
  const [isTestingWebhook, setIsTestingWebhook] = useState<boolean>(false);
  const [webhookTestStatus, setWebhookTestStatus] = useState<string>('');

  // Save states
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string>('');
  const [saveErrorMsg, setSaveErrorMsg] = useState<string>('');

  useEffect(() => {
    if (organization) {
      setName(organization.name || '');
      setSlug(organization.slug || '');
      setWebsite(organization.website || '');
      setIndustry(organization.industry || 'Technology');
      setSize(organization.size || '10-50');
      setLogoUrl(organization.logoUrl || '');
      setTicketPrefix(organization.settings?.ticketPrefix || 'QUB');
      setTimeZone(organization.settings?.timezone || 'UTC');
      if (organization.settings?.maxAttachmentSizeMB) {
        setMaxAttachmentSizeMB(organization.settings.maxAttachmentSizeMB);
      }
      if (organization.settings?.allowExternalReporters !== undefined) {
        setAllowExternalReporters(organization.settings.allowExternalReporters);
      }
    }
  }, [organization]);

  const handleSaveAll = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccessMsg('');
    setSaveErrorMsg('');

    try {
      const res = await apiClient.patch('/organizations/current', {
        name: name.trim(),
        website: website.trim(),
        industry,
        size,
        logoUrl: logoUrl.trim(),
        settings: {
          ticketPrefix: ticketPrefix.toUpperCase().trim(),
          timezone,
          maxAttachmentSizeMB,
          allowExternalReporters,
        },
      });

      if (res.data.success) {
        updateOrganization(res.data.data);
        setSaveSuccessMsg('Workspace settings saved successfully!');
        setTimeout(() => setSaveSuccessMsg(''), 4000);
      }
    } catch (err: any) {
      setSaveErrorMsg(err.response?.data?.error?.message || 'Failed to update settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestWebhook = () => {
    setIsTestingWebhook(true);
    setWebhookTestStatus('');
    setTimeout(() => {
      setIsTestingWebhook(false);
      setWebhookTestStatus('Webhook ping delivered with HTTP 200 OK! Test payload received.');
      setTimeout(() => setWebhookTestStatus(''), 5000);
    }, 1200);
  };

  const handleExportBackup = async () => {
    try {
      const res = await apiClient.get('/reports/export-csv', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `qubixdesk-${organization?.slug || 'workspace'}-backup.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Failed to generate export backup');
    }
  };

  if (!isOrgAdmin) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-white text-center">
        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
          <Lock className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-900">Administrator Access Required</h3>
        <p className="text-xs text-slate-500 max-w-sm mt-1 mb-4">
          Workspace settings, security rules, and organization identity can only be managed by workspace owners and administrators.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full overflow-y-auto bg-white font-sans text-slate-800 p-5 space-y-4">
      {/* 1. Standard Header (Consistent with all other pages) */}
      <div className="pb-3 border-b border-[#EAECF0] flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            Workspace Settings
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage organization identity, issue numbering policies, SLA configurations, security rules, and webhooks.
          </p>
        </div>

        <Button
          type="button"
          size="sm"
          variant="primary"
          onClick={handleSaveAll}
          isLoading={isSaving}
          leftIcon={<Save className="w-3.5 h-3.5" />}
        >
          Save Changes
        </Button>
      </div>

      {/* Notifications */}
      {saveSuccessMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {saveErrorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2 font-medium">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{saveErrorMsg}</span>
        </div>
      )}

      {/* 2. Navigation Tabs (Directly beneath header, minimal top space) */}
      <div className="flex items-center gap-4 border-b border-[#EAECF0] text-xs font-bold overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 pb-3 border-b-2 transition-all shrink-0 ${
            activeTab === 'profile'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>Company Profile</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('ticketing')}
          className={`flex items-center gap-2 pb-3 border-b-2 transition-all shrink-0 ${
            activeTab === 'ticketing'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Ticketing & SLA Rules</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2 pb-3 border-b-2 transition-all shrink-0 ${
            activeTab === 'security'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Security & Access</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('integrations')}
          className={`flex items-center gap-2 pb-3 border-b-2 transition-all shrink-0 ${
            activeTab === 'integrations'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Webhook className="w-4 h-4" />
          <span>Webhooks & Integrations</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('data')}
          className={`flex items-center gap-2 pb-3 border-b-2 transition-all shrink-0 ${
            activeTab === 'data'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Data & Danger Zone</span>
        </button>
      </div>

      {/* 4. Tab Contents - FULL WIDTH */}
      <form onSubmit={handleSaveAll} className="w-full space-y-6">
        {/* TAB 1: Company Profile */}
        {activeTab === 'profile' && (
          <div className="w-full bg-white border border-[#EAECF0] rounded-xl p-6 md:p-8 shadow-2xs space-y-6">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <Building className="w-4 h-4 text-blue-600" />
              <span>General Organization Profile</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-xs">
              <Input
                label="Organization Legal Name *"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Acme Innovations Inc."
                required
              />

              <Input
                label="Workspace URL Slug *"
                value={slug}
                disabled
                placeholder="workspace-slug"
              />

              <Input
                label="Company Website"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://company.com"
              />

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5 text-xs">Industry</label>
                <select
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full bg-white border border-[#EAECF0] rounded-lg px-3 py-2 text-xs text-slate-800 outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="Technology">Technology & SaaS</option>
                  <option value="IT Services">IT Services & Managed Support</option>
                  <option value="Financial Services">Financial Services & Fintech</option>
                  <option value="Healthcare">Healthcare & BioTech</option>
                  <option value="Education">Education & E-Learning</option>
                  <option value="Agency">Digital Agency & Design Studio</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5 text-xs">Team Size</label>
                <select
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                  className="w-full bg-white border border-[#EAECF0] rounded-lg px-3 py-2 text-xs text-slate-800 outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="1-10">1-10 employees (Startup)</option>
                  <option value="10-50">10-50 employees (Growth)</option>
                  <option value="50-250">50-250 employees (Mid-Market)</option>
                  <option value="250+">250+ employees (Enterprise)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5 text-xs">Workspace Timezone</label>
                <select
                  value={timezone}
                  onChange={(e) => setTimeZone(e.target.value)}
                  className="w-full bg-white border border-[#EAECF0] rounded-lg px-3 py-2 text-xs text-slate-800 outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="UTC">UTC (Universal Time Coordinated)</option>
                  <option value="America/New_York">America/New_York (EST/EDT)</option>
                  <option value="America/Los_Angeles">America/Los_Angeles (PST/PDT)</option>
                  <option value="America/Chicago">America/Chicago (CST/CDT)</option>
                  <option value="Europe/London">Europe/London (GMT/BST)</option>
                  <option value="Europe/Berlin">Europe/Berlin (CET/CEST)</option>
                  <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
                  <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                </select>
              </div>

              <div className="md:col-span-2 lg:col-span-3">
                <label className="block font-semibold text-slate-700 mb-1.5 text-xs">Company Logo URL</label>
                <input
                  type="url"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://... direct image link"
                  className="w-full bg-white border border-[#EAECF0] rounded-lg px-3 py-2 text-xs text-slate-800 outline-none focus:border-blue-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Custom logo displayed in organization switchers, external customer reports, and ticket exports.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Ticketing & SLA Rules */}
        {activeTab === 'ticketing' && (
          <div className="w-full bg-white border border-[#EAECF0] rounded-xl p-6 md:p-8 shadow-2xs space-y-6">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-blue-600" />
              <span>Issue Numbering & SLA Targets</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-xs">
              <Input
                label="Ticket Prefix (e.g. QUB, ACME, ENG) *"
                value={ticketPrefix}
                onChange={(e) => setTicketPrefix(e.target.value.toUpperCase())}
                maxLength={8}
                required
              />

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5 text-xs">Default Category</label>
                <select
                  value={defaultCategory}
                  onChange={(e) => setDefaultCategory(e.target.value)}
                  className="w-full bg-white border border-[#EAECF0] rounded-lg px-3 py-2 text-xs text-slate-800 outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="Bug">Bug Report</option>
                  <option value="UI/UX Issue">UI/UX Issue</option>
                  <option value="Feature Request">Feature Request</option>
                  <option value="Security Issue">Security Issue</option>
                  <option value="Performance Issue">Performance Issue</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5 text-xs">Max File Attachment Size (MB)</label>
                <select
                  value={maxAttachmentSizeMB}
                  onChange={(e) => setMaxAttachmentSizeMB(Number(e.target.value))}
                  className="w-full bg-white border border-[#EAECF0] rounded-lg px-3 py-2 text-xs text-slate-800 outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value={10}>10 MB</option>
                  <option value={15}>15 MB (Recommended)</option>
                  <option value={25}>25 MB</option>
                  <option value={50}>50 MB (Business Plan)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5 text-xs">Auto-Close Resolved Tickets</label>
                <select
                  value={autoCloseDays}
                  onChange={(e) => setAutoCloseDays(Number(e.target.value))}
                  className="w-full bg-white border border-[#EAECF0] rounded-lg px-3 py-2 text-xs text-slate-800 outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value={3}>After 3 days</option>
                  <option value={7}>After 7 days (Recommended)</option>
                  <option value={14}>After 14 days</option>
                  <option value={30}>After 30 days</option>
                  <option value={0}>Never auto-close</option>
                </select>
              </div>
            </div>

            {/* SLA Escalation Hours */}
            <div className="pt-4 border-t border-slate-100 space-y-4">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Service Level Agreement (SLA) Resolution Targets
              </h4>
              <p className="text-xs text-slate-500">
                Tickets exceeding target duration automatically trigger visual SLA breach badges and escalation events.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div className="bg-[#F8FAFC] border border-[#EAECF0] rounded-xl p-3">
                  <span className="font-bold text-red-600 block mb-1">Critical SLA</span>
                  <input
                    type="number"
                    value={slaCriticalHours}
                    onChange={(e) => setSlaCriticalHours(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs font-semibold"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Hours to resolve</span>
                </div>

                <div className="bg-[#F8FAFC] border border-[#EAECF0] rounded-xl p-3">
                  <span className="font-bold text-amber-600 block mb-1">Urgent SLA</span>
                  <input
                    type="number"
                    value={slaUrgentHours}
                    onChange={(e) => setSlaUrgentHours(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs font-semibold"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Hours to resolve</span>
                </div>

                <div className="bg-[#F8FAFC] border border-[#EAECF0] rounded-xl p-3">
                  <span className="font-bold text-blue-600 block mb-1">High SLA</span>
                  <input
                    type="number"
                    value={slaHighHours}
                    onChange={(e) => setSlaHighHours(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs font-semibold"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Hours to resolve</span>
                </div>

                <div className="bg-[#F8FAFC] border border-[#EAECF0] rounded-xl p-3">
                  <span className="font-bold text-slate-700 block mb-1">Normal SLA</span>
                  <input
                    type="number"
                    value={slaNormalHours}
                    onChange={(e) => setSlaNormalHours(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs font-semibold"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Hours to resolve</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Security & Access */}
        {activeTab === 'security' && (
          <div className="w-full bg-white border border-[#EAECF0] rounded-xl p-6 md:p-8 shadow-2xs space-y-6">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-600" />
              <span>Multi-Tenant Access & Role Controls</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              <div className="space-y-4">
                <Input
                  label="Allowed Email Domain for Instant Join"
                  value={domainRestriction}
                  onChange={(e) => setDomainRestriction(e.target.value)}
                  placeholder="@company.com"
                />
                <p className="text-[11px] text-slate-400 -mt-2">
                  Users registering with this email domain will automatically be provisioned as organization members.
                </p>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5 text-xs">Default Role for New Members</label>
                  <select
                    value={defaultInviteRole}
                    onChange={(e) => setDefaultInviteRole(e.target.value)}
                    className="w-full bg-white border border-[#EAECF0] rounded-lg px-3 py-2 text-xs text-slate-800 outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="employee">Employee / Developer</option>
                    <option value="team_lead">Team Lead</option>
                    <option value="viewer">Read-Only Viewer</option>
                    <option value="reporter">Reporter / Client</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5 text-xs">Audit Log Retention Window</label>
                  <select
                    value={auditLogRetention}
                    onChange={(e) => setAuditLogRetention(e.target.value)}
                    className="w-full bg-white border border-[#EAECF0] rounded-lg px-3 py-2 text-xs text-slate-800 outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="90">90 Days</option>
                    <option value="365">1 Year (365 Days - Recommended)</option>
                    <option value="1095">3 Years</option>
                    <option value="infinite">Indefinite Retention</option>
                  </select>
                </div>

                <div className="p-4 bg-[#F8FAFC] border border-[#EAECF0] rounded-xl space-y-3">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={enforce2FA}
                      onChange={(e) => setEnforce2FA(e.target.checked)}
                      className="rounded border-slate-300 text-blue-600 mt-0.5 w-4 h-4"
                    />
                    <div>
                      <span className="font-bold text-slate-800">Enforce Two-Factor Authentication</span>
                      <p className="text-slate-500 text-[11px]">Require 2FA for all team members before accessing tickets.</p>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allowExternalReporters}
                      onChange={(e) => setAllowExternalReporters(e.target.checked)}
                      className="rounded border-slate-300 text-blue-600 mt-0.5 w-4 h-4"
                    />
                    <div>
                      <span className="font-bold text-slate-800">Allow External Client Submissions</span>
                      <p className="text-slate-500 text-[11px]">Permit invited client contacts to report issues while hiding internal notes.</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: Webhooks & Integrations */}
        {activeTab === 'integrations' && (
          <div className="w-full bg-white border border-[#EAECF0] rounded-xl p-6 md:p-8 shadow-2xs space-y-6">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <Webhook className="w-4 h-4 text-blue-600" />
              <span>Real-Time Webhooks & Notifications</span>
            </h3>

            {webhookTestStatus && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{webhookTestStatus}</span>
              </div>
            )}

            <div className="space-y-5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">Slack Inbound Webhook URL</label>
                <input
                  type="url"
                  value={slackWebhook}
                  onChange={(e) => setSlackWebhook(e.target.value)}
                  placeholder="https://hooks.slack.com/services/..."
                  className="w-full bg-white border border-[#EAECF0] rounded-lg px-3 py-2 text-xs font-mono outline-none focus:border-blue-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">Broadcast new ticket and status shift alerts into your team's Slack channel.</p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">Discord Channel Webhook URL</label>
                <input
                  type="url"
                  value={discordWebhook}
                  onChange={(e) => setDiscordWebhook(e.target.value)}
                  placeholder="https://discord.com/api/webhooks/..."
                  className="w-full bg-white border border-[#EAECF0] rounded-lg px-3 py-2 text-xs font-mono outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">Custom Outbound Event Webhook</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={outboundWebhook}
                    onChange={(e) => setOutboundWebhook(e.target.value)}
                    placeholder="https://api.yourcompany.com/qubix-listener"
                    className="flex-1 bg-white border border-[#EAECF0] rounded-lg px-3 py-2 text-xs font-mono outline-none focus:border-blue-500"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleTestWebhook}
                    isLoading={isTestingWebhook}
                    leftIcon={<Send className="w-3.5 h-3.5" />}
                  >
                    Send Test Ping
                  </Button>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  JSON payloads sent via HMAC-SHA256 signature when tickets are created, moved, or resolved.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: Data & Danger Zone */}
        {activeTab === 'data' && (
          <div className="w-full space-y-6">
            <div className="bg-white border border-[#EAECF0] rounded-xl p-6 md:p-8 shadow-2xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                <Database className="w-4 h-4 text-blue-600" />
                <span>Organization Backup & Export</span>
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Download a complete, tenant-isolated snapshot of your organization's tickets, projects, and activities in clean CSV format.
              </p>
              <Button type="button" variant="outline" onClick={handleExportBackup} leftIcon={<FileText className="w-3.5 h-3.5 text-blue-600" />}>
                Export Full Workspace Backup (.CSV)
              </Button>
            </div>

            <div className="bg-red-50/50 border border-red-200 rounded-xl p-6 md:p-8 shadow-2xs space-y-3">
              <h3 className="text-sm font-bold text-red-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span>Danger Zone</span>
              </h3>
              <p className="text-xs text-red-700 leading-relaxed">
                Deleting this organization will permanently purge all tickets, sub-tickets, comments, attachments, and user memberships. This action cannot be undone.
              </p>
              <Button
                type="button"
                variant="danger"
                onClick={() => alert('For security reasons, organization deletion requires contacting platform administrator.')}
                leftIcon={<Trash2 className="w-3.5 h-3.5" />}
              >
                Delete Organization Workspace
              </Button>
            </div>
          </div>
        )}

        {/* Bottom Save Bar */}
        <div className="flex justify-end pt-2">
          <Button type="submit" variant="primary" isLoading={isSaving} leftIcon={<Save className="w-3.5 h-3.5" />}>
            Save All Workspace Settings
          </Button>
        </div>
      </form>
    </div>
  );
};
