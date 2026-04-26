import { clientFetch } from '@/services/client/api.client';
import type { AdminReportPreviewResponse } from '@/models/admin.model';

function getErrorMessage(response: { error: { description: string } | null }, fallback: string) {
  return response.error?.description || fallback;
}

export async function fetchAdminReportPreview(reportId: string, signal?: AbortSignal) {
  const response = await clientFetch<AdminReportPreviewResponse>(
    `/api/Feed/admin/reports/${reportId}/preview`,
    {
      method: 'GET',
      signal
    },
    { auth: true }
  );

  if (!response.isSuccess) {
    throw new Error(getErrorMessage(response, 'Unable to load report preview.'));
  }

  return response;
}
