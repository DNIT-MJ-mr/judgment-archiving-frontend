import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  FileText,
  AlertCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  ArrowRight,
  Filter,
} from 'lucide-react'
import { dataEntryApi } from '@/api'
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
import { ConfidenceBadge } from '@/components/common/ConfidenceBadge'

export function DataEntryQueuePage() {
  const { t } = useTranslation(['dataEntry', 'common', 'judgments'])
  const navigate = useNavigate()
  const [statusFilter, setStatusFilter] = useState<'failed' | 'needs_review' | 'all'>('failed')
  const [page, setPage] = useState(1)
  const pageSize = 20

  // Fetch queue
  const {
    data: queueData,
    isLoading,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['data-entry-queue', statusFilter, page],
    queryFn: () =>
      dataEntryApi.getQueue({
        status: statusFilter,
        page,
        page_size: pageSize,
      }),
    refetchOnMount: false,
  })

  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ['data-entry-stats'],
    queryFn: () => dataEntryApi.getStats(),
    refetchOnMount: false,
  })

  // Get next item
  const handleGetNext = async () => {
    try {
      const next = await dataEntryApi.getNext()
      if (next?.id) {
        navigate(`/data-entry/${next.id}`)
      }
    } catch (error) {
      // No items in queue
    }
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
        <Button onClick={() => refetch()} variant="outline">
          <RefreshCw className="me-2 h-4 w-4" />
          {t('common:refresh')}
        </Button>
      </div>
    )
  }

  const items = queueData?.items || []
  const total = queueData?.total || 0
  const totalPages = queueData?.total_pages || 1

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('dataEntryQueue')}</h1>
          <p className="text-muted-foreground">
            {t('queueDescription')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          </Button>
          <Button onClick={handleGetNext}>
            {t('getNextItem')}
            <ArrowRight className="ms-2 h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t('failedItems')}</p>
                  <p className="text-2xl font-bold text-mr-red">{stats.failed}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-mr-red/20" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t('needsReview')}</p>
                  <p className="text-2xl font-bold text-mr-gold">{stats.needs_review}</p>
                </div>
                <Clock className="h-8 w-8 text-mr-gold/20" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t('totalPending')}</p>
                  <p className="text-2xl font-bold">{stats.total_pending}</p>
                </div>
                <FileText className="h-8 w-8 text-muted-foreground/20" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t('myUploads')}</p>
                  <p className="text-2xl font-bold text-primary">{stats.my_uploads_pending}</p>
                </div>
                <FileText className="h-8 w-8 text-primary/20" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{t('common:filter')}:</span>
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as 'failed' | 'needs_review' | 'all')}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="failed">{t('failedOnly')}</SelectItem>
                <SelectItem value="needs_review">{t('needsReviewOnly')}</SelectItem>
                <SelectItem value="all">{t('common:all')}</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">
              {t('common:total')}: {total}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Queue Items */}
      {items.length > 0 ? (
        <div className="space-y-3">
          {items.map((item) => (
            <Link
              key={item.id}
              to={`/data-entry/${item.id}`}
              className="block"
            >
              <Card className="transition-all hover:border-primary/50 hover:shadow-md">
                <CardContent className="p-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    {/* Item Info */}
                    <div className="flex items-start gap-4 min-w-0 flex-1">
                      <div className="rounded-lg bg-muted p-3 shrink-0">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium">
                            {item.case_number || t('judgments:noCaseNumber')}
                          </span>
                          {item.judgment_number && (
                            <>
                              <span className="text-muted-foreground">•</span>
                              <span className="text-sm text-muted-foreground">
                                {t('judgments:judgmentNumber')}: {item.judgment_number}
                              </span>
                            </>
                          )}
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                          {item.extracted_court_text && (
                            <span>{item.extracted_court_text}</span>
                          )}
                          {item.judgment_date && (
                            <>
                              <span>•</span>
                              <span>{formatDate(item.judgment_date)}</span>
                            </>
                          )}
                          {item.source_original_name && (
                            <>
                              <span>•</span>
                              <span className="truncate max-w-[200px]">
                                {item.source_original_name}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Status & Confidence */}
                    <div className="flex items-center gap-3 shrink-0">
                      <ConfidenceBadge score={item.confidence_score} />
                      <StatusBadge status={item.extraction_status} type="extraction" />
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
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
            <FileText className="mb-4 h-16 w-16 text-muted-foreground/50" />
            <h3 className="text-lg font-medium">{t('noItemsInQueue')}</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {t('allCaughtUp')}
            </p>
          </CardContent>
        </Card>
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
            {t('common:previous')}
          </Button>
          <span className="px-4 text-sm text-muted-foreground">
            {t('common:page')} {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= totalPages}
          >
            {t('common:next')}
            <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
          </Button>
        </div>
      )}
    </div>
  )
}

export default DataEntryQueuePage
