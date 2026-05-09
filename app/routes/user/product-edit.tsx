import DialogError from '@/components/common/DialogError';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { fetchPostById } from '@/services/client/post.client';
import { useQuery } from '@tanstack/react-query';
import { Check, CheckCircle2, Package, RefreshCw, Save, Sparkles, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router';

function ProductEdit() {
  const { postId } = useParams();
  const [isShowErrorDialog, setIsShowErrorDialog] = useState(false);

  if (!postId) {
    return null;
  }

  const { data, isFetching, isError, refetch } = useQuery({
    queryKey: ['ai-recommendation-draft-post', postId],
    queryFn: () => fetchPostById(postId!),
    enabled: Boolean(postId)
  });

  const isShowPublish = data?.value && data.value.status === 'draft' ? true : false;

  useEffect(() => {
    const shouldShowErrorDialog =
      isError || (data?.value && data.value.status !== 'draft' && data.value.status !== 'scheduled');

    if (shouldShowErrorDialog) {
      setIsShowErrorDialog(true);
    }
  }, [isError, data]);

  return (
    <>
      <div className='space-y-8'>
        {/* header */}
        <section className='overflow-hidden rounded-[28px] border border-white/12 bg-[linear-gradient(160deg,rgba(10,13,26,0.92)_0%,rgba(8,10,18,0.95)_100%)] px-5 py-6 shadow-[0_20px_60px_rgba(3,5,12,0.45)] sm:px-7 sm:py-8 relative flex items-center justify-between'>
          <div className='absolute top-0 right-0 w-1/3 h-full bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.03),transparent_70%)] pointer-events-none' />

          <div className='flex items-center gap-4 relative z-10'>
            <div className='flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/4 text-white/85 shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset]'>
              <Package className='h-7 w-7' />
            </div>

            <div className='space-y-1'>
              <h1 className='text-3xl font-semibold tracking-tight text-white sm:text-4xl'>Edit Product</h1>
              <p className='text-sm leading-relaxed text-slate-400'>Modify the product details below.</p>
            </div>
          </div>

          <div className='flex items-center gap-2'>
            <Button
              type='button'
              variant='outline'
              onClick={() => void refetch()}
              disabled={isFetching}
              className='rounded-2xl border border-white/10 bg-white/4 text-white/85 shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset] hover:bg-white/8 hover:text-white px-6 relative z-10'
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
              Sync Now
            </Button>
            {isShowPublish && (
              <Button
                type='button'
                variant='outline'
                // onClick={handleRefresh}
                disabled={!isShowPublish}
                className='rounded-2xl text-white/85 shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset] hover:text-white px-6 relative z-10 bg-linear-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 shadow-violet-500/30'
              >
                <CheckCircle2 className={`h-4 w-4 mr-2`} />
                Publish
              </Button>
            )}
          </div>
        </section>

        <div className='flex items-center justify-between'>
          {/* breadcrumb */}
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href='/user'>Home</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href='/user/product'>Products</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{data?.value?.id}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          {/* action button */}
          <div className='flex items-center gap-2'>
            <Button
              type='button'
              variant='outline'
              // onClick={() => void refetch()}
              // disabled={isFetching}
              className='rounded-2xl text-white/85 shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset] hover:text-white px-6 relative z-10 bg-linear-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 shadow-violet-500/30'
            >
              <Save className={`h-4 w-4`} />
              Save Changes
            </Button>

            {/* improve open dialog to choose opt (content, media or both) */}
            <Button
              type='button'
              variant='outline'
              className='rounded-2xl border-amber-500/20 text-amber-100 shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset] hover:text-white px-6 relative z-10 bg-linear-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-amber-500/30'
            >
              <Sparkles className='h-4 w-4' />
              Improve
            </Button>

            <Button
              type='button'
              variant='outline'
              className='rounded-2xl border-emerald-500/20 text-emerald-100 shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset] hover:text-white px-6 relative z-10 bg-linear-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 shadow-emerald-500/30'
            >
              <Check className='h-4 w-4' />
              Approve
            </Button>

            <Button
              type='button'
              variant='outline'
              className='rounded-2xl border-rose-500/20 text-rose-100 shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset] hover:text-white px-6 relative z-10 bg-linear-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 shadow-rose-500/30'
            >
              <X className='h-4 w-4' />
              Reject
            </Button>
          </div>
        </div>
      </div>

      {isShowErrorDialog && <DialogError isOpen={isShowErrorDialog} />}
    </>
  );
}

export default ProductEdit;
