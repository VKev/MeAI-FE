import { useEffect, useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import type { AiRecommendationDraftPostInput, AiRecommendationStyle } from '@/models/ai-recommendation.model';
import type { SocialMedia } from '@/models/social-media.model';
import { createAiRecommendationDraftPost } from '@/services/client/ai-recommendation.client';
import { Loader2, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router';

const DEFAULT_STYLE: AiRecommendationStyle = 'branded';
const STYLE_OPTIONS: Array<{ value: AiRecommendationStyle; title: string; description: string }> = [
  {
    value: 'creative',
    title: 'Creative',
    description: 'Pure mood direction with no on-image text.'
  },
  {
    value: 'branded',
    title: 'Branded',
    description: 'Hero visual with subtle brand mark and optional headline.'
  },
  {
    value: 'marketing',
    title: 'Marketing',
    description: 'Promo flyer with logo, CTA, and contact on image.'
  }
];

type DialogAiRecommendationRequestProps = {
  open: boolean;
  accounts: SocialMedia[];
  defaultSocialMediaId?: string;
  onOpenChange: (open: boolean) => void;
};

function getAccountName(account?: SocialMedia) {
  return account?.profile?.username || account?.profile?.pageName || account?.profile?.displayName || 'Unknown';
}

function getAccountAvatar(account?: SocialMedia) {
  return account?.profile?.profilePictureUrl || account?.profile?.pageProfilePictureUrl || '';
}

function DialogAiRecommendationRequest({
  open,
  accounts,
  defaultSocialMediaId,
  onOpenChange
}: DialogAiRecommendationRequestProps) {
  const [style, setStyle] = useState<AiRecommendationStyle>(DEFAULT_STYLE);
  const [userPrompt, setUserPrompt] = useState('');
  const [socialMediaId, setSocialMediaId] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) {
      return;
    }

    const fallbackAccountId = defaultSocialMediaId ?? accounts[0]?.id ?? '';
    setStyle(DEFAULT_STYLE);
    setUserPrompt('');
    setSocialMediaId(fallbackAccountId);
  }, [accounts, defaultSocialMediaId, open]);

  const selectedAccount = useMemo(
    () => accounts.find((account) => account.id === socialMediaId) ?? accounts[0],
    [accounts, socialMediaId]
  );

  const mutation = useMutation({
    mutationFn: async () => {
      if (!socialMediaId) {
        throw new Error('Please choose an account before generating an AI recommendation.');
      }

      const payload: AiRecommendationDraftPostInput = {
        maxRagPosts: 30,
        maxReferenceImages: 3,
        style,
        topK: 6,
        userPrompt: userPrompt.trim() || null,
        workspaceId: null
      };

      return createAiRecommendationDraftPost(socialMediaId, payload);
    },
    onSuccess: (response) => {
      onOpenChange(false);
      const resultPostId = response.value?.resultPostId;
      navigate(`/user/product/ai-recommendation/${resultPostId}`);
    }
  });

  const handleSubmit = () => {
    mutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[95vh] overflow-y-auto max-w-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(10,13,26,0.98)_0%,rgba(7,9,16,0.98)_100%)] text-white shadow-[0_30px_100px_-40px_rgba(124,58,237,0.55)]'>
        <DialogHeader className='gap-3 flex flex-row items-center justify-start'>
          <div className='h-10 w-10 flex items-center justify-center rounded-xl border border-violet-400/20 bg-violet-500/10 text-violet-200'>
            <Sparkles className='h-5 w-5' />
          </div>
          <DialogTitle className='text-2xl font-semibold tracking-tight'>AI recommendation</DialogTitle>
        </DialogHeader>

        <div className='space-y-3'>
          <section className='space-y-3'>
            <div className='flex items-center justify-between gap-3'>
              <div>
                <p className='text-sm font-semibold text-white'>Account</p>
                <p className='text-xs text-slate-500'>Select the social account for this request.</p>
              </div>
              {selectedAccount && (
                <span className='text-xs truncate text-slate-400'>{getAccountName(selectedAccount)}</span>
              )}
            </div>

            <div className='max-h-56 space-y-2 overflow-y-auto pr-1'>
              {accounts.length > 0 ? (
                accounts.map((account) => {
                  const isActive = account.id === socialMediaId;
                  return (
                    <button
                      key={account.id}
                      type='button'
                      onClick={() => setSocialMediaId(account.id)}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-all',
                        isActive
                          ? 'border-violet-400/40 bg-violet-500/10 shadow-[0_0_0_1px_rgba(139,92,246,0.2)_inset]'
                          : 'border-white/10 bg-white/3 hover:border-white/20 hover:bg-white/5'
                      )}
                    >
                      <div
                        className={cn(
                          'flex h-5 w-5 items-center justify-center rounded-full border',
                          isActive ? 'border-violet-300 bg-violet-400/20' : 'border-white/20'
                        )}
                      >
                        <div
                          className={cn('h-2.5 w-2.5 rounded-full', isActive ? 'bg-violet-300' : 'bg-transparent')}
                        />
                      </div>
                      <Avatar className='h-10 w-10 border border-white/10'>
                        <AvatarImage src={getAccountAvatar(account)} alt={getAccountName(account)} />
                        <AvatarFallback className='bg-white/5 text-xs font-semibold text-slate-300'>
                          {getAccountName(account).charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className='min-w-0 flex-1'>
                        <p className='truncate font-medium text-white'>{getAccountName(account)}</p>
                        <p className='truncate text-xs text-slate-500'>{account.type}</p>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className='rounded-2xl border border-dashed border-white/10 bg-white/3 p-4 text-sm text-slate-400'>
                  No social accounts were found.
                </div>
              )}
            </div>
          </section>

          <section className='space-y-3'>
            <div>
              <p className='text-sm font-semibold text-white'>Style</p>
              <p className='text-xs text-slate-500'>Select the writing style for the AI recommendation.</p>
            </div>

            <div className='grid grid-cols-3 gap-4'>
              {STYLE_OPTIONS.map((option) => {
                const isActive = style === option.value;
                return (
                  <button
                    key={option.value}
                    type='button'
                    onClick={() => setStyle(option.value)}
                    className={cn(
                      'rounded-2xl border px-5 py-2 text-left transition-all',
                      isActive
                        ? 'border-violet-400/40 bg-violet-500/10 shadow-[0_0_0_1px_rgba(139,92,246,0.2)_inset]'
                        : 'border-white/10 bg-white/3 hover:border-white/20 hover:bg-white/5'
                    )}
                  >
                    <div className='flex items-center justify-between gap-3'>
                      <p className='font-medium text-white'>{option.title}</p>
                      <span className={cn('h-2.5 w-2.5 rounded-full', isActive ? 'bg-violet-300' : 'bg-white/20')} />
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          <section className='space-y-3'>
            <div>
              <p className='text-sm font-semibold text-white'>Prompt</p>
              <p className='text-xs text-slate-500'>Provide a detailed prompt for the AI recommendation.</p>
            </div>

            <Textarea
              value={userPrompt}
              onChange={(event) => setUserPrompt(event.target.value)}
              placeholder='Example: Write a post about our new summer skincare bundle for small business owners.'
              className='min-h-28 border-white/10 bg-white/3 text-white placeholder:text-slate-500 focus-visible:border-violet-500/50 focus-visible:ring-violet-500/20'
            />
          </section>
        </div>

        <DialogFooter className='gap-2 pt-2 sm:justify-between'>
          <Button
            type='button'
            variant='outline'
            className='border-white/10 bg-white/3 text-white hover:bg-white/6'
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type='button'
            onClick={handleSubmit}
            disabled={mutation.isPending || !socialMediaId || accounts.length === 0}
            className='bg-linear-to-r from-violet-600 to-fuchsia-600 text-white shadow-[0_16px_40px_-20px_rgba(168,85,247,0.8)] hover:from-violet-500 hover:to-fuchsia-500'
          >
            {mutation.isPending && <Loader2 className='h-4 w-4 animate-spin' />}
            Request Recommendation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default DialogAiRecommendationRequest;
