import { useState } from 'react';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Loader2, CreditCard, CheckCircle, XCircle } from 'lucide-react';

interface PaymentFormProps {
    amount: number;
    currency: string;
    planName: string;
    onSuccess: () => void;
    onCancel: () => void;
    lightMode?: boolean;
}

export function PaymentForm({ amount, currency, planName, onSuccess, onCancel, lightMode = false }: PaymentFormProps) {
    const stripe = useStripe();
    const elements = useElements();
    const [isProcessing, setIsProcessing] = useState(false);
    const [paymentStatus, setPaymentStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const formatCurrency = (value: number, curr: string) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: curr.toUpperCase(),
        }).format(value);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!stripe || !elements) {
            return;
        }

        setIsProcessing(true);
        setErrorMessage(null);

        try {
            const { error, paymentIntent } = await stripe.confirmPayment({
                elements,
                confirmParams: {
                    return_url: `${window.location.origin}/user/payment-success`,
                },
                redirect: 'if_required',
            });

            if (error) {
                setErrorMessage(error.message || 'Payment failed');
                setPaymentStatus('error');
            } else if (paymentIntent && paymentIntent.status === 'succeeded') {
                setPaymentStatus('success');
                setTimeout(onSuccess, 1500);
            } else if (paymentIntent && paymentIntent.status === 'requires_action') {
            } else {
                setPaymentStatus('success');
                setTimeout(onSuccess, 1500);
            }
        } catch (err: any) {
            setErrorMessage(err.message || 'An unexpected error occurred');
            setPaymentStatus('error');
        } finally {
            setIsProcessing(false);
        }
    };

    if (paymentStatus === 'success') {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
                    <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
                <h3 className={`text-xl font-semibold mb-2 ${lightMode ? 'text-neutral-900' : 'text-white'}`}>
                    Payment Successful!
                </h3>
                <p className={lightMode ? 'text-neutral-600' : 'text-slate-400'}>
                    Your subscription is now active.
                </p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Plan Summary - Only show in dark mode */}
            {!lightMode && (
                <div className="bg-neutral-800/50 rounded-lg p-4 border border-neutral-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-400">Subscription Plan</p>
                            <p className="text-lg font-semibold text-white">{planName}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-slate-400">Total</p>
                            <p className="text-xl font-bold text-white">{formatCurrency(amount, currency)}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Payment Element */}
            <div className={lightMode ? '' : 'bg-neutral-900 rounded-lg p-4 border border-neutral-700'}>
                {!lightMode && (
                    <div className="flex items-center gap-2 mb-4">
                        <CreditCard className="w-5 h-5 text-purple-400" />
                        <span className="text-white font-medium">Payment Details</span>
                    </div>
                )}
                <PaymentElement />
            </div>

            {/* Error Message */}
            {errorMessage && (
                <div className={`flex items-center gap-2 p-3 rounded-lg ${lightMode
                        ? 'bg-red-50 border border-red-200 text-red-600'
                        : 'bg-red-500/10 border border-red-500/30 text-red-400'
                    }`}>
                    <XCircle className="w-5 h-5 flex-shrink-0" />
                    <span className="text-sm">{errorMessage}</span>
                </div>
            )}

            {/* Actions - Only Subscribe button in light mode */}
            {lightMode ? (
                <Button
                    type="submit"
                    disabled={!stripe || isProcessing}
                    className="w-full py-6 bg-neutral-900 hover:bg-neutral-800 text-white text-lg font-medium rounded-lg"
                >
                    {isProcessing ? (
                        <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Processing...
                        </>
                    ) : (
                        'Subscribe'
                    )}
                </Button>
            ) : (
                <div className="flex gap-3">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onCancel}
                        disabled={isProcessing}
                        className="flex-1 bg-transparent border-neutral-600 text-slate-300 hover:bg-neutral-800"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        disabled={!stripe || isProcessing}
                        className="flex-1 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white"
                    >
                        {isProcessing ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Processing...
                            </>
                        ) : (
                            `Pay ${formatCurrency(amount, currency)}`
                        )}
                    </Button>
                </div>
            )}

            {/* Security Note */}
            <p className={`text-xs text-center ${lightMode ? 'text-neutral-500' : 'text-slate-500'}`}>
                Your payment is secured by Stripe. We never store your card details.
            </p>
        </form>
    );
}
