import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  FileCheck,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Play,
  CheckCircle2,
  Copy,
} from 'lucide-react'
import { validationApi } from '@/api'
import { formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { ConfidenceBadge } from '@/components/common/ConfidenceBadge'

export function ValidationQueuePage() {
  const { t } = useTranslation(['validation', 'common', 'judgments'])
  const navigate = useNavigate()
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
    queryKey: ['validation-queue', page],
    queryFn: () =>
      validationApi.getQueue({
        page,
        page_size: pageSize,
      }),
  })

  // Get next item handler
  const handleGetNext = async () => {
    try {
      const next = await validationApi.getNext()
      if (next?.id) {
        navigate(`/validation/${next.id}`)
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
  const totalPages = Math.ceil(total / pageSize)

  // Count duplicates
  const duplicateCount = items.filter((item) => item.has_duplicate).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('validationQueue')}</h1>
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
            <Play className="me-2 h-4 w-4" />
            {t('startValidating')}
          </Button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">{total}</p>
              <p className="text-sm text-muted-foreground">{t('pendingValidation')}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-mr-gold">{duplicateCount}</p>
              <p className="text-sm text-muted-foreground">{t('withDuplicates')}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-mr-green">{total - duplicateCount}</p>
              <p className="text-sm text-muted-foreground">{t('readyToVerify')}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Queue Info */}
      <div className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-2">
        <p className="text-sm text-muted-foreground">
          {t('common:total')}: {total} {t('common:items')}
        </p>
        <p className="text-xs text-muted-foreground">
          {t('sortedByPriority')}
        </p>
      </div>

      {/* Queue List */}
      {items.length > 0 ? (
        <div className="space-y-3">
          {items.map((item) => (
            <Link
              key={item.id}
              to={`/validation/${item.id}`}
              className="block"
            >
              <Card className={`transition-all hover:border-primary/50 hover:shadow-md ${
                item.has_duplicate ? 'border-mr-gold/50 bg-mr-gold/5' : ''
              }`}>
                <CardContent className="p-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    {/* Item Info */}
                    <div className="flex items-start gap-4 min-w-0 flex-1">
                      <div className={`rounded-lg p-3 shrink-0 ${
                        item.has_duplicate 
                          ? 'bg-mr-gold/10' 
                          : 'bg-mr-green/10'
                      }`}>
                        {item.has_duplicate ? (
                          <Copy className="h-5 w-5 text-mr-gold" />
                        ) : (
                          <FileCheck className="h-5 w-5 text-mr-green" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold">
                            {item.case_number || t('judgments:noCaseNumber')}
                          </span>
                          {item.judgment_number && (
                            <>
                              <span className="text-muted-foreground">•</span>
                              <span className="text-muted-foreground">
                                {t('judgments:judgmentNumber')}: {item.judgment_number}
                              </span>
                            </>
                          )}
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                          {item.court && (
                            <span>{item.court}</span>
                          )}
                          {item.judgment_date && (
                            <span>{formatDate(item.judgment_date)}</span>
                          )}
                          {item.source_original_name && (
                            <span className="truncate max-w-[200px]">
                              📄 {item.source_original_name}
                            </span>
                          )}
                        </div>

                        {/* Duplicate Warning */}
                        {item.has_duplicate && (
                          <div className="mt-2 flex items-center gap-2 text-sm text-mr-gold">
                            <AlertTriangle className="h-4 w-4" />
                            <span>{t('hasPotentialDuplicate')}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Confidence */}
                    <div className="flex items-center gap-3 shrink-0">
                      <ConfidenceBadge score={item.confidence_score} />
                      <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
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
            <div className="rounded-full bg-mr-green/10 p-4">
              <CheckCircle2 className="h-12 w-12 text-mr-green" />
            </div>
            <h3 className="mt-4 text-lg font-medium">{t('queueEmpty')}</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {t('allValidated')}
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

export default ValidationQueuePage
