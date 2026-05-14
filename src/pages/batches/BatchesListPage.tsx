import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import {
  Plus,
  FolderOpen,
  Calendar,
  FileText,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from 'lucide-react'
import { batchesApi } from '@/api'
import { formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { StatusBadge } from '@/components/common/StatusBadge'
import { BATCH_STATUS } from '@/lib/constants'

export function BatchesListPage() {
  const { t } = useTranslation(['batches', 'common'])
  const navigate = useNavigate()
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [page, setPage] = useState(1)
  const pageSize = 20

  const [batches, setBatches] = useState<any[] | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchBatches = useCallback(async () => {
    setError(null)
    try {
      const result = await batchesApi.list({
        status: statusFilter === 'all' ? undefined : statusFilter,
        page,
        page_size: pageSize,
      })
      setBatches(result)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'))
    } finally {
      setIsLoading(false)
    }
  }, [statusFilter, page])

  useEffect(() => {
    setIsLoading(true)
    fetchBatches()
  }, [fetchBatches])

  const handleCreateBatch = () => {
    navigate('/batches/new')
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4">
        <p className="text-destructive">{t('common:error')}</p>
        <Button onClick={() => fetchBatches()} variant="outline">
          <RefreshCw className="me-2 h-4 w-4" />
          {t('common:refresh')}
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('batches')}</h1>
          <p className="text-muted-foreground">
            {t('common:total')}: {batches?.length || 0}
          </p>
        </div>
        <Button onClick={handleCreateBatch}>
          <Plus className="me-2 h-4 w-4" />
          {t('createBatch')}
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {t('common:status')}:
              </span>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('common:all')}</SelectItem>
                  <SelectItem value={BATCH_STATUS.UPLOADING}>
                    {t('batchStatus.uploading')}
                  </SelectItem>
                  <SelectItem value={BATCH_STATUS.PROCESSING}>
                    {t('batchStatus.processing')}
                  </SelectItem>
                  <SelectItem value={BATCH_STATUS.REVIEWING}>
                    {t('batchStatus.reviewing')}
                  </SelectItem>
                  <SelectItem value={BATCH_STATUS.COMPLETED}>
                    {t('batchStatus.completed')}
                  </SelectItem>
                  <SelectItem value={BATCH_STATUS.FAILED}>
                    {t('batchStatus.failed')}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" size="sm" onClick={() => fetchBatches()}>
              <RefreshCw className="me-2 h-4 w-4" />
              {t('common:refresh')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Batch List */}
      {batches && batches.length > 0 ? (
        <div className="grid gap-4">
          {batches.map((batch) => (
            <Link key={batch.id} to={`/batches/${batch.id}`}>
              <Card className="transition-shadow hover:shadow-md">
                <CardContent className="p-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    {/* Batch Info */}
                    <div className="flex items-start gap-4">
                      <div className="rounded-lg bg-primary/10 p-3 text-primary">
                        <FolderOpen className="h-6 w-6" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate font-semibold">{batch.name}</h3>
                        <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {formatDate(batch.created_at)}
                          </span>
                          <span className="flex items-center gap-1">
                            <FileText className="h-4 w-4" />
                            {batch.total_files} {t('common:items')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Status & Progress */}
                    <div className="flex items-center gap-4">
                      {/* Progress */}
                      <div className="text-end">
                        <p className="text-lg font-semibold">
                          {batch.processed_files}/{batch.total_files}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {t('processedFiles')}
                        </p>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-24">
                        <div className="h-2 rounded-full bg-gray-100">
                          <div
                            className="h-2 rounded-full bg-primary transition-all"
                            style={{
                              width: `${
                                batch.total_files > 0
                                  ? (batch.processed_files / batch.total_files) * 100
                                  : 0
                              }%`,
                            }}
                          />
                        </div>
                      </div>

                      {/* Status Badge */}
                      <StatusBadge status={batch.status} type="batch" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FolderOpen className="h-16 w-16 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-medium">{t('noBatches')}</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {t('createFirstBatch')}
            </p>
            <Button onClick={handleCreateBatch} className="mt-4">
              <Plus className="me-2 h-4 w-4" />
              {t('createBatch')}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {batches && batches.length >= pageSize && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            <ChevronRight className="h-4 w-4 rtl:rotate-180" />
            {t('common:previous')}
          </Button>
          <span className="px-4 text-sm text-muted-foreground">
            {t('common:page')} {page}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => p + 1)}
            disabled={batches.length < pageSize}
          >
            {t('common:next')}
            <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
          </Button>
        </div>
      )}
    </div>
  )
}

export default BatchesListPage
