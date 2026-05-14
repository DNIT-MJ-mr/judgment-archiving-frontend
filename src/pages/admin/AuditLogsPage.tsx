import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
  History,
  RefreshCw,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  User,
  FileText,
  Building2,
  Upload,
  Shield,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { auditLogsApi } from '@/api'
import { formatDateTime } from '@/lib/utils'
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'

interface AuditLog {
  id: number
  user_id: number | null
  username: string | null
  action: string
  entity_type: string
  entity_id: number | null
  before: Record<string, any> | null
  after: Record<string, any> | null
  created_at: string
}

interface AuditLogsResponse {
  items: AuditLog[]
  total: number
}

const ENTITY_TYPES = ['user', 'judgment', 'batch', 'batch_file', 'court']

const ACTION_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  user: User,
  judgment: FileText,
  batch: Upload,
  batch_file: Upload,
  court: Building2,
}

const ACTION_COLORS: Record<string, string> = {
  created: 'text-mr-green',
  updated: 'text-mr-gold',
  deleted: 'text-mr-red',
  verified: 'text-mr-green',
  login: 'text-primary',
  logout: 'text-muted-foreground',
}

function getActionColor(action: string): string {
  for (const [key, color] of Object.entries(ACTION_COLORS)) {
    if (action.toLowerCase().includes(key)) {
      return color
    }
  }
  return 'text-primary'
}

function AuditLogItem({ log }: { log: AuditLog }) {
  const { t } = useTranslation(['admin', 'common'])
  const [isOpen, setIsOpen] = useState(false)

  const Icon = ACTION_ICONS[log.entity_type] || Shield
  const actionColor = getActionColor(log.action)
  const hasDetails = log.before || log.after

  return (
    <Card>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-primary/10 p-2.5 shrink-0">
              <Icon className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className={`font-medium ${actionColor}`}>
                    {t(`actions.${log.action}`, { defaultValue: log.action })}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {log.username || t('system')}
                    </span>
                    <span>•</span>
                    <span>{log.entity_type}</span>
                    {log.entity_id && (
                      <>
                        <span>•</span>
                        <span>#{log.entity_id}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-sm text-muted-foreground">
                    {formatDateTime(log.created_at)}
                  </span>
                  {hasDetails && (
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        {isOpen ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </CollapsibleTrigger>
                  )}
                </div>
              </div>
            </div>
          </div>

          {hasDetails && (
            <CollapsibleContent>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {log.before && (
                  <div className="rounded-lg bg-mr-red/5 p-3">
                    <p className="mb-2 text-sm font-medium text-mr-red">{t('before')}</p>
                    <pre className="text-xs overflow-auto max-h-40">
                      {JSON.stringify(log.before, null, 2)}
                    </pre>
                  </div>
                )}
                {log.after && (
                  <div className="rounded-lg bg-mr-green/5 p-3">
                    <p className="mb-2 text-sm font-medium text-mr-green">{t('after')}</p>
                    <pre className="text-xs overflow-auto max-h-40">
                      {JSON.stringify(log.after, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </CollapsibleContent>
          )}
        </CardContent>
      </Collapsible>
    </Card>
  )
}

export function AuditLogsPage() {
  const { t } = useTranslation(['admin', 'common'])
  const [page, setPage] = useState(1)
  const [entityType, setEntityType] = useState<string>('')
  const [search, setSearch] = useState('')
  const pageSize = 20

  const [logsData, setLogsData] = useState<AuditLogsResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [isFetching, setIsFetching] = useState(false)

  const fetchLogs = useCallback(async () => {
    setIsFetching(true)
    setError(null)
    try {
      const result = await auditLogsApi.list({
        page,
        page_size: pageSize,
        entity_type: entityType || undefined,
      })
      setLogsData(result)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'))
    } finally {
      setIsLoading(false)
      setIsFetching(false)
    }
  }, [page, entityType])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  const logs = logsData?.items || []
  const total = logsData?.total || 0
  const totalPages = Math.ceil(total / pageSize)

  // Filter logs by search (client-side)
  const filteredLogs = search
    ? logs.filter(
      (log: AuditLog) =>
        log.action.toLowerCase().includes(search.toLowerCase()) ||
        log.username?.toLowerCase().includes(search.toLowerCase()) ||
        log.entity_type.toLowerCase().includes(search.toLowerCase())
    )
    : logs

  if (error) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4">
        <p className="text-destructive">{t('common:error')}</p>
        <Button onClick={() => fetchLogs()} variant="outline">
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
          <h1 className="text-2xl font-bold">{t('auditLogs')}</h1>
          <p className="text-muted-foreground">{t('auditLogsDescription')}</p>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => fetchLogs()}
          disabled={isFetching}
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t('searchLogs')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="ps-10"
              />
            </div>

            {/* Entity Type Filter */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={entityType || "_none"} onValueChange={setEntityType}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder={t('allTypes')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">{t('allTypes')}</SelectItem>
                  {ENTITY_TYPES.map((type) => (
                    <SelectItem key={type} value={type || "_none"}>
                      {t(`entityTypes.${type}`, { defaultValue: type })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Info */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {t('common:total')}: {total} {t('common:items')}
        </p>
      </div>

      {/* Logs List */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      ) : filteredLogs.length > 0 ? (
        <div className="space-y-3">
          {filteredLogs.map((log) => (
            <AuditLogItem key={log.id} log={log} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <History className="h-12 w-12 text-muted-foreground/30" />
            <h3 className="mt-4 text-lg font-medium">{t('noLogsFound')}</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {t('noLogsFoundDescription')}
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

export default AuditLogsPage
