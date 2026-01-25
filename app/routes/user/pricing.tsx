import { useEffect, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { fetchSubscriptionsClient } from '@/services/client/subscription.client';
import { useNavigate, useSearchParams } from "react-router";
import type { Subscription } from "@/models/subscription.model";
import { Check, ArrowLeft } from "lucide-react";
import { StripeProvider, PaymentForm } from '@/components/stripe';
import { Button } from '@/components/ui/button';
import { clientFetch } from '@/services/client/api.client';

type PaymentData = {
    subscriptionId: string;
    cost: number;
    currency: string;
    amount: number;
    clientSecret: string;
    planName: string;
};

type PurchaseResponse = {
    value: {
        subscriptionId: string;
        cost: number;
        currency: string;
        amount: number;
        clientSecret: string;
    };
    isSuccess: boolean;
    error: {
        description: string;
    };
};

export default function UserPricing() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [selectedPlan, setSelectedPlan] = useState<Subscription | null>(null);
    const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [autoCheckoutTriggered, setAutoCheckoutTriggered] = useState(false);

    const { data, isLoading, error: fetchError } = useQuery({
        queryKey: ['subscriptions'],
        queryFn: fetchSubscriptionsClient
    });

    const subscriptions = data?.value || [];

    const purchaseMutation = useMutation({
        mutationFn: async (subscriptionId: string) => {
            return clientFetch<PurchaseResponse>(
                `/api/User/subscriptions/${subscriptionId}/purchase`,
                {
                    method: 'POST',
                    data: { paymentMethodId: null, renew: true }
                },
                { auth: true }
            );
        },
        onSuccess: (result, subscriptionId) => {
            if (result.isSuccess && result.value?.clientSecret) {
                const plan = subscriptions.find(p => p.id === subscriptionId);
                setPaymentData({
                    subscriptionId: result.value.subscriptionId,
                    cost: result.value.cost,
                    currency: result.value.currency,
                    amount: result.value.amount,
                    clientSecret: result.value.clientSecret,
                    planName: plan?.name || 'Subscription'
                });
                setError(null);
                searchParams.delete('plan');
                setSearchParams(searchParams, { replace: true });
            } else {
                setError(result.error?.description || 'Failed to create payment');
            }
        },
        onError: (err: any) => {
            if (err?.response?.status === 401) {
                navigate('/auth/sign-in?redirectTo=/user/pricing');
                return;
            }
            setError(err?.response?.data?.message || err?.message || 'Failed to create payment');
        }
    });

    useEffect(() => {
        if (data) console.log('User subscriptions:', data);
    }, [data]);

    useEffect(() => {
        const planId = searchParams.get('plan');
        if (planId && subscriptions.length > 0 && !autoCheckoutTriggered && !purchaseMutation.isPending) {
            const plan = subscriptions.find(p => p.id === planId);
            if (plan) {
                setAutoCheckoutTriggered(true);
                setSelectedPlan(plan);
                purchaseMutation.mutate(planId);
            }
        }
    }, [searchParams, subscriptions, autoCheckoutTriggered, purchaseMutation.isPending]);

    const handleSelectPlan = (plan: Subscription) => {
        setSelectedPlan(plan);
        setError(null);
        purchaseMutation.mutate(plan.id);
    };

    const handlePaymentSuccess = () => {
        setPaymentData(null);
        setSelectedPlan(null);
        navigate('/user/dashboard');
    };

    const handlePaymentCancel = () => {
        setPaymentData(null);
        setSelectedPlan(null);
        setError(null);
    };

    if (paymentData) {
        return (
            <div className="min-h-screen py-12 px-6">
                <div className="max-w-lg mx-auto">
                    <Button
                        variant="ghost"
                        onClick={handlePaymentCancel}
                        className="mb-6 text-slate-400 hover:text-white"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Plans
                    </Button>

                    <div className="bg-neutral-900 rounded-2xl p-6 border border-neutral-700">
                        <h2 className="text-xl font-bold text-white mb-6">Complete Payment</h2>
                        <StripeProvider clientSecret={paymentData.clientSecret}>
                            <PaymentForm
                                amount={paymentData.amount}
                                currency={paymentData.currency}
                                planName={paymentData.planName}
                                onSuccess={handlePaymentSuccess}
                                onCancel={handlePaymentCancel}
                            />
                        </StripeProvider>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen py-12 px-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-12">
                    <h1 className="text-3xl font-bold text-white mb-2">
                        Pricing Plans
                    </h1>
                    <p className="text-slate-400">
                        Upgrade your plan to unlock more features and capabilities.
                    </p>
                </div>

                {/* Loading State */}
                {isLoading && (
                    <div className="flex items-center justify-center text-white py-20">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500 mr-3"></div>
                        Loading plans...
                    </div>
                )}

                {/* Fetch Error State */}
                {fetchError && (
                    <div className="max-w-md mx-auto mb-8 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-center">
                        Error loading subscriptions. Please try again.
                    </div>
                )}

                {/* Purchase Error Message */}
                {error && (
                    <div className="max-w-md mx-auto mb-8 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-center">
                        {error}
                    </div>
                )}

                {/* Pricing Cards */}
                {!isLoading && !fetchError && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {subscriptions.map((plan: Subscription, index: number) => (
                            <PricingCard
                                key={plan.id}
                                plan={plan}
                                isPopular={index === 1}
                                isLoading={purchaseMutation.isPending && selectedPlan?.id === plan.id}
                                onSelect={() => handleSelectPlan(plan)}
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
    isLoading,
    onSelect
}: {
    plan: Subscription;
    isPopular?: boolean;
    isLoading?: boolean;
    onSelect: () => void;
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

    return (
        <div
            className={`relative rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02] ${isPopular
                ? "bg-linear-to-b from-violet-600/20 to-purple-800/20 border-2 border-violet-500"
                : "bg-neutral-800/50 border border-neutral-700"
                }`}
        >
            {/* Popular Badge */}
            {isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-linear-to-r from-violet-600 to-purple-600 rounded-full text-xs font-semibold text-white">
                    Most Popular
                </div>
            )}

            {/* Plan Name */}
            <h3 className="text-xl font-bold text-white mb-1">{plan.name}</h3>

            {/* Duration */}
            <p className="text-slate-400 text-sm mb-4">
                {plan.durationMonths} month{plan.durationMonths > 1 ? "s" : ""}
            </p>

            {/* Price */}
            <div className="mb-5">
                <span className="text-3xl font-bold text-white">{formatPrice(plan.cost)}</span>
                <span className="text-slate-400 ml-2">/ {plan.durationMonths}mo</span>
            </div>

            {/* Features */}
            <ul className="space-y-2 mb-6">
                {features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-slate-300 text-sm">
                        <Check className="w-4 h-4 text-green-500 shrink-0" />
                        <span>{feature}</span>
                    </li>
                ))}
            </ul>

            {/* Subscribe Button */}
            <button
                onClick={onSelect}
                disabled={isLoading}
                className={`w-full py-2.5 px-4 rounded-lg font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${isPopular
                    ? "bg-linear-to-r from-violet-600 to-purple-600 text-white hover:from-violet-700 hover:to-purple-700 shadow-lg shadow-violet-500/30"
                    : "bg-neutral-700 text-white hover:bg-neutral-600"
                    }`}
            >
                {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Processing...
                    </span>
                ) : (
                    'Subscribe'
                )}
            </button>
        </div>
    );
}
