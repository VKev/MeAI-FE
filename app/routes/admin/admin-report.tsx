import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  ShieldAlert,
  MessageSquare,
  User,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  Eye,
  Check,
  Ban,
  PlayCircle,
  Trash2,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { toast, Toaster } from 'sonner';
import { format } from 'date-fns';
import { useLoaderData, useFetcher, type LoaderFunctionArgs, type ActionFunctionArgs } from 'react-router';
import { fetchAdminReports, updateAdminReport } from '@/services/server/admin.server';
import { fetchAdminReportPreview } from '@/services/client/admin.client';
import type { AdminReport } from '@/models/admin.model';
import { useQuery } from '@tanstack/react-query';

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const reportsRes = await fetchAdminReports(request);
    return {
      reports: reportsRes.value || [],
      error: reportsRes.isFailure ? reportsRes.error?.description : null
    };
  } catch (err) {
    return { reports: [], error: 'Failed to fetch reports' };
  }
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const intent = formData.get('intent') as string;
  const reportId = formData.get('reportId') as string;
  const resolutionNote = formData.get('resolutionNote') as string;

  let status = 'Resolved';
  let actionType = 'None';

  switch (intent) {
    case 'start_review':
      status = 'InReview';
      actionType = 'None';
      break;
    case 'dismiss':
      status = 'Dismissed';
      actionType = 'None';
      break;
    case 'resolve':
      status = 'Resolved';
      actionType = 'None';
      break;
    case 'delete_target':
      status = 'Resolved';
      actionType = 'DeleteTargetPost';
      break;
    default:
      return { success: false, error: 'Invalid action' };
  }

  try {
    const res = await updateAdminReport(request, reportId, {
      status,
      resolutionNote,
      actionType
    });
    return { success: res.isSuccess, error: res.isFailure ? res.error?.description : null };
  } catch (err) {
    return { success: false, error: 'Failed to update report' };
  }
}



const STATUS_STYLES: Record<string, string> = {
  Pending: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  InReview: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  Resolved: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  Dismissed: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
};

const TARGET_ICONS: Record<string, any> = {
  Post: ImageIcon,
  Comment: MessageSquare,
};

