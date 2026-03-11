import { useState } from 'react';
import { Receipt, TrendingUp, Calendar, CreditCard, Search, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MOCK_TRANSACTIONS, type Transaction, type TransactionStatus } from '@/models/transaction.model';
import { formatCurrency } from '@/utils';
import { format } from 'date-fns';

const STATUS_CONFIG: Record<TransactionStatus, { label: string; className: string }> = {
    succeeded: {
        label: 'Succeeded',
        className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    },
    pending: {
        label: 'Pending',
        className: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    },
    failed: {
        label: 'Failed',
        className: 'bg-red-500/15 text-red-400 border-red-500/30',
    },
    refunded: {
        label: 'Refunded',
        className: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
    },
};

const ITEMS_PER_PAGE = 10;

function StatusBadge({ status }: { status: TransactionStatus }) {
    const config = STATUS_CONFIG[status];
    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${config.className}`}>
            <span className={`size-1.5 rounded-full ${status === 'succeeded' ? 'bg-emerald-400' : status === 'pending' ? 'bg-amber-400' : status === 'failed' ? 'bg-red-400' : 'bg-slate-400'}`} />
            {config.label}
        </span>
    );
}

function SummaryCard({ icon, label, value, subtext }: { icon: React.ReactNode; label: string; value: string; subtext?: string }) {
    return (
        <div className='rounded-xl border border-neutral-700/50 bg-neutral-800/50 p-5 transition-all duration-300 hover:border-violet-500/30 hover:bg-neutral-800/70'>
            <div className='flex items-center gap-3 mb-3'>
                <div className='flex size-9 items-center justify-center rounded-lg bg-violet-500/15'>
                    {icon}
                </div>
                <span className='text-sm text-slate-400'>{label}</span>
            </div>
            <p className='text-2xl font-bold text-white'>{value}</p>
            {subtext && <p className='mt-1 text-xs text-slate-500'>{subtext}</p>}
        </div>
    );
}

function TransactionRow({ transaction }: { transaction: Transaction }) {
    return (
        <tr className='border-b border-neutral-800 transition-colors hover:bg-white/[0.02]'>
            <td className='px-4 py-4'>
                <div>
                    <p className='text-sm font-medium text-white'>{transaction.subscriptionName}</p>
                    <p className='text-xs text-slate-500 mt-0.5'>{transaction.id}</p>
                </div>
            </td>
            <td className='px-4 py-4 text-sm text-slate-300'>
                {format(new Date(transaction.createdAt), 'dd/MM/yyyy HH:mm')}
            </td>
            <td className='px-4 py-4'>
                <span className='text-sm font-semibold text-white'>{formatCurrency(transaction.amount)}</span>
            </td>
            <td className='px-4 py-4'>
                <StatusBadge status={transaction.status} />
            </td>
            <td className='px-4 py-4'>
                <div className='flex items-center gap-2 text-sm text-slate-400'>
                    <CreditCard className='size-3.5' />
                    <span>{transaction.paymentMethod}</span>
                </div>
            </td>
            <td className='px-4 py-4 text-sm text-slate-500'>
                {transaction.meAiCoinAwarded > 0 ? (
                    <span className='text-violet-400 font-medium'>+{transaction.meAiCoinAwarded}</span>
                ) : (
                    <span>—</span>
                )}
            </td>
            <td className='px-4 py-4'>
                <Button
                    variant='ghost'
                    size='sm'
                    className='text-slate-500 hover:text-violet-400 h-8 w-8 p-0'
                    title='View on Stripe'
                >
                    <ExternalLink className='size-3.5' />
                </Button>
            </td>
        </tr>
    );
}

export default function BillingHistory() {
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState<TransactionStatus | 'all'>('all');

    const transactions = MOCK_TRANSACTIONS;

    const filteredTransactions = transactions.filter((t) => {
        const matchesSearch =
            t.subscriptionName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.paymentMethod.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE);
    const paginatedTransactions = filteredTransactions.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    const totalSpent = transactions
        .filter((t) => t.status === 'succeeded')
        .reduce((sum, t) => sum + t.amount, 0);

    const totalSucceeded = transactions.filter((t) => t.status === 'succeeded').length;

    const lastPayment = transactions.find((t) => t.status === 'succeeded');

    return (
        <div className='min-h-screen py-8 px-6'>
            <div className='mb-10'>
                <div className='flex items-center gap-3 mb-2'>
                    <div className='w-10 h-10 rounded-xl bg-linear-to-br from-violet-500 to-purple-600 flex items-center justify-center'>
                        <Receipt className='w-5 h-5 text-white' />
                    </div>
                    <h1 className='text-2xl font-bold text-white'>Billing History</h1>
                </div>
                <p className='text-slate-400 ml-13'>
                    View and manage your payment transactions and billing records.
                </p>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-8'>
                <SummaryCard
                    icon={<TrendingUp className='size-4 text-violet-400' />}
                    label='Total Spent'
                    value={formatCurrency(totalSpent)}
                    subtext={`${totalSucceeded} successful payments`}
                />
                <SummaryCard
                    icon={<Receipt className='size-4 text-violet-400' />}
                    label='Total Transactions'
                    value={String(transactions.length)}
                    subtext='All time'
                />
                <SummaryCard
                    icon={<Calendar className='size-4 text-violet-400' />}
                    label='Last Payment'
                    value={lastPayment ? format(new Date(lastPayment.createdAt), 'dd/MM/yyyy') : 'N/A'}
                    subtext={lastPayment ? lastPayment.subscriptionName : ''}
                />
            </div>

            <div className='rounded-xl border border-neutral-700/50 bg-neutral-800/30 overflow-hidden'>
                <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 border-b border-neutral-700/50'>
                    <div className='relative w-full sm:w-72'>
                        <Search className='absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500' />
                        <Input
                            placeholder='Search transactions...'
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setCurrentPage(1);
                            }}
                            className='pl-9 bg-neutral-900/50 border-neutral-700 text-white placeholder:text-slate-500 h-9'
                        />
                    </div>
                    <div className='flex items-center gap-2'>
                        {(['all', 'succeeded', 'pending', 'failed', 'refunded'] as const).map((status) => (
                            <Button
                                key={status}
                                variant='ghost'
                                size='sm'
                                onClick={() => {
                                    setStatusFilter(status);
                                    setCurrentPage(1);
                                }}
                                className={`h-8 text-xs capitalize ${statusFilter === status
                                        ? 'bg-violet-500/15 text-violet-400 hover:bg-violet-500/20 hover:text-violet-300'
                                        : 'text-slate-400 hover:bg-white/5 hover:text-white'
                                    }`}
                            >
                                {status === 'all' ? 'All' : STATUS_CONFIG[status].label}
                            </Button>
                        ))}
                    </div>
                </div>

                {paginatedTransactions.length > 0 ? (
                    <div className='overflow-x-auto'>
                        <table className='w-full'>
                            <thead>
                                <tr className='border-b border-neutral-700/50'>
                                    <th className='px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500'>Plan</th>
                                    <th className='px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500'>Date</th>
                                    <th className='px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500'>Amount</th>
                                    <th className='px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500'>Status</th>
                                    <th className='px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500'>Payment</th>
                                    <th className='px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500'>Coins</th>
                                    <th className='px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500'></th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedTransactions.map((transaction) => (
                                    <TransactionRow key={transaction.id} transaction={transaction} />
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className='flex flex-col items-center justify-center py-16 text-center'>
                        <div className='flex size-14 items-center justify-center rounded-full bg-neutral-800 mb-4'>
                            <Receipt className='size-6 text-slate-500' />
                        </div>
                        <p className='text-sm font-medium text-slate-400'>No transactions found</p>
                        <p className='text-xs text-slate-500 mt-1'>
                            {searchQuery || statusFilter !== 'all'
                                ? 'Try adjusting your search or filter.'
                                : "You haven't made any payments yet."}
                        </p>
                    </div>
                )}

                {totalPages > 1 && (
                    <div className='flex items-center justify-between border-t border-neutral-700/50 px-4 py-3'>
                        <p className='text-xs text-slate-500'>
                            Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}–
                            {Math.min(currentPage * ITEMS_PER_PAGE, filteredTransactions.length)} of{' '}
                            {filteredTransactions.length}
                        </p>
                        <div className='flex items-center gap-1'>
                            <Button
                                variant='ghost'
                                size='sm'
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage((p) => p - 1)}
                                className='h-8 w-8 p-0 text-slate-400 hover:text-white disabled:opacity-30'
                            >
                                <ChevronLeft className='size-4' />
                            </Button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                <Button
                                    key={page}
                                    variant='ghost'
                                    size='sm'
                                    onClick={() => setCurrentPage(page)}
                                    className={`h-8 w-8 p-0 text-xs ${currentPage === page
                                            ? 'bg-violet-500/20 text-violet-400'
                                            : 'text-slate-400 hover:text-white'
                                        }`}
                                >
                                    {page}
                                </Button>
                            ))}
                            <Button
                                variant='ghost'
                                size='sm'
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage((p) => p + 1)}
                                className='h-8 w-8 p-0 text-slate-400 hover:text-white disabled:opacity-30'
                            >
                                <ChevronRight className='size-4' />
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
