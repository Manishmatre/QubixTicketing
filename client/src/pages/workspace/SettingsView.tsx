import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../api/client';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Settings, Building, Sliders, Shield, Save } from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { organization, updateOrganization } = useAuth();

  const [name, setName] = useState<string>('');
  const [website, setWebsite] = useState<string>('');
  const [industry, setIndustry] = useState<string>('');
  const [size, setSize] = useState<string>('');
  const [ticketPrefix, setTicketPrefix] = useState<string>('QUB');
  const [timezone, setTimeZone] = useState<string>('UTC');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  useEffect(() => {
    if (organization) {
      setName(organization.name || '');
      setWebsite(organization.website || '');
      setIndustry(organization.industry || 'Technology');
      setSize(organization.size || '10-50');
      setTicketPrefix(organization.settings?.ticketPrefix || 'QUB');
      setTimeZone(organization.settings?.timezone || 'UTC');
    }
  }, [organization]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await apiClient.patch('/organizations/current', {
        name: name.trim(),
        website: website.trim(),
        industry,
        size,
        settings: {
          ticketPrefix: ticketPrefix.toUpperCase().trim(),
          timezone,
        },
      });

      if (res.data.success) {
        alert('Workspace settings updated successfully!');
        updateOrganization(res.data.data);
      }
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to update settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex-1 p-6 md:p-8 space-y-6 overflow-y-auto bg-white font-sans text-slate-800">
      <div className="pb-4 border-b border-[#EAECF0]">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          Workspace Settings
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure organization identity, issue numbering rules, and default environment values.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6 max-w-2xl text-xs">
        {/* General Details */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-subtle space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Building className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">Company Information</h3>
          </div>

          <Input
            label="Organization Legal Name *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Company Website"
              placeholder="https://company.com"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
            />

            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">Industry</label>
              <select
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-600"
              >
                <option value="Technology">Technology & SaaS</option>
                <option value="IT Services">IT Services & Support</option>
                <option value="Financial Services">Financial Services</option>
                <option value="Healthcare">Healthcare</option>
                <option value="Education">Education</option>
              </select>
            </div>
          </div>
        </div>

        {/* Ticketing Rules */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-subtle space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Sliders className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">Issue Numbering & Prefixes</h3>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Ticket Prefix (e.g. QUB, DEV, BUG) *"
              value={ticketPrefix}
              onChange={(e) => setTicketPrefix(e.target.value.toUpperCase())}
              maxLength={6}
              required
            />

            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">Workspace Timezone</label>
              <select
                value={timezone}
                onChange={(e) => setTimeZone(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-600"
              >
                <option value="UTC">UTC (Coordinated Universal Time)</option>
                <option value="America/New_York">America/New_York (EST)</option>
                <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
                <option value="Europe/London">Europe/London (GMT)</option>
                <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
                <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
              </select>
            </div>
          </div>
          <p className="text-[11px] text-slate-400">
            All subsequent tickets created in this workspace will format as {ticketPrefix}-000001.
          </p>
        </div>

        <div className="flex justify-end pt-2">
          <Button type="submit" variant="primary" isLoading={isSaving} leftIcon={<Save className="w-4 h-4" />}>
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
};

