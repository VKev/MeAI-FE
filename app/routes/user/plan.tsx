import { useQuery } from '@tanstack/react-query';
import { fetchSubscriptionsClient } from '@/services/client/subscription.client';
import { useNavigate } from 'react-router';
import type { Subscription } from '@/models/subscription.model';
import { Check, Crown, Zap, Sparkles, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUserStore } from '@/store/user.store';

export default function Plan() {
  const navigate = useNavigate();
  const user = useUserStore((s) => s.user);

  const { data, isLoading, error } = useQuery({
    queryKey: ['subscriptions'],
    queryFn: fetchSubscriptionsClient
  });

  const handleSubscribeClick = (planId: string) => {
    navigate(`/checkout/${planId}`);
  };

  const subscriptions = data?.value || [];

  return (
    <div className="min-h-screen py-8 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <Crown className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">Subscription Plans</h1>
          </div>
          <p className="text-slate-400 ml-13">
            Choose the plan that best fits your needs. Upgrade or change your subscription anytime.
          </p>
        </div>

        {/* Current Plan Info */}
        {user && (
          <div className="mb-8 p-5 bg-gradient-to-r from-violet-500/10 to-purple-600/10 rounded-xl border border-violet-500/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    Welcome back, {user.fullName || user.username}!
                  </h3>
                  <p className="text-sm text-slate-400">
                    <span className="text-violet-400 font-medium">{user.meAiCoin || 0}</span> MeAI Coins available
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-400">Manage billing</span>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center text-white py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500 mr-3"></div>
            Loading plans...
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="max-w-md mx-auto mb-8 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-center">
            Error loading subscriptions. Please try again.
          </div>
        )}

        {/* Pricing Cards */}
        {!isLoading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {subscriptions.map((plan: Subscription, index: number) => (
              <PricingCard
                key={plan.id}
                plan={plan}
                isPopular={index === 1}
                onSubscribeClick={handleSubscribeClick}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PricingCard({
  plan,
  isPopular,
  onSubscribeClick,
}: {
  plan: Subscription;
  isPopular?: boolean;
  onSubscribeClick: (planId: string) => void;
}) {
  const features = [
    `${plan.limits.number_of_social_accounts} Social Accounts`,
    `${plan.limits.number_of_workspaces} Workspaces`,
    `${plan.limits.rate_limit_for_content_creation} Contents/month`,
    `${plan.meAiCoin} MeAI Coins`,
  ];

  const formatPrice = (cost: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(cost);
  };

  const handleClick = () => {
    onSubscribeClick(plan.id);
  };

  return (
    <div
      className={`relative rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02] ${isPopular
        ? 'bg-gradient-to-b from-violet-600/20 to-purple-800/20 border-2 border-violet-500'
        : 'bg-neutral-800/50 border border-neutral-700'
        }`}
    >
      {/* Popular Badge */}
      {isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-violet-600 to-purple-600 rounded-full text-xs font-semibold text-white flex items-center gap-1">
          <Zap className="w-3 h-3" />
          Most Popular
        </div>
      )}

      {/* Plan Name */}
      <h3 className="text-xl font-bold text-white mb-1">{plan.name}</h3>

      {/* Duration */}
      <p className="text-slate-400 text-sm mb-4">
        {plan.durationMonths} month{plan.durationMonths > 1 ? 's' : ''}
      </p>

      {/* Price */}
      <div className="mb-5">
        <span className="text-3xl font-bold text-white">{formatPrice(plan.cost)}</span>
        <span className="text-slate-400 ml-2">/ {plan.durationMonths}mo</span>
      </div>

      {/* Features */}
      <ul className="space-y-2.5 mb-6">
        {features.map((feature, idx) => (
          <li key={idx} className="flex items-center gap-2.5 text-slate-300 text-sm">
            <Check className="w-4 h-4 text-green-500 shrink-0" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      {/* Subscribe Button */}
      <Button
        onClick={handleClick}
        className={`w-full py-2.5 font-medium transition-all duration-300 ${isPopular
          ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:from-violet-700 hover:to-purple-700 shadow-lg shadow-violet-500/30'
          : 'bg-neutral-700 text-white hover:bg-neutral-600'
          }`}
      >
        Subscribe Now
      </Button>
    </div>
  );
}
