import type { TransactionListResponse } from '@/models/transaction.model';
import { clientFetch } from '@/services/client/api.client';

export async function fetchTransactionsClient() {
  return clientFetch<TransactionListResponse>(
    '/api/User/transactions',
    {
      method: 'GET'
    },
    { auth: true }
  );
}
