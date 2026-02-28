import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Plus,
  FolderOpen,
  Clock,
  CheckCircle,
  Loader2,
  RefreshCw,
  Search,
  MoreHorizontal,
  Trash2,
  Eye,
  Play,
} from 'lucide-react'
import { batchesApi } from '@/api'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { StatusBadge } from '@/components/common/StatusBadge'

export function BatchesPage() {
  const { t } = useTranslation(['batches', 'common'])
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null)

  const {
    data: batches,
    isLoading,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['batches', statusFilter],
    queryFn: () =>
      batchesApi.list(statusFilter !== 'all' ? { status: statusFilter } : undefined),
    refetchInterval: (data: any) => {
      // Check if data is an array and if any batch is processing
      const hasProcessing = Array.isArray(data) && data.some((batch: any) => batch.is_processing)
      // Refetch every 5 seconds if processing, otherwise stop
      return hasProcessing ? 5000 : false
    },
    refetchOnMount: false,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => batchesApi.delete(id),
    onSuccess: () => {
      toast.success(t('common:success'))
      queryClient.invalidateQueries({ queryKey: ['batches'] })
      setDeleteTarget(null)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || t('common:error'))
    },
  })

  const processMutation = useMutation({
    mutationFn: (id: number) => batchesApi.process(id),
    onSuccess: () => {
      toast.success(t('processingStarted'))
      queryClient.invalidateQueries({ queryKey: ['batches'] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || t('common:error'))
    },
  })

  const filteredBatches = batches?.filter((batch) => {
    if (!searchQuery) return true
    return batch.name.toLowerCase().includes(searchQuery.toLowerCase())
  })

  const getProgressPercent = (batch: any) => {
    if (batch.total_files === 0) return 0
    return Math.round((batch.processed_files / batch.total_files) * 100)
  }

  const getProgressColor = (batch: any) => {
    if (batch.status === 'completed') return 'bg-mr-green'
    if (batch.status === 'failed') return 'bg-mr-red'
    if (batch.status === 'processing') return 'bg-primary'
    return 'bg-gray-300'
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
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          </Button>
          <Button asChild>
            <Link to="/batches/new">
              <Plus className="me-2 h-4 w-4" />
              {t('createBatch')}
            </Link>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t('common:search')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="ps-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('common:all')}</SelectItem>
                <SelectItem value="uploading">{t('batchStatus.uploading')}</SelectItem>
                <SelectItem value="processing">{t('batchStatus.processing')}</SelectItem>
                <SelectItem value="reviewing">{t('batchStatus.reviewing')}</SelectItem>
                <SelectItem value="completed">{t('batchStatus.completed')}</SelectItem>
                <SelectItem value="failed">{t('batchStatus.failed')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Batches List */}
      {filteredBatches && filteredBatches.length > 0 ? (
        <div className="grid gap-4">
          {filteredBatches.map((batch) => (
            <Card key={batch.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  {/* Batch Info */}
                  <div className="flex items-start gap-4 min-w-0 flex-1">
                    <div className="rounded-lg bg-muted p-3 shrink-0">
                      <FolderOpen className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <Link
                        to={`/batches/${batch.id}`}
                        className="font-semibold hover:text-primary truncate block"
                      >
                        {batch.name}
                      </Link>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(batch.created_at)}
                      </p>
                      <div className="mt-2 flex items-center gap-2 flex-wrap">
                        <StatusBadge status={batch.status} type="batch" />
                        {batch.is_processing && (
                          <span className="flex items-center gap-1 text-xs text-primary">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            {t('processing')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="w-full lg:w-48 shrink-0">
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {batch.processed_files}/{batch.total_files}
                      </span>
                      <span className="font-medium">
                        {getProgressPercent(batch)}%
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-100">
                      <div
                        className={`h-2 rounded-full transition-all ${getProgressColor(batch)}`}
                        style={{ width: `${getProgressPercent(batch)}%` }}
                      />
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-sm shrink-0">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{batch.total_files - batch.processed_files}</span>
                    </div>
                    <div className="flex items-center gap-1 text-mr-green">
                      <CheckCircle className="h-4 w-4" />
                      <span>{batch.processed_files}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <Button asChild variant="outline" size="sm">
                      <Link to={`/batches/${batch.id}`}>
                        <Eye className="me-2 h-4 w-4" />
                        {t('common:details')}
                      </Link>
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link to={`/batches/${batch.id}`}>
                            <Eye className="me-2 h-4 w-4" />
                            {t('common:details')}
                          </Link>
                        </DropdownMenuItem>
                        {batch.status === 'uploading' && batch.total_files > 0 && (
                          <DropdownMenuItem
                            onClick={() => processMutation.mutate(batch.id)}
                            disabled={processMutation.isPending}
                          >
                            <Play className="me-2 h-4 w-4" />
                            {t('startProcessing')}
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => setDeleteTarget(batch.id)}
                          disabled={batch.is_processing}
                        >
                          <Trash2 className="me-2 h-4 w-4" />
                          {t('deleteBatch')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FolderOpen className="mb-4 h-16 w-16 text-muted-foreground/50" />
            <h3 className="text-lg font-medium">{t('noBatches')}</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {t('createFirstBatch')}
            </p>
            <Button asChild className="mt-4">
              <Link to="/batches/new">
                <Plus className="me-2 h-4 w-4" />
                {t('createBatch')}
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('confirmDelete')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('deleteWarning')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common:cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('common:delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default BatchesPage
