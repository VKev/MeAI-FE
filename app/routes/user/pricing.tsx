import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchSubscriptionsClient } from '@/services/client/subscription.client';
import { createStripePurchase } from "@/services/server/stripe.server";
import {
    useActionData,
    Form,
    redirect,
    type ActionFunctionArgs,
} from "react-router";
import type { Subscription } from "@/models/subscription.model";
import { Check } from "lucide-react";

export async function action({ request }: ActionFunctionArgs) {
    const formData = await request.formData();
    const subscriptionId = formData.get("subscriptionId") as string;

    if (!subscriptionId) {
        return { error: "Subscription ID is required" };
    }

    try {
        console.log("[Pricing] Creating checkout for subscriptionId:", subscriptionId);
        const result = await createStripePurchase(request, subscriptionId);
        console.log("[Pricing] Stripe API response:", JSON.stringify(result, null, 2));

        if (result.isSuccess && result.value?.checkoutUrl) {
            return redirect(result.value.checkoutUrl);
        }

        const errorMessage = result.error?.description || "Payment failed";
        console.log("[Pricing] Payment error:", errorMessage);
        return { error: errorMessage };
    } catch (error: any) {
        if (error instanceof Response) {
            console.log("[Pricing] Requires authentication - redirecting to login");
            return redirect("/auth/sign-in?redirectTo=/user/pricing");
        }

        console.error("[Pricing] Stripe checkout exception:", error?.response?.data || error?.message || error);

        let errorDetail = "An error occurred during checkout";
        if (error?.response?.status) {
            errorDetail = `Request failed with status code ${error?.response?.status}`;
            if (error?.response?.data?.error?.description) {
                errorDetail += `: ${error?.response?.data?.error?.description}`;
            } else if (error?.response?.data?.message) {
                errorDetail += `: ${error?.response?.data?.message}`;
            }
        } else if (error?.message) {
            errorDetail = error.message;
        }

        return { error: errorDetail };
    }
}

export default function UserPricing() {
    const actionData = useActionData<typeof action>();

    const { data, isLoading, error } = useQuery({
        queryKey: ['subscriptions'],
        queryFn: fetchSubscriptionsClient
    });

    useEffect(() => {
        if (data) console.log('User subscriptions:', data);
    }, [data]);

    const subscriptions = data?.value || [];

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

                {/* Error State */}
                {error && (
                    <div className="max-w-md mx-auto mb-8 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-center">
                        Error loading subscriptions. Please try again.
                    </div>
                )}

                {/* Action Error Message */}
                {actionData?.error && (
                    <div className="max-w-md mx-auto mb-8 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-center">
                        {actionData.error}
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
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function PricingCard({ plan, isPopular }: { plan: Subscription; isPopular?: boolean }) {
    const features = [
        `${plan.limits.number_of_social_accounts} Social Accounts`,
        `${plan.limits.number_of_workspaces} Workspaces`,
        `${plan.limits.rate_limit_for_content_creation} Contents/month`,
        `${plan.meAiCoin} MeAI Coins`,
    ];

    return (
        <div
            className={`relative rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02] ${isPopular
                ? "bg-gradient-to-b from-violet-600/20 to-purple-800/20 border-2 border-violet-500"
                : "bg-neutral-800/50 border border-neutral-700"
                }`}
        >
            {/* Popular Badge */}
            {isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-violet-600 to-purple-600 rounded-full text-xs font-semibold text-white">
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
                <span className="text-3xl font-bold text-white">${plan.cost}</span>
                <span className="text-slate-400 ml-2">/ {plan.durationMonths}mo</span>
            </div>

            {/* Features */}
            <ul className="space-y-2 mb-6">
                {features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-slate-300 text-sm">
                        <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span>{feature}</span>
                    </li>
                ))}
            </ul>

            {/* Subscribe Button */}
            <Form method="post">
                <input type="hidden" name="subscriptionId" value={plan.id} />
                <button
                    type="submit"
                    className={`w-full py-2.5 px-4 rounded-lg font-medium transition-all duration-300 ${isPopular
                        ? "bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:from-violet-700 hover:to-purple-700 shadow-lg shadow-violet-500/30"
                        : "bg-neutral-700 text-white hover:bg-neutral-600"
                        }`}
                >
                    Subscribe
                </button>
            </Form>
        </div>
    );
}
