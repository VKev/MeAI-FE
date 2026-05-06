import { 
  TiktokIcon, 
  FacebookIcon, 
  InstagramIcon, 
  ThreadsIcon 
} from '@/components/ui/icons/social-icons';
import { 
  Clock, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  Globe 
} from 'lucide-react';

export type PostStatus = 'scheduled' | 'processing' | 'published' | 'failed' | 'draft' | 'unpublishing';
export type PlatformType = 'facebook' | 'instagram' | 'tiktok' | 'threads' | 'meai_feed';

export const STATUS_CONFIG = {
  published: {
    label: 'Published',
    className: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    icon: CheckCircle2,
  },
  scheduled: {
    label: 'Scheduled',
    className: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    icon: Clock,
  },
  processing: {
    label: 'Processing',
    className: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    icon: Loader2,
  },
  failed: {
    label: 'Failed',
    className: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    icon: AlertCircle,
  },
  draft: {
    label: 'Draft',
    className: 'text-slate-400 bg-slate-500/10 border-slate-500/20',
    icon: FileText,
  },
  unpublishing: {
    label: 'Unpublishing',
    className: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    icon: Loader2,
  },
} as const;

export const PLATFORM_CONFIG: Record<PlatformType, { icon: React.ComponentType<any>; color: string }> = {
  facebook: { icon: FacebookIcon, color: '#1877F2' },
  instagram: { icon: InstagramIcon, color: '#E4405F' },
  tiktok: { icon: TiktokIcon, color: '#FFFFFF' }, // White on dark
  threads: { icon: ThreadsIcon, color: '#FFFFFF' },
  meai_feed: { icon: Globe, color: '#8B5CF6' },
};
