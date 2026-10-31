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
} from 'lucide-react';
import { format } from 'date-fns';

export const BillingView: React.FC = () => {
  const { organization, updateOrganization } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [billingInfo, setBillingInfo] = useState<any>(null);
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isUpgrading, setIsUpgrading] = useState<string | null>(null);

  const fetchBillingData = async () => {
    setIsLoading(true);
    try {
      const [plansRes, currentRes] = await Promise.all([
        apiClient.get('/subscriptions/plans'),
        apiClient.get('/subscriptions/current'),
      ]);

      if (plansRes.data.success) setPlans(plansRes.data.data);
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

  if (isLoading || !billingInfo) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  const currentPlan = organization?.subscriptionPlan || 'starter';

  return (
    <div className="flex-1 p-5 space-y-4 overflow-y-auto bg-white font-sans text-slate-800">
      {/* Header */}
      <div className="pb-3 border-b border-[#EAECF0]">
        <h2 className="text-lg font-bold text-slate-900 tracking-tight">
          Subscription & Billing
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Manage workspace limits, plans, payment methods, and billing invoice history.
        </p>
      </div>

      {/* Current Plan & Usage Summary */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-subtle grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        <div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Active Workspace Tier
          </span>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-extrabold text-slate-900 capitalize">
              {currentPlan} Plan
            </span>
            <Badge variant="success" size="sm">
              {billingInfo.status || 'Active'}
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Trial ends: {billingInfo.trialEndsAt ? format(new Date(billingInfo.trialEndsAt), 'MMM d, yyyy') : 'No expiry'}
          </p>
        </div>

        {/* User Seats Usage */}
        <div>
          <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1.5">
            <span>Team Members</span>
            <span>{billingInfo.usage?.currentUsers || 1} seats in use</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div className="bg-blue-600 h-2 rounded-full w-1/4" />
          </div>
        </div>

        {/* Project Usage */}
        <div>
          <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1.5">
            <span>Active Projects</span>
            <span>{billingInfo.usage?.currentProjects || 1} active projects</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div className="bg-emerald-600 h-2 rounded-full w-2/5" />
          </div>
        </div>
      </div>

      {/* Plan Selection Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900">Available Subscription Plans</h3>
          <div className="bg-slate-100 p-1 rounded-lg flex items-center text-xs font-semibold">
            <button
              onClick={() => setBillingInterval('monthly')}
              className={`px-3 py-1 rounded transition-all ${
                billingInterval === 'monthly' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
              }`}
            >
              Monthly billing
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

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {plans.map((p) => {
            const isCurrent = currentPlan === p.code;
            const price = billingInterval === 'yearly' ? Math.round(p.priceYearly / 12) : p.priceMonthly;

            return (
              <div
                key={p.code}
                className={`bg-white border rounded-xl p-5 shadow-subtle flex flex-col justify-between transition-all ${
                  isCurrent ? 'border-blue-600 ring-2 ring-blue-500/20 shadow-card' : 'border-slate-200'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-base font-extrabold text-slate-900">{p.name}</h4>
                    {isCurrent && (
                      <span className="text-[10px] font-bold uppercase bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                        Current
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 h-10 leading-snug">{p.description}</p>

                  <div className="my-5 flex items-baseline">
                    <span className="text-3xl font-extrabold text-slate-900">${price}</span>
                    <span className="text-xs text-slate-400 ml-1">/ month</span>
                  </div>

                  <div className="space-y-2 text-xs border-t border-slate-100 pt-4">
                    {p.features?.map((f, i) => (
                      <div key={i} className="flex items-center gap-2 text-slate-700">
                        <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100">
                  <Button
                    variant={isCurrent ? 'outline' : 'primary'}
                    disabled={isCurrent}
                    isLoading={isUpgrading === p.code}
                    onClick={() => handleUpgrade(p.code)}
                    className="w-full text-xs"
                  >
                    {isCurrent ? 'Current Plan' : `Upgrade to ${p.name}`}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Invoice History Table */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-subtle">
        <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-600" /> Billing History & Invoices
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase">
              <tr>
                <th className="py-2.5 px-4">Invoice ID</th>
                <th className="py-2.5 px-4">Amount</th>
                <th className="py-2.5 px-4">Date</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4 text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {billingInfo.subscription?.invoices?.length > 0 ? (
                billingInfo.subscription.invoices.map((inv: any) => (
                  <tr key={inv.invoiceId}>
                    <td className="py-3 px-4 font-mono font-medium text-slate-800">{inv.invoiceId}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">${inv.amount} USD</td>
                    <td className="py-3 px-4 text-slate-500">{format(new Date(inv.date), 'MMM d, yyyy')}</td>
                    <td className="py-3 px-4">
                      <Badge variant="success" size="sm">Paid</Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button className="text-blue-600 hover:underline font-semibold flex items-center gap-1 ml-auto">
                        <Download className="w-3 h-3" /> PDF
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="text-center py-6 text-slate-400">
                    No past invoices on file.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

