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
import { CheckCircle2, Package, RefreshCcw, RefreshCw } from 'lucide-react';
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
            <Button
              type='button'
              variant='outline'
              // onClick={handleRefresh}
              // disabled={isFetching}
              className='rounded-2xl text-white/85 shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset] hover:text-white px-6 relative z-10 bg-linear-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 shadow-violet-500/30'
            >
              <CheckCircle2 className={`h-4 w-4 mr-2`} />
              Publish
            </Button>
          </div>
        </section>

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
              <BreadcrumbPage>{postId}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* {isShowErrorDialog && <DialogError isOpen={isShowErrorDialog} />} */}
    </>
  );
}

export default ProductEdit;
