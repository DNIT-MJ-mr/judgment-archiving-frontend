import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  FileText,
  Calendar,
  Building2,
  X,
  Eye,
} from 'lucide-react'
import { judgmentsApi, courtsApi } from '@/api'
import { formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { EXTRACTION_STATUS } from '@/lib/constants'

interface SearchFilters {
  case_number: string
  judgment_number: string
  court_id: string
  court: string
  judgment_type: string
  extraction_status: string
  date_from: string
  date_to: string
}

const initialFilters: SearchFilters = {
  case_number: '',
  judgment_number: '',
  court_id: '',
  court: '',
  judgment_type: '',
  extraction_status: '',
  date_from: '',
  date_to: '',
}

export function JudgmentsPage() {
  const { t } = useTranslation(['judgments', 'common'])
  const [filters, setFilters] = useState<SearchFilters>(initialFilters)
  const [appliedFilters, setAppliedFilters] = useState<SearchFilters>(initialFilters)
  const [showFilters, setShowFilters] = useState(false)
  const [page, setPage] = useState(1)
  const pageSize = 20

  // Fetch courts for dropdown
  const { data: courts } = useQuery({
    queryKey: ['courts'],
    queryFn: () => courtsApi.list(),
  })

  // Build query params
  const queryParams = {
    page,
    page_size: pageSize,
    ...(appliedFilters.case_number && { case_number: appliedFilters.case_number }),
    ...(appliedFilters.judgment_number && { judgment_number: appliedFilters.judgment_number }),
    ...(appliedFilters.court_id && { court_id: parseInt(appliedFilters.court_id, 10) }),
    ...(appliedFilters.court && { court: appliedFilters.court }),
    ...(appliedFilters.judgment_type && { judgment_type: appliedFilters.judgment_type }),
    ...(appliedFilters.extraction_status && { extraction_status: appliedFilters.extraction_status }),
    ...(appliedFilters.date_from && { date_from: appliedFilters.date_from }),
    ...(appliedFilters.date_to && { date_to: appliedFilters.date_to }),
  }

  // Fetch judgments
  const {
    data: response,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['judgments', queryParams],
    queryFn: () => judgmentsApi.search(queryParams),
  })

  const handleFilterChange = (key: keyof SearchFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const handleSearch = () => {
    setAppliedFilters(filters)
    setPage(1)
  }

  const handleClearFilters = () => {
    setFilters(initialFilters)
    setAppliedFilters(initialFilters)
    setPage(1)
  }

  const hasActiveFilters = Object.values(appliedFilters).some((v) => v !== '')

  const items = response?.items || []
  const total = response?.total || 0
  const totalPages = response?.total_pages || 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('judgments')}</h1>
          <p className="text-muted-foreground">{t('browseDescription')}</p>
        </div>
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="me-2 h-4 w-4" />
          {t('common:filter')}
          {hasActiveFilters && (
            <span className="ms-2 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
              {Object.values(appliedFilters).filter((v) => v !== '').length}
            </span>
          )}
        </Button>
      </div>

      {/* Search & Filters */}
      {showFilters && (
        <Card>
          <CardContent className="pt-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* Case Number */}
              <div>
                <label className="mb-2 block text-sm font-medium">
                  {t('caseNumber')}
                </label>
                <Input
                  value={filters.case_number}
                  onChange={(e) => handleFilterChange('case_number', e.target.value)}
                  placeholder={t('caseNumberPlaceholder')}
                  dir="ltr"
                />
              </div>

              {/* Judgment Number */}
              <div>
                <label className="mb-2 block text-sm font-medium">
                  {t('judgmentNumber')}
                </label>
                <Input
                  value={filters.judgment_number}
                  onChange={(e) => handleFilterChange('judgment_number', e.target.value)}
                  placeholder={t('judgmentNumberPlaceholder')}
                  dir="ltr"
                />
              </div>

              {/* Court */}
              <div>
                <label className="mb-2 block text-sm font-medium">
                  {t('court')}
                </label>
                <Select
                  value={filters.court_id}
                  onValueChange={(v) => handleFilterChange('court_id', v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('selectCourt')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">{t('common:all')}</SelectItem>
                    {courts?.map((court) => (
                      <SelectItem key={court.id} value={court.id.toString()}>
                        {court.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Status */}
              <div>
                <label className="mb-2 block text-sm font-medium">
                  {t('extractionStatus')}
                </label>
                <Select
                  value={filters.extraction_status}
                  onValueChange={(v) => handleFilterChange('extraction_status', v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('common:all')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">{t('common:all')}</SelectItem>
                    <SelectItem value={EXTRACTION_STATUS.VERIFIED}>
                      {t('statuses.verified')}
                    </SelectItem>
                    <SelectItem value={EXTRACTION_STATUS.NEEDS_REVIEW}>
                      {t('statuses.needs_review')}
                    </SelectItem>
                    <SelectItem value={EXTRACTION_STATUS.AUTO}>
                      {t('statuses.auto')}
                    </SelectItem>
                    <SelectItem value={EXTRACTION_STATUS.FAILED}>
                      {t('statuses.failed')}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Date From */}
              <div>
                <label className="mb-2 block text-sm font-medium">
                  {t('dateFrom')}
                </label>
                <Input
                  type="date"
                  value={filters.date_from}
                  onChange={(e) => handleFilterChange('date_from', e.target.value)}
                />
              </div>

              {/* Date To */}
              <div>
                <label className="mb-2 block text-sm font-medium">
                  {t('dateTo')}
                </label>
                <Input
                  type="date"
                  value={filters.date_to}
                  onChange={(e) => handleFilterChange('date_to', e.target.value)}
                />
              </div>

              {/* Court Text Search */}
              <div>
                <label className="mb-2 block text-sm font-medium">
                  {t('courtText')}
                </label>
                <Input
                  value={filters.court}
                  onChange={(e) => handleFilterChange('court', e.target.value)}
                  placeholder={t('courtPlaceholder')}
                />
              </div>

              {/* Judgment Type */}
              <div>
                <label className="mb-2 block text-sm font-medium">
                  {t('judgmentType')}
                </label>
                <Input
                  value={filters.judgment_type}
                  onChange={(e) => handleFilterChange('judgment_type', e.target.value)}
                  placeholder={t('judgmentTypePlaceholder')}
                />
              </div>
            </div>

            {/* Filter Actions */}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Button onClick={handleSearch}>
                <Search className="me-2 h-4 w-4" />
                {t('common:search')}
              </Button>
              {hasActiveFilters && (
                <Button variant="ghost" onClick={handleClearFilters}>
                  <X className="me-2 h-4 w-4" />
                  {t('clearFilters')}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results Info */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {t('common:total')}: {total} {t('results')}
        </p>
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      ) : error ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <p className="text-destructive">{t('common:error')}</p>
          </CardContent>
        </Card>
      ) : items.length > 0 ? (
        <div className="space-y-3">
          {items.map((judgment) => (
            <Link
              key={judgment.id}
              to={`/judgments/${judgment.id}`}
              className="block"
            >
              <Card className="transition-all hover:border-primary/50 hover:shadow-md">
                <CardContent className="p-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-4 min-w-0 flex-1">
                      <div className="rounded-lg bg-primary/10 p-3 shrink-0">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold">
                            {judgment.case_number || t('noCaseNumber')}
                          </span>
                          {judgment.judgment_number && (
                            <>
                              <span className="text-muted-foreground">•</span>
                              <span className="text-muted-foreground">
                                {t('judgmentNumber')}: {judgment.judgment_number}
                              </span>
                            </>
                          )}
                          <StatusBadge
                            status={judgment.extraction_status}
                            type="extraction"
                          />
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                          {judgment.extracted_court_text && (
                            <span className="flex items-center gap-1">
                              <Building2 className="h-3 w-3" />
                              {judgment.extracted_court_text}
                            </span>
                          )}
                          {judgment.judgment_date && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(judgment.judgment_date)}
                            </span>
                          )}
                          {judgment.judgment_type && (
                            <span>{judgment.judgment_type}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Eye className="h-4 w-4 text-muted-foreground" />
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
            <FileText className="h-12 w-12 text-muted-foreground/30" />
            <h3 className="mt-4 text-lg font-medium">{t('noResults')}</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {t('noResultsDescription')}
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

export default JudgmentsPage
