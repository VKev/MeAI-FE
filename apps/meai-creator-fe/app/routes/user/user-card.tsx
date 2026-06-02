import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CreditCardIcon, RefreshCw, MoreVertical, Trash2, Check, Plus, Loader2, Eye } from 'lucide-react';
import { useNavigate } from 'react-router';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import {
  fetchPaymentCardsClient,
  setDefaultPaymentCardClient,
  deletePaymentCardClient
} from '@/services/client/user-card.client';
import type { PaymentCard } from '@/models/user-card.model';

function UserCard() {
  const navigate = useNavigate();
  const [selectedCardToDelete, setSelectedCardToDelete] = useState<PaymentCard | null>(null);
  const [selectedCardToView, setSelectedCardToView] = useState<PaymentCard | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['payment-cards'],
    queryFn: () => fetchPaymentCardsClient()
  });

  const cards = data?.value ?? [];

  const handleSetDefault = async (card: PaymentCard) => {
    try {
      const response = await setDefaultPaymentCardClient(card.paymentMethodId);

      if (response.isSuccess) {
        await refetch();
      } else {
        console.error('Failed to set default card:', response.error);
      }
    } catch (error) {
      console.error('Error setting default card:', error);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedCardToDelete) return;

    try {
      setIsDeleteLoading(true);
      const response = await deletePaymentCardClient(selectedCardToDelete.paymentMethodId);

      if (response.isSuccess) {
        setIsDeleteDialogOpen(false);
        setSelectedCardToDelete(null);
        await refetch();
      } else {
        console.error('Failed to delete card:', response.error);
      }
    } catch (error) {
      console.error('Error deleting card:', error);
    } finally {
      setIsDeleteLoading(false);
    }
  };

  const canDeleteCard = cards.length > 1;

  const formatMaskedPaymentMethodId = (paymentMethodId: string) => {
    if (paymentMethodId.length <= 6) {
      return paymentMethodId;
    }

    return `${paymentMethodId.slice(0, 3)}****${paymentMethodId.slice(-3)}`;
  };

  const formatExpirationDate = (card: PaymentCard) => {
    if (!card.expMonth || !card.expYear) {
      return '-';
    }

    return `${String(card.expMonth).padStart(2, '0')}/${card.expYear}`;
  };

  const getCardStatus = (card: PaymentCard) => {
    if (card.isExpired) {
      return 'Expired';
    }

    if (card.isDefault) {
      return 'Default';
    }

    return '-';
  };

  const formatCardDisplay = (card: PaymentCard) => {
    const brand = card.brand || 'Card';
    const last4 = card.last4 || '****';
    const expDate = formatExpirationDate(card);

    return `${brand} •••• ${last4} (${expDate})`;
  };

  return (
    <>
      <div className='space-y-10'>
        <header className='mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
          <div className='flex items-center gap-4'>
            <div className='flex h-11 w-11 items-center justify-center rounded-[12px] bg-white/[0.05] text-white/80'>
              <CreditCardIcon className='h-5 w-5' />
            </div>
            <div className='space-y-0.5'>
              <h1 className='text-xl font-bold tracking-tight text-white'>Payment Cards</h1>
              <p className='text-[11px] font-medium uppercase tracking-widest text-slate-500'>
                View and manage saved payment methods
              </p>
            </div>
          </div>
          <div className='flex items-center gap-2'>
            <Button
              variant='outline'
              size='lg'
              className='h-10 rounded-[14px] border-none bg-white/[0.05] px-4 text-xs font-bold text-slate-200 hover:bg-white/[0.08] hover:text-white'
              onClick={() => refetch()}
              disabled={isFetching}
            >
              <RefreshCw className={`size-4 ${isFetching ? 'animate-spin' : ''}`} />
              Sync Now
            </Button>
            <Button
              onClick={() => navigate('/stripe/add-card')}
              className='h-10 rounded-[14px] bg-white px-4 text-xs font-bold text-black hover:bg-white/90'
            >
              <Plus className='h-4 w-4' />
              Add New Card
            </Button>
          </div>
        </header>

        {error && (
          <div className='rounded-[16px] bg-red-500/10 p-4 text-red-400'>
            Failed to load payment cards. Please try again later.
          </div>
        )}

        {/* Payment Cards Table */}
        <div className='overflow-hidden rounded-[24px] bg-white/[0.035]'>
          <div className='overflow-x-auto'>
            <table className='w-full'>
              <thead className='bg-white/[0.025]'>
                <tr>
                  <th className='px-4 py-3 text-left'>
                    <span className='text-xs font-medium uppercase tracking-wider text-slate-500'>No</span>
                  </th>
                  <th className='px-4 py-3 text-left'>
                    <span className='text-xs font-medium uppercase tracking-wider text-slate-500'>Brand</span>
                  </th>
                  <th className='px-4 py-3 text-left'>
                    <span className='text-xs font-medium uppercase tracking-wider text-slate-500'>Card Number</span>
                  </th>
                  <th className='px-4 py-3 text-left'>
                    <span className='text-xs font-medium uppercase tracking-wider text-slate-500'>
                      Card Holder Name
                    </span>
                  </th>
                  <th className='px-4 py-3 text-left'>
                    <span className='text-xs font-medium uppercase tracking-wider text-slate-500'>Country</span>
                  </th>
                  <th className='px-4 py-3 text-left'>
                    <span className='text-xs font-medium uppercase tracking-wider text-slate-500'>Expiration Date</span>
                  </th>
                  <th className='px-4 py-3 text-left'>
                    <span className='text-xs font-medium uppercase tracking-wider text-slate-500'>Status</span>
                  </th>
                  <th className='px-4 py-3 text-left'>
                    <span className='text-xs font-medium uppercase tracking-wider text-slate-500'>Action</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className='px-4 py-8 text-center'>
                      <div className='flex items-center justify-center gap-2 text-slate-400'>
                        <Loader2 className='h-4 w-4 animate-spin' />
                        <span>Loading cards...</span>
                      </div>
                    </td>
                  </tr>
                ) : cards.length === 0 ? (
                  <tr>
                    <td colSpan={8} className='px-4 py-12 text-center'>
                      <div className='space-y-3'>
                        <p className='text-slate-400'>No payment cards added yet</p>
                        <Button
                          onClick={() => navigate('/stripe/add-card')}
                          className='inline-flex gap-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white'
                        >
                          <Plus className='h-4 w-4' />
                          Add New Card
                        </Button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  cards.map((card) => (
                    <tr
                      key={card.paymentMethodId}
                      className='border-b border-white/10 transition-colors hover:bg-white/2'
                    >
                      <td className='px-4 py-4 text-sm font-medium text-white'>
                        {formatMaskedPaymentMethodId(card.paymentMethodId)}
                      </td>
                      <td className='px-4 py-4 text-sm text-white'>{card.brand || '-'}</td>
                      <td className='px-4 py-4 text-sm text-white'>****{card.last4 || '----'}</td>
                      <td className='px-4 py-4 text-sm text-white'>{card.cardholderName || '-'}</td>
                      <td className='px-4 py-4 text-sm text-white'>{card.country || '-'}</td>
                      <td className='px-4 py-4 text-sm text-white'>{formatExpirationDate(card)}</td>
                      <td className='px-4 py-4'>
                        <div className='flex items-center gap-2'>
                          {card.isExpired && (
                            <span className='inline-flex items-center rounded-full border border-red-500/30 bg-red-500/10 px-2.5 py-1 text-xs font-medium text-red-400'>
                              Expired
                            </span>
                          )}
                          {!card.isExpired && card.isDefault && (
                            <span className='inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400'>
                              <Check className='h-3 w-3' />
                              Default
                            </span>
                          )}
                          {!card.isExpired && !card.isDefault && <span className='text-xs text-slate-500'>-</span>}
                        </div>
                      </td>
                      <td className='px-4 py-4'>
                        <div className='inline-flex items-center gap-2'>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant='ghost'
                                size='sm'
                                className='h-8 w-8 p-0 text-slate-400 hover:bg-white/10 hover:text-white'
                              >
                                <MoreVertical className='h-4 w-4' />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align='start' className='w-48 border-white/10 bg-zinc-900'>
                              <DropdownMenuItem
                                onClick={() => setSelectedCardToView(card)}
                                className='cursor-pointer text-white/80 hover:bg-white/10 hover:text-white'
                              >
                                <Eye className='mr-2 h-4 w-4' />
                                View Card
                              </DropdownMenuItem>
                              {!card.isDefault && (
                                <DropdownMenuItem
                                  onClick={() => handleSetDefault(card)}
                                  className='cursor-pointer text-slate-200 hover:bg-white/10 focus:bg-white/10'
                                >
                                  <Check className='mr-2 h-4 w-4' />
                                  Set as Default
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedCardToDelete(card);
                                  setIsDeleteDialogOpen(true);
                                }}
                                disabled={!canDeleteCard && card.isDefault}
                                className={`cursor-pointer ${
                                  canDeleteCard
                                    ? 'text-red-400! hover:bg-red-500/10 focus:bg-red-500/10'
                                    : 'cursor-not-allowed text-slate-500'
                                }`}
                              >
                                <Trash2 className='mr-2 h-4 w-4 text-red-400!' />
                                Delete Card
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className='border border-red-500/20 bg-zinc-950 text-white shadow-[0_20px_70px_-40px_rgba(244,63,94,0.6)]'>
          <DialogHeader className='space-y-3'>
            <div className='flex h-11 w-11 items-center justify-center rounded-full border border-red-400/30 bg-red-500/10 text-red-300'>
              <Trash2 className='h-5 w-5' />
            </div>
            <div className='space-y-1'>
              <DialogTitle className='text-xl font-semibold tracking-tight'>Delete this card?</DialogTitle>
              <DialogDescription className='text-zinc-400'>
                {!canDeleteCard
                  ? 'You must keep at least one card in your account.'
                  : 'This action cannot be undone. This card will no longer be available for payments.'}
              </DialogDescription>
            </div>
          </DialogHeader>
          <DialogFooter className='flex flex-col gap-2 sm:flex-row sm:justify-end'>
            <DialogClose asChild>
              <Button
                type='button'
                variant='outline'
                onClick={() => setIsDeleteDialogOpen(false)}
                disabled={isDeleteLoading}
                className='w-full border-zinc-700 bg-zinc-900 text-zinc-100 hover:bg-zinc-800 sm:w-auto'
              >
                Cancel
              </Button>
            </DialogClose>
            <Button
              type='button'
              onClick={handleDeleteConfirm}
              disabled={isDeleteLoading || !canDeleteCard}
              className='w-full bg-red-600 text-white hover:bg-red-500 disabled:opacity-50 sm:w-auto'
            >
              {isDeleteLoading ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : null}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedCardToView} onOpenChange={(open) => !open && setSelectedCardToView(null)}>
        <DialogContent className='border border-white/10 bg-zinc-950 text-white shadow-2xl sm:max-w-lg'>
          <DialogHeader className='space-y-2'>
            <DialogTitle className='text-2xl font-semibold tracking-tight'>Card Details</DialogTitle>
            <DialogDescription className='text-slate-400'>View the saved payment method information.</DialogDescription>
          </DialogHeader>

          {selectedCardToView && (
            <div className='space-y-4 rounded-2xl border border-white/10 bg-white/3 p-5'>
              <div className='flex items-center justify-between gap-3'>
                <span className='text-sm text-slate-400'>No</span>
                <span className='text-sm font-medium text-white'>
                  {formatMaskedPaymentMethodId(selectedCardToView.paymentMethodId)}
                </span>
              </div>
              <div className='flex items-center justify-between gap-3'>
                <span className='text-sm text-slate-400'>Brand</span>
                <span className='text-sm font-medium text-white'>{selectedCardToView.brand || '-'}</span>
              </div>
              <div className='flex items-center justify-between gap-3'>
                <span className='text-sm text-slate-400'>Card Number</span>
                <span className='text-sm font-medium text-white'>****{selectedCardToView.last4 || '----'}</span>
              </div>
              <div className='flex items-center justify-between gap-3'>
                <span className='text-sm text-slate-400'>Country</span>
                <span className='text-sm font-medium text-white'>{selectedCardToView.country || '-'}</span>
              </div>
              <div className='flex items-center justify-between gap-3'>
                <span className='text-sm text-slate-400'>Expired Date</span>
                <span className='text-sm font-medium text-white'>{formatExpirationDate(selectedCardToView)}</span>
              </div>
              <div className='flex items-center justify-between gap-3'>
                <span className='text-sm text-slate-400'>Status</span>
                <span className='text-sm font-medium text-white'>{getCardStatus(selectedCardToView)}</span>
              </div>
              <div className='flex items-center justify-between gap-3'>
                <span className='text-sm text-slate-400'>Card Holder Name</span>
                <span className='text-sm font-medium text-white'>{selectedCardToView.cardholderName || '-'}</span>
              </div>
              <div className='flex items-center justify-between gap-3'>
                <span className='text-sm text-slate-400'>Funding</span>
                <span className='text-sm font-medium text-white'>{selectedCardToView.funding || '-'}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

export default UserCard;
