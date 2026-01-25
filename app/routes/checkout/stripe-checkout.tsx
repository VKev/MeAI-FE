import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useQuery, useMutation } from '@tanstack/react-query';
import { fetchSubscriptionsClient } from '@/services/client/subscription.client';
import { StripeProvider, PaymentForm } from '@/components/stripe';
import { clientFetch } from '@/services/client/api.client';
import { ArrowLeft, Loader2, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';

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

export default function StripeCheckout() {
    const { planId } = useParams<{ planId: string }>();
    const navigate = useNavigate();
    const [error, setError] = useState<string | null>(null);

    const { data: subscriptionsData } = useQuery({
        queryKey: ['subscriptions'],
        queryFn: fetchSubscriptionsClient
    });

    const plan = subscriptionsData?.value?.find(p => p.id === planId);

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
        onError: (err: any) => {
            if (err?.response?.status === 401) {
                navigate(`/auth/sign-in?redirectTo=/checkout/${planId}`);
                return;
            }
            setError(err?.response?.data?.message || err?.message || 'Failed to create payment');
        }
    });

    useEffect(() => {
        if (planId && !purchaseMutation.data && !purchaseMutation.isPending && !purchaseMutation.isError) {
            purchaseMutation.mutate(planId);
        }
    }, [planId]);

    const handlePaymentSuccess = () => {
        navigate('/user/dashboard');
    };

    const handlePaymentCancel = () => {
        navigate('/user/plan');
    };

    const paymentData = purchaseMutation.data;

    // Loading state
    if (purchaseMutation.isPending || !paymentData) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto mb-4">
                        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                    </div>
                    <p className="text-slate-400">Preparing checkout...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error || !paymentData?.isSuccess) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 flex items-center justify-center px-4">
                <div className="max-w-md w-full text-center">
                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6 mb-4">
                        <p className="text-red-400">{error || paymentData?.error?.description || 'Failed to create payment session'}</p>
                    </div>
                    <Button onClick={() => navigate('/user/plan')} variant="outline" className="border-neutral-600 text-slate-300 hover:bg-neutral-800">
                        Back to Pricing
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 py-12 px-6">
            <div className="max-w-lg mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto mb-4">
                        <CreditCard className="w-8 h-8 text-purple-400" />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">Complete Your Purchase</h1>
                    <p className="text-slate-400">Secure payment powered by Stripe</p>
                </div>

                <Button
                    variant="ghost"
                    onClick={handlePaymentCancel}
                    className="mb-6 text-slate-400 hover:text-white"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Plans
                </Button>

                <div className="bg-neutral-900 rounded-2xl p-6 border border-neutral-700 shadow-xl shadow-purple-500/5">
                    <h2 className="text-xl font-bold text-white mb-6">Payment Details</h2>
                    <StripeProvider clientSecret={paymentData.value.clientSecret}>
                        <PaymentForm
                            amount={paymentData.value.amount}
                            currency={paymentData.value.currency}
                            planName={plan?.name || 'Subscription'}
                            onSuccess={handlePaymentSuccess}
                            onCancel={handlePaymentCancel}
                        />
                    </StripeProvider>
                </div>

                {/* Footer */}
                <p className="text-xs text-center text-slate-500 mt-6">
                    By completing this purchase, you agree to our Terms of Service and Privacy Policy.
                </p>
            </div>
        </div>
    );
}
