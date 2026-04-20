import { useState, useEffect } from 'react';
import { useLoaderData, useFetcher, type LoaderFunctionArgs, type ActionFunctionArgs } from 'react-router';
import { toast } from 'sonner';
import { Loader2, Settings, Save } from 'lucide-react';
import { requireUser, hasRole } from '@/services/server/session.server';
import { fetchAdminConfig, updateAdminConfig } from '@/services/server/admin.server';

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  if (!hasRole(user, 'admin')) throw new Response('Forbidden', { status: 403 });

  try {
    const data = await fetchAdminConfig(request);
    return { config: data.value, error: null };
  } catch (error: any) {
    console.error('[Admin Config] Fetch error:', error);
    return { config: null, error: 'Failed to load system config' };
  }
}

export async function action({ request }: ActionFunctionArgs) {
  const user = await requireUser(request);
  if (!hasRole(user, 'admin')) return { success: false, error: 'Forbidden' };

  const formData = await request.formData();
  
  try {
    const rawNumberOfVariances = formData.get('numberOfVariances');

    const payload = {
      chatModel: formData.get('chatModel') as string || null,
      mediaAspectRatio: formData.get('mediaAspectRatio') as string || null,
      numberOfVariances: rawNumberOfVariances ? parseInt(rawNumberOfVariances as string, 10) : null,
    };

    const res = await updateAdminConfig(request, payload);
    return { success: res.isSuccess, error: res.isSuccess ? null : res.error?.description };
  } catch (error: any) {
    console.error('[Admin Config] Action error:', error);
    return { success: false, error: 'Failed to update configuration' };
  }
}

export default function AdminConfig() {
  const { config, error } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';

  const [form, setForm] = useState({
    chatModel: config?.chatModel || '',
    mediaAspectRatio: config?.mediaAspectRatio || '',
    numberOfVariances: config?.numberOfVariances?.toString() || '',
  });

  // Re-sync form state if config changes remotely upon revalidation
  useEffect(() => {
    if (config) {
      setForm({
        chatModel: config.chatModel || '',
        mediaAspectRatio: config.mediaAspectRatio || '',
        numberOfVariances: config.numberOfVariances?.toString() || '',
      });
    }
  }, [config]);

  useEffect(() => {
    if (fetcher.state === 'idle' && fetcher.data) {
      if (fetcher.data.success) {
        toast.success('Configuration updated successfully');
      } else {
        toast.error(fetcher.data.error || 'Failed to update configuration');
      }
    }
  }, [fetcher.state, fetcher.data]);

  const handleSave = () => {
    fetcher.submit(form, { method: 'post' });
  };

  const inputCls = 'h-9 w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 text-[13px] text-white placeholder:text-slate-500 outline-none focus:border-violet-500/40 transition-colors';

  return (
    <div className='max-w-2xl'>
      <div className='mb-6'>
        <h1 className='text-xl font-bold text-white'>Setting</h1>
        <p className='mt-1 text-[13px] text-slate-400'>Manage application AI parameters and system configurations.</p>
      </div>

      {error ? (
        <div className='mb-6 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-[13px] text-red-400'>
          {error}
        </div>
      ) : (
        <div className='rounded-xl border border-white/[0.06] bg-[#13131e]'>
          <div className='flex items-center gap-2 border-b border-white/[0.06] px-5 py-4'>
            <Settings className='size-4 text-violet-400' />
            <h2 className='text-[14px] font-semibold text-white'>AI Generation Preferences</h2>
          </div>
          
          <div className='p-6 space-y-5'>
            <div>
              <label className='mb-2 block text-[12px] font-medium text-slate-300'>Chat Model</label>
              <input 
                value={form.chatModel} 
                onChange={e => setForm(f => ({ ...f, chatModel: e.target.value }))}
                className={inputCls} 
                placeholder='e.g., gpt-4o' 
              />
              <p className='mt-1.5 text-[11px] text-slate-500'>The primary AI model utilized for text generation across the app.</p>
            </div>

            <div>
              <label className='mb-2 block text-[12px] font-medium text-slate-300'>Media Aspect Ratio</label>
              <input 
                value={form.mediaAspectRatio} 
                onChange={e => setForm(f => ({ ...f, mediaAspectRatio: e.target.value }))}
                className={inputCls} 
                placeholder='e.g., 16:9, 1:1, 9:16' 
              />
              <p className='mt-1.5 text-[11px] text-slate-500'>Default aspect ratio setting for AI image or video generation tools.</p>
            </div>

            <div>
              <label className='mb-2 block text-[12px] font-medium text-slate-300'>Number of Variances</label>
              <input 
                type="number"
                min="1"
                max="10"
                value={form.numberOfVariances} 
                onChange={e => setForm(f => ({ ...f, numberOfVariances: e.target.value }))}
                className={inputCls} 
                placeholder='e.g., 4' 
              />
              <p className='mt-1.5 text-[11px] text-slate-500'>The default number of alternative media options returned per generation request.</p>
            </div>
          </div>

          <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-white/[0.06] px-6 py-4 bg-white/[0.015] rounded-b-xl'>
            <p className='text-[11px] text-slate-500'>
              Values are automatically persisted to <code className='rounded bg-white/[0.04] px-1 py-0.5 text-slate-400'>/api/User/admin/config</code>.
            </p>
            <button
              onClick={handleSave}
              disabled={isSubmitting}
              className='flex items-center justify-center gap-2 rounded-lg bg-violet-600 px-5 py-2 text-[13px] font-medium text-white transition-colors hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed shrink-0'
            >
              {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              {isSubmitting ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
