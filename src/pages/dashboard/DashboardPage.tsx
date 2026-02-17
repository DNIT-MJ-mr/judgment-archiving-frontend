import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  FileText,
  CheckCircle,
  AlertCircle,
  Clock,
  Upload,
  ArrowRight,
  TrendingUp,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { usePermissions } from '@/hooks/usePermissions'
import { dashboardApi } from '@/api'
import { formatDate } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { StatusBadge } from '@/components/common/StatusBadge'

function StatCard({
  title,
  value,
  icon: Icon,
  color,
  description,
}: {
  title: string
  value: number | string
  icon: React.ComponentType<{ className?: string }>
  color: 'green' | 'gold' | 'red' | 'blue' | 'gray'
  description?: string
}) {
  const colorStyles = {
    green: 'bg-mr-green/10 text-mr-green',
    gold: 'bg-mr-gold/10 text-amber-700',
    red: 'bg-mr-red/10 text-mr-red',
    blue: 'bg-blue-500/10 text-blue-600',
    gray: 'bg-gray-100 text-gray-600',
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="mt-1 text-3xl font-bold">{value}</p>
            {description && (
              <p className="mt-1 text-xs text-muted-foreground">{description}</p>
            )}
          </div>
          <div className={`rounded-full p-3 ${colorStyles[color]}`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function DashboardPage() {
  const { t } = useTranslation(['dashboard', 'common', 'navigation'])
  const { user } = useAuth()
  const permissions = usePermissions()

  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: dashboardApi.getStats,
    refetchInterval: 30000, // Refresh every 30 seconds
    refetchOnMount: 'stale',
  })

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-destructive">{t('common:error')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl font-bold">
          {t('welcome')}, {user?.full_name || user?.username}
        </h1>
        <p className="text-muted-foreground">
          {t('overview')}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title={t('totalJudgments')}
          value={stats?.total_judgments || 0}
          icon={FileText}
          color="blue"
        />
        <StatCard
          title={t('verifiedJudgments')}
          value={stats?.verified || 0}
          icon={CheckCircle}
          color="green"
        />
        <StatCard
          title={t('pendingValidation')}
          value={stats?.pending_validation || 0}
          icon={Clock}
          color="gold"
        />
        <StatCard
          title={t('failedExtraction')}
          value={stats?.failed || 0}
          icon={AlertCircle}
          color="red"
        />
      </div>

      {/* Accuracy Card */}
      {stats && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t('extractionAccuracy')}
                </p>
                <p className="mt-1 text-3xl font-bold">
                  {stats.extraction_accuracy.toFixed(1)}%
                </p>
              </div>
              <div className="rounded-full bg-mr-green/10 p-3 text-mr-green">
                <TrendingUp className="h-6 w-6" />
              </div>
            </div>
            {/* Progress bar */}
            <div className="mt-4 h-2 rounded-full bg-gray-100">
              <div
                className="h-2 rounded-full bg-mr-green transition-all"
                style={{ width: `${Math.min(stats.extraction_accuracy, 100)}%` }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions & Recent Batches */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>{t('quickActions')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {permissions.canUpload && (
              <Button asChild className="w-full justify-start" variant="outline">
                <Link to="/batches/new">
                  <Upload className="me-2 h-4 w-4" />
                  {t('createNewBatch')}
                </Link>
              </Button>
            )}
            {permissions.canAccessValidation && (
              <Button asChild className="w-full justify-start" variant="outline">
                <Link to="/validation">
                  <CheckCircle className="me-2 h-4 w-4" />
                  {t('goToValidation')}
                  {stats && stats.pending_validation > 0 && (
                    <span className="ms-auto rounded-full bg-mr-gold/20 px-2 py-0.5 text-xs font-medium text-amber-700">
                      {stats.pending_validation}
                    </span>
                  )}
                </Link>
              </Button>
            )}
            {permissions.canAccessDataEntry && (
              <Button asChild className="w-full justify-start" variant="outline">
                <Link to="/data-entry">
                  <AlertCircle className="me-2 h-4 w-4" />
                  {t('goToDataEntry')}
                  {stats && stats.failed > 0 && (
                    <span className="ms-auto rounded-full bg-mr-red/20 px-2 py-0.5 text-xs font-medium text-mr-red">
                      {stats.failed}
                    </span>
                  )}
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Recent Batches */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{t('recentBatches')}</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link to="/batches">
                {t('viewAll')}
                <ArrowRight className="ms-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {stats?.recent_batches && stats.recent_batches.length > 0 ? (
              <div className="space-y-3">
                {stats.recent_batches.map((batch) => (
                  <Link
                    key={batch.id}
                    to={`/batches/${batch.id}`}
                    className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{batch.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(batch.created_at)}
                      </p>
                    </div>
                    <div className="ms-4 flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {batch.processed_files}/{batch.total_files}
                      </span>
                      <StatusBadge status={batch.status} type="batch" />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">
                {t('noRecentBatches')}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default DashboardPage
