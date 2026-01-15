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
    console.log("🔵 Creating checkout for subscriptionId:", subscriptionId);
    const result = await createStripePurchase(request, subscriptionId);
    console.log("🟢 Stripe API response:", JSON.stringify(result, null, 2));

    if (result.isSuccess && result.value?.checkoutUrl) {
      return redirect(result.value.checkoutUrl);
    }

    const errorMessage = result.error?.description || "Payment failed";
    console.log("🔴 Payment error:", errorMessage);
    return { error: errorMessage };
  } catch (error: any) {
    if (error instanceof Response) {
      console.log("🔴 Requires authentication - redirecting to login");
      return redirect("/auth/sign-in?redirectTo=/pricing");
    }

    console.error("🔴 Stripe checkout exception:", error?.response?.data || error?.message || error);
    console.error("🔴 Full error details:", JSON.stringify({
      status: error?.response?.status,
      statusText: error?.response?.statusText,
      data: error?.response?.data,
      message: error?.message
    }, null, 2));

    // Build detailed error message
    let errorDetail = "An error occurred during checkout";
    if (error?.response?.status) {
      errorDetail = `Request failed with status code ${error?.response?.status}`;
      if (error?.response?.data?.error?.description) {
        errorDetail += `: ${error?.response?.data?.error?.description}`;
      } else if (error?.response?.data?.message) {
        errorDetail += `: ${error?.response?.data?.message}`;
      } else if (typeof error?.response?.data === 'string') {
        errorDetail += `: ${error?.response?.data}`;
      }
    } else if (error?.message) {
      errorDetail = error.message;
    }

    return { error: errorDetail };
  }
}

export default function Pricing() {
  const actionData = useActionData<typeof action>();

  // client side fetching
  const { data, isLoading, error } = useQuery({
    queryKey: ['subscriptions'],
    queryFn: fetchSubscriptionsClient
  });

  useEffect(() => {
    if (data) console.log('Client subscriptions:', data);
  }, [data]);

  if (isLoading) return <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center text-white">Loading...</div>;
  if (error) return <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center text-red-400">Error loading subscriptions</div>;

  const subscriptions = data?.value || [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 py-20 px-4">
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

        {/* Error Message */}
        {actionData?.error && (
          <div className="max-w-md mx-auto mb-8 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-center">
            {actionData.error}
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {subscriptions.map((plan: Subscription, index: number) => (
            <PricingCard
              key={plan.id}
              plan={plan}
              isPopular={index === 1}
            />
          ))}
        </div>
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
      <Form method="post">
        <input type="hidden" name="subscriptionId" value={plan.id} />
        <button
          type="submit"
          className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-300 ${isPopular
            ? "bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:from-violet-700 hover:to-purple-700 shadow-lg shadow-violet-500/30"
            : "bg-slate-700 text-white hover:bg-slate-600"
            }`}
        >
          Subscribe
        </button>
      </Form>
    </div>
  );
}
