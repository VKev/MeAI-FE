export type TransactionStatus = 'succeeded' | 'pending' | 'failed' | 'refunded';

export type Transaction = {
	id: string;
	userId: string;
	relationId: string | null;
	relationType: string | null;
	cost: number | null;
	transactionType: string | null;
	tokenUsed: number | null;
	paymentMethod: string | null;
	status: TransactionStatus | null;
	createdAt: string | null;
	updatedAt: string | null;
	deletedAt: string | null;
	isDeleted: boolean;
	relation?: {
		type: string | null;
		id: string | null;
		subscription?: {
			id: string;
			name: string | null;
			cost: number | null;
			durationMonths: number;
			meAiCoin: number | null;
		} | null;
	} | null;
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
