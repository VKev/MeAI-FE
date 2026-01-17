import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchSubscriptionsClient } from '@/services/client/subscription.client';
import {
  useNavigate,
} from "react-router";
import type { Subscription } from "@/models/subscription.model";
import { Check, LogIn } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SESSION_FLAG_KEY } from "@/services/client/api.client";


export default function Pricing() {
  const navigate = useNavigate();
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['subscriptions'],
    queryFn: fetchSubscriptionsClient
  });

  const hasSession = typeof window !== 'undefined' && localStorage.getItem(SESSION_FLAG_KEY) === 'true';

  useEffect(() => {
    if (data) console.log('Client subscriptions:', data);
  }, [data]);

  const handleSubscribeClick = (planId: string) => {
    if (!hasSession) {
      setSelectedPlanId(planId);
      setShowLoginDialog(true);
      return false;
    }
    navigate(`/user/stripe-checkout/${planId}`);
    return true;
  };

  const handleLogin = () => {
    const redirectUrl = selectedPlanId
      ? `/user/stripe-checkout/${selectedPlanId}`
      : '/user/pricing';
    navigate(`/auth/sign-in?redirectTo=${encodeURIComponent(redirectUrl)}`);
  };

  const subscriptions = data?.value || [];

  return (
    <div className="min-h-screen bg-[#0a0a0f] relative">
      {/* Global Background - Single unified layer */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Grid pattern - consistent across all sections */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:64px_64px]" />

        {/* Global gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/10 via-transparent to-pink-900/10" />
      </div>

      {/* Floating Glow Orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="glow-orb-purple top-[10%] -left-[10%] opacity-20 animate-pulse-glow" />
        <div className="glow-orb-magenta top-[30%] -right-[5%] opacity-15 animate-pulse-glow" style={{ animationDelay: '2s' }} />
        <div className="glow-orb-cyan top-[60%] -left-[8%] opacity-15 animate-pulse-glow" style={{ animationDelay: '4s' }} />
      </div>

      {/* Login Required Dialog */}
      <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LogIn className="w-5 h-5 text-purple-400" />
              Login Required
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              You need to sign in to subscribe to a plan. Please login or create an account to continue.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:gap-2">
            <Button
              variant="outline"
              onClick={() => setShowLoginDialog(false)}
              className="flex-1 bg-transparent border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              onClick={handleLogin}
              className="flex-1 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white"
            >
              <LogIn className="w-4 h-4 mr-2" />
              Sign In
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Content */}
      <div className="relative z-10 py-20 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Choose Your Plan
            </h1>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Select the perfect plan for your needs. All plans include access to our AI-powered platform.
            </p>
          </div>

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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {subscriptions.map((plan: Subscription, index: number) => (
                <PricingCard
                  key={plan.id}
                  plan={plan}
                  isPopular={index === 1}
                  onSubscribeClick={handleSubscribeClick}
                  hasSession={hasSession}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PricingCard({
  plan,
  isPopular,
  onSubscribeClick,
  hasSession
}: {
  plan: Subscription;
  isPopular?: boolean;
  onSubscribeClick: (planId: string) => boolean;
  hasSession: boolean;
}) {
  const features = [
    `${plan.limits.number_of_social_accounts} Social Accounts`,
    `${plan.limits.number_of_workspaces} Workspaces`,
    `${plan.limits.rate_limit_for_content_creation} Contents/month`,
    `${plan.meAiCoin} MeAI Coins`,
  ];

  const handleClick = () => {
    onSubscribeClick(plan.id);
  };

  return (
    <div
      className={`relative rounded-2xl p-8 transition-all duration-300 hover:scale-105 ${isPopular
        ? "bg-gradient-to-b from-violet-600/20 to-purple-800/20 border-2 border-violet-500"
        : "bg-slate-800/50 border border-slate-700"
        }`}
    >
      {/* Popular Badge */}
      {isPopular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-violet-600 to-purple-600 rounded-full text-sm font-semibold text-white">
          Most Popular
        </div>
      )}

      {/* Plan Name */}
      <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>

      {/* Duration */}
      <p className="text-slate-400 text-sm mb-4">
        {plan.durationMonths} month{plan.durationMonths > 1 ? "s" : ""}
      </p>

      {/* Price */}
      <div className="mb-6">
        <span className="text-4xl font-bold text-white">${plan.cost}</span>
        <span className="text-slate-400 ml-2">/ {plan.durationMonths}mo</span>
      </div>

      {/* Features */}
      <ul className="space-y-3 mb-8">
        {features.map((feature, idx) => (
          <li key={idx} className="flex items-center gap-3 text-slate-300">
            <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      {/* Subscribe Button */}
      <button
        type="button"
        onClick={handleClick}
        className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-300 ${isPopular
          ? "bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:from-violet-700 hover:to-purple-700 shadow-lg shadow-violet-500/30"
          : "bg-slate-700 text-white hover:bg-slate-600"
          }`}
      >
        Subscribe
      </button>
    </div>
  );
}

