export type TransactionStatus = 'succeeded' | 'pending' | 'failed' | 'refunded';

export type Transaction = {
	id: string;
	subscriptionName: string;
	amount: number;
	currency: string;
	status: TransactionStatus;
	paymentMethod: string;
	stripePaymentIntentId: string;
	createdAt: string;
	meAiCoinAwarded: number;
};

export type TransactionListResponse = {
	value: Transaction[];
	isSuccess: boolean;
	isFailure: boolean;
	error: {
		code: string;
		description: string;
	};
};

export const MOCK_TRANSACTIONS: Transaction[] = [
	{
		id: 'txn_001',
		subscriptionName: 'Pro Plan',
		amount: 199000,
		currency: 'VND',
		status: 'succeeded',
		paymentMethod: 'Visa •••• 4242',
		stripePaymentIntentId: 'pi_3Ox1a2b3c4d5e6f',
		createdAt: '2026-03-08T14:23:00Z',
		meAiCoinAwarded: 500,
	},
	{
		id: 'txn_002',
		subscriptionName: 'Pro Plan',
		amount: 199000,
		currency: 'VND',
		status: 'succeeded',
		paymentMethod: 'Visa •••• 4242',
		stripePaymentIntentId: 'pi_2Nw9x8y7z6a5b4',
		createdAt: '2026-02-08T10:15:00Z',
		meAiCoinAwarded: 500,
	},
	{
		id: 'txn_003',
		subscriptionName: 'Starter Plan',
		amount: 99000,
		currency: 'VND',
		status: 'succeeded',
		paymentMethod: 'Mastercard •••• 8888',
		stripePaymentIntentId: 'pi_1Mv8w7x6y5z4a3',
		createdAt: '2026-01-10T08:30:00Z',
		meAiCoinAwarded: 200,
	},
	{
		id: 'txn_004',
		subscriptionName: 'Pro Plan',
		amount: 199000,
		currency: 'VND',
		status: 'refunded',
		paymentMethod: 'Visa •••• 4242',
		stripePaymentIntentId: 'pi_0Lu7v6w5x4y3z2',
		createdAt: '2025-12-15T16:45:00Z',
		meAiCoinAwarded: 0,
	},
	{
		id: 'txn_005',
		subscriptionName: 'Starter Plan',
		amount: 99000,
		currency: 'VND',
		status: 'failed',
		paymentMethod: 'Visa •••• 1234',
		stripePaymentIntentId: 'pi_9Kt6u5v4w3x2y1',
		createdAt: '2025-11-20T12:00:00Z',
		meAiCoinAwarded: 0,
	},
];
