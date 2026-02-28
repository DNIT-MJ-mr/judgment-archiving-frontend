import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  FileText,
  File,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  RotateCcw,
  Trash2,
  ExternalLink,
  AlertCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { batchesApi } from '@/api'
import { BatchFile } from '@/lib/types'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from '@/components/ui/tooltip'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { StatusBadge } from '@/components/common/StatusBadge'

interface BatchFileListProps {
  batchId: number
  isProcessing: boolean
}

export function BatchFileList({ batchId, isProcessing }: BatchFileListProps) {
  const { t } = useTranslation(['batches', 'common', 'errors'])
  const queryClient = useQueryClient()

  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [page, setPage] = useState(1)
  const pageSize = 20

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['batch-files', batchId, statusFilter, page],
    queryFn: () =>
      batchesApi.getFiles(batchId, {
        status: statusFilter === 'all' ? undefined : statusFilter,
        page,
        page_size: pageSize,
      }),
    refetchInterval: isProcessing ? 3000 : false, // Poll while processing
  })

  const retryFileMutation = useMutation({
    mutationFn: (fileId: number) => batchesApi.retryFile(batchId, fileId),
    onSuccess: () => {
      toast.success(t('common:success'))
      queryClient.invalidateQueries({ queryKey: ['batch-files', batchId] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || t('errors:generic'))
    },
  })

  const deleteFileMutation = useMutation({
    mutationFn: (fileId: number) => batchesApi.deleteFile(batchId, fileId),
    onSuccess: () => {
      toast.success(t('common:success'))
      queryClient.invalidateQueries({ queryKey: ['batch-files', batchId] })
      queryClient.invalidateQueries({ queryKey: ['batch', batchId] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || t('errors:generic'))
    },
  })

  const getFileIcon = (filename: string) => {
    const ext = filename.toLowerCase().split('.').pop()
    if (ext === 'pdf') {
      return <FileText className="h-5 w-5 text-red-500" />
    }
    return <File className="h-5 w-5 text-blue-500" />
  }

  if (isLoading) {
    return (
      <div className="flex h-32 items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-32 flex-col items-center justify-center gap-2">
        <p className="text-destructive">{t('common:error')}</p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="me-2 h-4 w-4" />
          {t('common:refresh')}
        </Button>
      </div>
    )
  }

  const files = data?.items || []
  const total = data?.total || 0
  const totalPages = data?.total_pages || 1

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {t('common:status')}:
            </span>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('common:all')}</SelectItem>
                <SelectItem value="pending">{t('fileStatus.pending')}</SelectItem>
                <SelectItem value="processing">{t('fileStatus.processing')}</SelectItem>
                <SelectItem value="done">{t('fileStatus.done')}</SelectItem>
                <SelectItem value="failed">{t('fileStatus.failed')}</SelectItem>
                <SelectItem value="skipped">{t('fileStatus.skipped')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <p className="text-sm text-muted-foreground">
            {t('common:total')}: {total}
          </p>
        </div>

        {/* File List */}
        {files.length > 0 ? (
          <div className="divide-y rounded-lg border">
            {files.map((file: BatchFile) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-3 hover:bg-gray-50"
              >
                {/* File Info */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {getFileIcon(file.original_filename)}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {file.original_filename}
                    </p>
                    {file.error_message && (
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-destructive">
                        <AlertCircle className="h-3 w-3" />
                        {file.error_message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Status & Actions */}
                <div className="flex items-center gap-3">
                  <StatusBadge status={file.status} type="file" />

                  {/* Link to judgment if exists */}
                  {file.judgment_id && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          asChild
                        >
                          <a
                            href={`/judgments/${file.judgment_id}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {t('common:details')}
                      </TooltipContent>
                    </Tooltip>
                  )}

                  {/* Retry button for failed/skipped files */}
                  {(file.status === 'failed' || file.status === 'skipped') && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => retryFileMutation.mutate(file.id)}
                          disabled={retryFileMutation.isPending || isProcessing}
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {t('retryFailed')}
                      </TooltipContent>
                    </Tooltip>
                  )}

                  {/* Delete button (admin only, when not processing) */}
                  {!isProcessing && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => {
                            if (confirm(t('confirmDelete'))) {
                              deleteFileMutation.mutate(file.id)
                            }
                          }}
                          disabled={deleteFileMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {t('common:delete')}
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex h-32 items-center justify-center rounded-lg border border-dashed">
            <p className="text-sm text-muted-foreground">{t('common:noData')}</p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronRight className="h-4 w-4 rtl:rotate-180" />
            </Button>
            <span className="px-4 text-sm text-muted-foreground">
              {t('common:page')} {page} {t('common:of')} {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= totalPages}
            >
              <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
            </Button>
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}

export default BatchFileList