export default function AdminReports() {
  const { reports, error: loaderError } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [selectedReport, setSelectedReport] = useState<AdminReport | null>(null);
  const [resolutionNote, setResolutionNote] = useState('');

  const { data: previewData, isLoading: isLoadingPreview } = useQuery({
    queryKey: ['admin-report-preview', selectedReport?.id],
    queryFn: () => fetchAdminReportPreview(selectedReport!.id),
    enabled: !!selectedReport?.id,
  });

  const preview = previewData?.value;

  // Handle Action Completion
  React.useEffect(() => {
    if (fetcher.data && fetcher.state === 'idle') {
      const data = fetcher.data as any;
      if (data.success) {
        toast.success('Report updated successfully');
        setSelectedReport(null);
        setResolutionNote('');
      } else if (data.error) {
        toast.error(data.error);
      }
    }
  }, [fetcher.data, fetcher.state]);

  const filteredReports = useMemo(() => {
    return (reports || []).filter(r => {
      const matchSearch = 
        (r.reason?.toLowerCase() || '').includes(search.toLowerCase()) || 
        (r.targetType?.toLowerCase() || '').includes(search.toLowerCase()) ||
        (r.targetId?.toLowerCase() || '').includes(search.toLowerCase());
      const matchStatus = filterStatus === 'All' || r.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [reports, search, filterStatus]);

  const handleAction = (intent: 'start_review' | 'resolve' | 'dismiss' | 'delete_target') => {
    if (!selectedReport) return;
    fetcher.submit(
      { 
        intent, 
        reportId: selectedReport.id, 
        resolutionNote 
      }, 
      { method: 'post' }
    );
  };

  const pendingCount = (reports || []).filter(r => r.status === 'Pending').length;
  const inReviewCount = (reports || []).filter(r => r.status === 'InReview').length;

  const isFinalState = selectedReport?.status === 'Resolved' || selectedReport?.status === 'Dismissed';

  return (
    <div className="space-y-6 animate-fade-in">
      <Toaster position="top-right" theme="dark" richColors />
      
      {/* Header & Stats */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            Manage Reports
          </h1>
          <p className="text-sm text-slate-400 mt-1">Monitor and resolve user reports across the platform.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end">
            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Total</span>
            <span className="text-xl font-bold text-white">{reports?.length || 0}</span>
          </div>
          <div className="h-8 w-px bg-white/10 mx-2" />
          <div className="flex flex-col items-end text-amber-400">
            <span className="text-[10px] uppercase tracking-wider opacity-70 font-bold">Pending</span>
            <span className="text-xl font-bold">{pendingCount}</span>
          </div>
          <div className="h-8 w-px bg-white/10 mx-2" />
          <div className="flex flex-col items-end text-blue-400">
            <span className="text-[10px] uppercase tracking-wider opacity-70 font-bold">In Review</span>
            <span className="text-xl font-bold">{inReviewCount}</span>
          </div>
        </div>
      </div>

      {loaderError && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm">
          {loaderError}
        </div>
      )}

      {/* Filters & Search */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between bg-white/[0.02] border border-white/[0.06] p-4 rounded-xl backdrop-blur-sm">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
          <Input
            placeholder="Search by reason or target..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 bg-white/[0.04] border-white/[0.08] pl-10 text-sm text-white placeholder:text-slate-500 focus:border-violet-500/40 transition-all"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="h-10 border-white/[0.08] bg-white/[0.04] text-slate-300 hover:text-white hover:bg-white/[0.08]">
                <Filter className="mr-2 size-4" />
                {filterStatus === 'All' ? 'All Status' : filterStatus}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 bg-[#1a1a24] border-white/[0.1] p-1 shadow-2xl" align="end">
              {['All', 'Pending', 'InReview', 'Resolved', 'Dismissed'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`flex w-full items-center justify-between px-3 py-2 text-sm rounded-md transition-colors ${filterStatus === status ? 'bg-violet-500/10 text-violet-400' : 'text-slate-400 hover:bg-white/[0.05] hover:text-white'}`}
                >
                  {status === 'InReview' ? 'In Review' : status}
                  {filterStatus === status && <Check className="size-4" />}
                </button>
              ))}
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Reports Table */}
      <div className="overflow-hidden rounded-xl border border-white/[0.06] bg-[#13131e] shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-widest text-slate-500">Target</th>
                <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-widest text-slate-500">Reporter</th>
                <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-widest text-slate-500">Reason</th>
                <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-widest text-slate-500">Status</th>
                <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-widest text-slate-500">Date</th>
                <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-widest text-slate-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filteredReports.map((report) => {
                const Icon = (report.targetType && TARGET_ICONS[report.targetType]) || AlertCircle;
                return (
                  <tr key={report.id} className="group hover:bg-white/[0.015] transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex size-9 items-center justify-center rounded-lg bg-white/[0.04] border border-white/[0.08] text-violet-400 group-hover:border-violet-500/30 transition-colors">
                          <Icon className="size-5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-tighter">{report.targetType}</p>
                          <p className="text-[13px] font-medium text-white truncate max-w-[150px]">{report.targetId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] text-slate-400 font-mono truncate max-w-[100px]">{report.reporterId}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-[13px] text-slate-400 line-clamp-1 max-w-[250px] italic">
                        "{report.reason}"
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${STATUS_STYLES[report.status] || STATUS_STYLES.Dismissed}`}>
                        <span className="size-1.5 rounded-full bg-current" />
                        {report.status === 'InReview' ? 'In Review' : report.status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <Clock className="size-3.5" />
                        <span className="text-[12px]">{report.createdAt ? format(new Date(report.createdAt), 'MMM dd, HH:mm') : 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => { setSelectedReport(report); setResolutionNote(report.resolutionNote || ''); }}
                        className="h-8 w-8 p-0 text-slate-500 hover:text-white hover:bg-white/[0.05]"
                      >
                        <Eye className="size-4" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
              {filteredReports.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-20 text-center text-slate-500 text-sm">
                    No reports found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Dialog */}
      <Dialog open={!!selectedReport} onOpenChange={(open) => !open && setSelectedReport(null)}>
        <DialogContent className="max-w-2xl bg-[#0c0c14] border-white/[0.1] text-white">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex size-10 items-center justify-center rounded-xl bg-violet-500/20 text-violet-400 border border-violet-500/30">
                <ShieldAlert className="size-6" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold">Review Report</DialogTitle>
                <DialogDescription className="text-slate-400">ID: {selectedReport?.id}</DialogDescription>
              </div>
              <div className="ml-auto">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${selectedReport?.status ? (STATUS_STYLES[selectedReport.status] || STATUS_STYLES.Dismissed) : ''}`}>
                  {selectedReport?.status === 'InReview' ? 'In Review' : (selectedReport?.status || 'Pending')}
                </span>
              </div>

            </div>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
            {/* Report Info */}
            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">Reporter</label>
                <div className="flex items-center gap-2 bg-white/[0.03] border border-white/[0.06] p-2.5 rounded-lg">
                  <div className="size-8 rounded-full bg-violet-600 flex items-center justify-center font-bold text-sm">
                    R
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-[11px] text-slate-500 truncate">ID: {selectedReport?.reporterId}</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">Target Content</label>
                <div className="bg-white/[0.03] border border-white/[0.06] p-3 rounded-lg space-y-2">
                  <div className="flex items-center gap-2 text-violet-400">
                    {(() => {
                      const Icon = (selectedReport?.targetType && TARGET_ICONS[selectedReport.targetType]) || AlertCircle;
                      return <Icon className="size-4" />;
                    })()}
                    <span className="text-xs font-bold uppercase tracking-tight">{selectedReport?.targetType}</span>
                  </div>
                  
                  {isLoadingPreview ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="size-5 text-violet-500 animate-spin" />
                      <span className="ml-2 text-sm text-slate-400">Loading preview...</span>
                    </div>
                  ) : preview ? (
                    <div className="mt-2 space-y-3">
                      {preview.post && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="size-6 rounded-full bg-slate-800 overflow-hidden shrink-0">
                              {preview.post.avatarUrl ? (
                                <img src={preview.post.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-slate-500">U</div>
                              )}
                            </div>
                            <span className="text-xs font-bold text-slate-300">@{preview.post.username}</span>
                          </div>
                          {preview.post.content && (
                            <p className="text-sm text-slate-300 line-clamp-3 leading-relaxed">
                              {preview.post.content}
                            </p>
                          )}
                          {preview.post.media && preview.post.media.length > 0 && (
                            <div className="relative w-full h-24 rounded bg-black/50 overflow-hidden border border-white/[0.04]">
                              {preview.post.media[0].resourceType === 'Video' ? (
                                <div className="w-full h-full flex items-center justify-center bg-slate-900/50">
                                  <PlayCircle className="size-6 text-white/50" />
                                </div>
                              ) : (
                                <img src={preview.post.media[0].presignedUrl} alt="media" className="w-full h-full object-cover opacity-80" />
                              )}
                            </div>
                          )}
                          <Button
                            variant="link"
                            className="h-auto p-0 text-violet-400 text-xs flex items-center gap-1 hover:text-violet-300 mt-2"
                            onClick={() => window.open(`http://localhost:3030/${preview.post!.username}/post/${preview.post!.id}`, '_blank')}
                          >
                            <ExternalLink className="size-3" />
                            View Post on Social
                          </Button>
                        </div>
                      )}

                      {preview.comment && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="size-6 rounded-full bg-slate-800 overflow-hidden shrink-0">
                              {preview.comment.targetComment.avatarUrl ? (
                                <img src={preview.comment.targetComment.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-slate-500">U</div>
                              )}
                            </div>
                            <span className="text-xs font-bold text-slate-300">@{preview.comment.targetComment.username}</span>
                          </div>
                          <div className="p-2.5 bg-black/20 rounded border border-white/5 text-sm text-slate-300 italic border-l-2 border-l-violet-500">
                            "{preview.comment.targetComment.content}"
                          </div>
                          <Button
                            variant="link"
                            className="h-auto p-0 text-violet-400 text-xs flex items-center gap-1 hover:text-violet-300 mt-2"
                            onClick={() => window.open(`http://localhost:3030/${preview.comment!.targetComment.username}/post/${preview.comment!.targetComment.postId}`, '_blank')}
                          >
                            <ExternalLink className="size-3" />
                            View Comment Thread
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      <p className="text-sm font-medium truncate">ID: {selectedReport?.targetId}</p>
                      <Button
                        variant="link"
                        className="h-auto p-0 text-violet-400 text-xs flex items-center gap-1 hover:text-violet-300"
                        onClick={() => {
                          if (selectedReport?.targetId) {
                            navigator.clipboard.writeText(selectedReport.targetId);
                            toast.success('Target ID copied to clipboard');
                          }
                        }}
                      >
                        <ExternalLink className="size-3" />
                        Copy Target ID
                      </Button>
                    </>
                  )}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">Reason for Report</label>
                <div className="bg-red-500/5 border border-red-500/10 p-3 rounded-lg max-h-[100px] overflow-y-auto">
                  <p className="text-sm text-slate-300 leading-relaxed italic">
                    "{selectedReport?.reason}"
                  </p>
                </div>
              </div>
            </div>

            {/* Resolution Form */}
            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">Resolution Note</label>
                <textarea
                  placeholder="Explain the reason for your decision..."
                  value={resolutionNote}
                  disabled={isFinalState}
                  onChange={(e) => setResolutionNote(e.target.value)}
                  className="w-full min-h-[120px] bg-white/[0.04] border border-white/[0.08] rounded-lg p-3 text-sm text-white placeholder:text-slate-600 focus:border-violet-500/40 outline-none transition-all resize-none disabled:opacity-50"
                />
              </div>

              <div className="space-y-2 pt-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">Admin Actions</label>
                
                {isFinalState ? (
                  <div className="bg-white/[0.03] border border-white/[0.06] p-3 rounded-lg text-center">
                    <p className="text-xs text-slate-500">This report has been finalized.</p>
                    {selectedReport?.actionType && selectedReport.actionType !== 'None' && (
                      <p className="text-xs text-violet-400 font-bold mt-1">Action: {selectedReport.actionType}</p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedReport?.status === 'Pending' && (
                      <Button 
                        onClick={() => handleAction('start_review')}
                        disabled={fetcher.state !== 'idle'}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white border-none h-10 text-xs font-bold"
                      >
                        <PlayCircle className="mr-2 size-4" />
                        Start Review
                      </Button>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                      <Button 
                        onClick={() => handleAction('resolve')}
                        disabled={fetcher.state !== 'idle'}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white border-none h-10 text-xs font-bold"
                      >
                        <CheckCircle2 className="mr-2 size-4" />
                        Resolve
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => handleAction('dismiss')}
                        disabled={fetcher.state !== 'idle'}
                        className="border-white/[0.1] bg-white/[0.03] text-slate-300 hover:text-white hover:bg-white/[0.08] h-10 text-xs font-bold"
                      >
                        <XCircle className="mr-2 size-4" />
                        Dismiss
                      </Button>
                    </div>

                    <Button 
                      onClick={() => handleAction('delete_target')}
                      disabled={fetcher.state !== 'idle'}
                      className="w-full bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white border border-red-500/20 h-10 text-xs font-bold transition-all"
                    >
                      <Trash2 className="mr-2 size-4" />
                      Delete Target Post
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="border-t border-white/[0.06] pt-4 mt-2">
            <Button variant="ghost" onClick={() => setSelectedReport(null)} className="text-slate-400 hover:text-white hover:bg-white/[0.05]">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
