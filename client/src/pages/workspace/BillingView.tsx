import React, { useState, useEffect } from 'react';
import { Plan } from '../../types';
import { apiClient } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import {
  CreditCard,
  Check,
  Zap,
  Shield,
  FileText,
  AlertCircle,
  Download,
  Clock,
  Sparkles,
  Users,
  FolderKanban,
  Layers,
  Lock,
} from 'lucide-react';
import { format } from 'date-fns';

export const BillingView: React.FC = () => {
  const { organization, updateOrganization } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [billingInfo, setBillingInfo] = useState<any>(null);
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isUpgrading, setIsUpgrading] = useState<string | null>(null);

  const userRole = organization?.role || 'employee';
  const isOrgAdmin = userRole === 'owner' || userRole === 'admin';

  const fetchBillingData = async () => {
    setIsLoading(true);
    try {
      const [plansRes, currentRes] = await Promise.all([
        apiClient.get('/subscriptions/plans'),
        apiClient.get('/subscriptions/current'),
      ]);

      if (plansRes.data.success) setPlans(plansRes.data.data.filter((p: any) => p.code !== 'free'));
      if (currentRes.data.success) setBillingInfo(currentRes.data.data);
    } catch (err) {
      console.error('Fetch billing data error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBillingData();
  }, []);

  const handleUpgrade = async (planCode: string) => {
    setIsUpgrading(planCode);
    try {
      const res = await apiClient.post('/subscriptions/upgrade', {
        planCode,
        billingInterval,
      });
      if (res.data.success) {
        alert(res.data.message || 'Subscription successfully updated!');
        updateOrganization({
          subscriptionPlan: planCode as any,
          subscriptionStatus: 'active',
        });
        fetchBillingData();
      }
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Upgrade failed');
    } finally {
      setIsUpgrading(null);
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
          Subscription management and billing plans can only be managed by workspace owners and administrators.
        </p>
      </div>
    );
  }

  if (isLoading || !billingInfo) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  const limits = billingInfo.effectiveLimits || {};
  const isTrial = limits.isTrial && !limits.isTrialExpired;
  const isTrialExpired = limits.isTrialExpired;
  const currentPlan = organization?.subscriptionPlan || 'starter';

  const userUsagePercent = Math.min(100, Math.round(((billingInfo.usage?.currentUsers || 1) / (limits.maxUsers || 5)) * 100));
  const projectUsagePercent = Math.min(100, Math.round(((billingInfo.usage?.currentProjects || 1) / (limits.maxProjects || 3)) * 100));
  const ticketUsagePercent = Math.min(100, Math.round(((billingInfo.usage?.currentTickets || 0) / (limits.maxTickets || 500)) * 100));

  return (
    <div className="flex-1 p-5 space-y-4 overflow-y-auto bg-white font-sans text-slate-800">
      {/* Header */}
      <div className="pb-3 border-b border-[#EAECF0]">
        <h2 className="text-lg font-bold text-slate-900 tracking-tight">
          Subscription & Resource Quotas
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Manage workspace limits, plans, payment methods, and billing invoice history.
        </p>
      </div>

      {/* Trial Status Banners */}
      {isTrial && (
        <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50/70 border border-blue-200 rounded-xl flex items-start gap-3">
          <div className="p-1.5 bg-blue-600 text-white rounded-lg shrink-0 mt-0.5">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold text-blue-950">14-Day Free Trial (Full Platform Access)</h4>
              <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                {limits.daysLeftInTrial} days remaining
              </span>
            </div>
            <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
              All features are fully unlocked for your team. When the trial ends, your workspace will automatically move to the Free Plan with minimal resource limits, or you can select a plan below to keep uninterrupted scale.
            </p>
          </div>
        </div>
      )}

      {isTrialExpired && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
          <div className="p-1.5 bg-amber-500 text-white rounded-lg shrink-0 mt-0.5">
            <AlertCircle className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold text-amber-950">Free Trial Expired — Operating on Free Tier</h4>
              <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                Resource Limits Enforced
              </span>
            </div>
            <p className="text-[11px] text-amber-800/90 mt-0.5 leading-relaxed">
              Your 14-day trial has concluded. Your workspace is currently limited to 3 team members, 2 active projects, and 50 tickets. Choose an upgraded plan below to unlock unlimited tickets, workflows, and additional teammates.
            </p>
          </div>
        </div>
      )}

      {/* Current Plan & Resource Usage Summary */}
      <div className="bg-[#F8FAFC] border border-[#EAECF0] rounded-xl p-5 shadow-2xs grid grid-cols-1 md:grid-cols-4 gap-5 items-center">
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Active Tier
          </span>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xl font-bold text-slate-900 capitalize">
              {limits.planName || `${currentPlan} Plan`}
            </span>
            <Badge variant={isTrial ? 'primary' : isTrialExpired ? 'warning' : 'success'} size="sm">
              {billingInfo.status || 'Active'}
            </Badge>
          </div>
          <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <Clock className="w-3 h-3 text-slate-400" />
            {isTrial
              ? `Trial ends ${format(new Date(billingInfo.trialEndsAt), 'MMM d, yyyy')}`
              : isTrialExpired
              ? 'Operating on Free Tier'
              : 'Active Subscription'}
          </p>
        </div>

        {/* User Seats Usage */}
        <div className="bg-white border border-[#EAECF0] p-3 rounded-lg">
          <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
            <span className="flex items-center gap-1.5"><Users className="w-3 h-3 text-slate-400" /> Members</span>
            <span className="font-mono text-[11px]">{billingInfo.usage?.currentUsers || 1} / {limits.maxUsers || 5}</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-1.5 rounded-full ${userUsagePercent >= 100 ? 'bg-red-500' : 'bg-blue-600'}`}
              style={{ width: `${userUsagePercent}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-400 mt-1">{limits.maxUsers - (billingInfo.usage?.currentUsers || 1)} seats available</p>
        </div>

        {/* Project Usage */}
        <div className="bg-white border border-[#EAECF0] p-3 rounded-lg">
          <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
            <span className="flex items-center gap-1.5"><FolderKanban className="w-3 h-3 text-slate-400" /> Projects</span>
            <span className="font-mono text-[11px]">{billingInfo.usage?.currentProjects || 1} / {limits.maxProjects || 3}</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-1.5 rounded-full ${projectUsagePercent >= 100 ? 'bg-red-500' : 'bg-emerald-600'}`}
              style={{ width: `${projectUsagePercent}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-400 mt-1">{limits.maxProjects - (billingInfo.usage?.currentProjects || 1)} projects available</p>
        </div>

        {/* Ticket Usage */}
        <div className="bg-white border border-[#EAECF0] p-3 rounded-lg">
          <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
            <span className="flex items-center gap-1.5"><Layers className="w-3 h-3 text-slate-400" /> Tickets</span>
            <span className="font-mono text-[11px]">{billingInfo.usage?.currentTickets || 0} / {limits.maxTickets || 500}</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-1.5 rounded-full ${ticketUsagePercent >= 100 ? 'bg-red-500' : 'bg-indigo-600'}`}
              style={{ width: `${ticketUsagePercent}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-400 mt-1">{Math.max(0, limits.maxTickets - (billingInfo.usage?.currentTickets || 0))} tickets available</p>
        </div>
      </div>

      {/* Plan Selection Cards */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Upgrade or Switch Workspace Plan</h3>
            <p className="text-xs text-slate-500">Scale your seat count, project workspaces, and automated workflows.</p>
          </div>
          <div className="bg-slate-100 p-1 rounded-lg flex items-center text-xs font-semibold">
            <button
              onClick={() => setBillingInterval('monthly')}
              className={`px-3 py-1 rounded transition-all ${
                billingInterval === 'monthly' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-500'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingInterval('yearly')}
              className={`px-3 py-1 rounded transition-all ${
                billingInterval === 'yearly' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-500'
              }`}
            >
              Yearly (Save 20%)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {plans.map((p) => {
            const isCurrent = !isTrial && !isTrialExpired && currentPlan === p.code;
            const price = billingInterval === 'yearly' ? Math.round(p.priceYearly / 12) : p.priceMonthly;

            return (
              <div
                key={p.code}
                className={`bg-white border rounded-xl p-5 shadow-2xs flex flex-col justify-between transition-all ${
                  isCurrent
                    ? 'border-blue-600 ring-2 ring-blue-500/20'
                    : 'border-[#EAECF0] hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <h4 className="text-sm font-bold text-slate-900">{p.name}</h4>
                    {isCurrent && (
                      <span className="text-[10px] font-bold uppercase bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                        Current
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 min-h-[32px] leading-snug">{p.description}</p>

                  <div className="my-4 flex items-baseline">
                    <span className="text-2xl font-extrabold text-slate-900">${price}</span>
                    <span className="text-xs text-slate-400 ml-1">/ month</span>
                  </div>

                  <div className="space-y-1.5 text-xs border-t border-slate-100 pt-3">
                    {p.features?.map((f, i) => (
                      <div key={i} className="flex items-center gap-2 text-slate-700 text-[11px]">
                        <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100">
                  <Button
                    variant={isCurrent ? 'outline' : 'primary'}
                    disabled={isCurrent}
                    isLoading={isUpgrading === p.code}
                    onClick={() => handleUpgrade(p.code)}
                    className="w-full text-xs font-bold"
                  >
                    {isCurrent ? 'Current Plan' : `Upgrade to ${p.name}`}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
