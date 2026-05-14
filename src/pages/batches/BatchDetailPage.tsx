import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Upload,
  Play,
  Pause,
  RefreshCw,
  Trash2,
  FileText,
  File,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  RotateCcw,
  ExternalLink,
  MoreHorizontal,
  Loader2,
  ArrowRight,
} from 'lucide-react'
import { batchesApi } from '@/api'
import { formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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
import { Progress } from '@/components/ui/progress'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { StatusBadge } from '@/components/common/StatusBadge'
import { FileDropzone } from '@/components/batches/FileDropzone'
import { useLanguage } from '@/contexts'

export function BatchDetailPage() {
  const { t } = useTranslation(['batches', 'common', 'errors'])
  const { batchId } = useParams<{ batchId: string }>()
  const navigate = useNavigate()
  const id = parseInt(batchId || '0', 10)

  // State
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [uploadProgress, setUploadProgress] = useState(0)
  const { language } = useLanguage()

  const [batch, setBatch] = useState<any | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const [isUploading, setIsUploading] = useState(false)
  const [isStartingProcess, setIsStartingProcess] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [isRetryingAll, setIsRetryingAll] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isRetryingFile, setIsRetryingFile] = useState(false)

  const fetchBatch = useCallback(async () => {
    if (!id) return
    setError(null)
    try {
      const result = await batchesApi.getDetails(id)
      setBatch(result)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'))
    } finally {
      setIsLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchBatch()
  }, [fetchBatch])

  const isPolling = batch?.is_processing ?? false

  useEffect(() => {
    if (!isPolling) return
    const interval = setInterval(fetchBatch, 3000)
    return () => clearInterval(interval)
  }, [isPolling, fetchBatch])

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return
    setIsUploading(true)
    setUploadProgress(0)
    try {
      const chunkSize = 5
      let uploaded = 0
      for (let i = 0; i < selectedFiles.length; i += chunkSize) {
        const chunk = selectedFiles.slice(i, i + chunkSize)
        await batchesApi.uploadFiles(id, chunk)
        uploaded += chunk.length
        setUploadProgress(Math.round((uploaded / selectedFiles.length) * 100))
      }
      toast.success(t('filesUploaded'))
      setShowUploadDialog(false)
      setSelectedFiles([])
      setUploadProgress(0)
      await fetchBatch()
    } catch (err: any) {
      toast.error(err.response?.data?.detail || t('errors:fileUploadFailed'))
    } finally {
      setIsUploading(false)
    }
  }

  const handleProcess = async () => {
    setIsStartingProcess(true)
    try {
      await batchesApi.process(id)
      toast.success(t('processingStarted'))
      await fetchBatch()
    } catch (err: any) {
      toast.error(err.response?.data?.detail || t('errors:generic'))
    } finally {
      setIsStartingProcess(false)
    }
  }

  const handleCancel = async () => {
    setIsCancelling(true)
    try {
      await batchesApi.cancel(id)
      toast.success(t('processingCancelled'))
      await fetchBatch()
    } catch (err: any) {
      toast.error(err.response?.data?.detail || t('errors:generic'))
    } finally {
      setIsCancelling(false)
    }
  }

  const handleRetryAll = async () => {
    setIsRetryingAll(true)
    try {
      await batchesApi.retryAllFailed(id, true)
      toast.success(t('retryStarted'))
      await fetchBatch()
    } catch (err: any) {
      toast.error(err.response?.data?.detail || t('errors:generic'))
    } finally {
      setIsRetryingAll(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await batchesApi.delete(id)
      toast.success(t('batchDeleted'))
      navigate('/batches')
    } catch (err: any) {
      toast.error(err.response?.data?.detail || t('errors:generic'))
    } finally {
      setIsDeleting(false)
    }
  }

  const handleRetryFile = async (fileId: number) => {
    setIsRetryingFile(true)
    try {
      await batchesApi.retryFile(id, fileId)
      toast.success(t('common:success'))
      await fetchBatch()
    } catch (err: any) {
      toast.error(err.response?.data?.detail || t('errors:generic'))
    } finally {
      setIsRetryingFile(false)
    }
  }

  // Handlers
  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  // Helper functions
  const getFileIcon = (filename: string) => {
    const ext = filename.toLowerCase().split('.').pop()
    if (ext === 'pdf') {
      return <FileText className="h-5 w-5 text-red-500" />
    }
    return <File className="h-5 w-5 text-blue-500" />
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'done':
        return <CheckCircle className="h-4 w-4 text-mr-green" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-mr-red" />
      case 'processing':
        return <Loader2 className="h-4 w-4 text-primary animate-spin" />
      case 'skipped':
        return <AlertCircle className="h-4 w-4 text-mr-gold" />
      default:
        return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error || !batch) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4">
        <p className="text-destructive">{t('errors:batchNotFound')}</p>
        <Button onClick={() => navigate('/batches')} variant="outline">
          {t('common:back')}
        </Button>
      </div>
    )
  }

  const stats = batch.statistics || {}
  const progress = batch.total_files > 0
    ? Math.round((batch.processed_files / batch.total_files) * 100)
    : 0

  const filteredFiles = batch.files?.filter((file: any) => {
    if (statusFilter === 'all') return true
    return file.status === statusFilter
  }) || []

  const canProcess = batch.status === 'uploading' && batch.total_files > 0
  const canUpload = !batch.is_processing && batch.status !== 'completed'
  const hasFailed = (stats.failed || 0) > 0 || (stats.skipped || 0) > 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/batches')}
          >
            {language === 'ar' ? <ArrowRight className="h-5 w-5" /> : <ArrowLeft className="h-5 w-5" />}
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{batch.name}</h1>
            <div className="mt-1 flex items-center gap-3 flex-wrap">
              <StatusBadge status={batch.status} type="batch" />
              {batch.is_processing && (
                <span className="flex items-center gap-1 text-sm text-primary">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t('processing')}
                </span>
              )}
              <span className="text-sm text-muted-foreground">
                {formatDate(batch.created_at)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="icon"
            onClick={() => fetchBatch()}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>

          {canUpload && (
            <Button
              variant="outline"
              onClick={() => setShowUploadDialog(true)}
            >
              <Upload className="me-2 h-4 w-4" />
              {t('uploadFiles')}
            </Button>
          )}

          {canProcess && (
            <Button onClick={handleProcess} disabled={isStartingProcess}>
              <Play className="me-2 h-4 w-4" />
              {t('startProcessing')}
            </Button>
          )}

          {batch.is_processing && (
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={isCancelling}
            >
              <Pause className="me-2 h-4 w-4" />
              {t('cancelProcessing')}
            </Button>
          )}

          {hasFailed && !batch.is_processing && (
            <Button
              variant="outline"
              onClick={handleRetryAll}
              disabled={isRetryingAll}
            >
              <RotateCcw className="me-2 h-4 w-4" />
              {t('retryFailed')}
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => setShowDeleteDialog(true)}
                disabled={batch.is_processing}
              >
                <Trash2 className="me-2 h-4 w-4" />
                {t('deleteBatch')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Progress & Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Progress Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">{t('progress')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{progress}%</span>
                <span className="text-muted-foreground">
                  {batch.processed_files} / {batch.total_files}
                </span>
              </div>
              <Progress value={progress} className="h-3" />
            </div>
          </CardContent>
        </Card>

        {/* Stats Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">{t('statistics')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-500">
                  {stats.pending || 0}
                </p>
                <p className="text-xs text-muted-foreground">{t('fileStatus.pending')}</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">
                  {stats.processing || 0}
                </p>
                <p className="text-xs text-muted-foreground">{t('fileStatus.processing')}</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-mr-green">
                  {stats.done || 0}
                </p>
                <p className="text-xs text-muted-foreground">{t('fileStatus.done')}</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-mr-red">
                  {(stats.failed || 0) + (stats.skipped || 0)}
                </p>
                <p className="text-xs text-muted-foreground">{t('fileStatus.failed')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Files List */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>{t('files')}</CardTitle>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('common:all')} ({batch.total_files})</SelectItem>
                <SelectItem value="pending">{t('fileStatus.pending')} ({stats.pending || 0})</SelectItem>
                <SelectItem value="processing">{t('fileStatus.processing')} ({stats.processing || 0})</SelectItem>
                <SelectItem value="done">{t('fileStatus.done')} ({stats.done || 0})</SelectItem>
                <SelectItem value="failed">{t('fileStatus.failed')} ({stats.failed || 0})</SelectItem>
                <SelectItem value="skipped">{t('fileStatus.skipped')} ({stats.skipped || 0})</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {filteredFiles.length > 0 ? (
            <div className="divide-y rounded-lg border">
              {filteredFiles.map((file: any) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-3 hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {getFileIcon(file.original_filename)}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {file.original_filename}
                      </p>
                      {file.error_message && (
                        <p className="mt-0.5 text-xs text-destructive truncate">
                          {file.error_message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {getStatusIcon(file.status)}
                    <StatusBadge status={file.status} type="file" />

                    {file.judgment_id && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        asChild
                      >
                        <Link to={`/judgments/${file.judgment_id}`}>
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                      </Button>
                    )}

                    {(file.status === 'failed' || file.status === 'skipped') && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleRetryFile(file.id)}
                        disabled={isRetryingFile || batch.is_processing}
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-32 items-center justify-center rounded-lg border border-dashed">
              <p className="text-sm text-muted-foreground">
                {statusFilter === 'all' ? t('noFiles') : t('noFilesWithStatus')}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Dialog */}
      <AlertDialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('uploadMoreFiles')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('uploadMoreFilesDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <FileDropzone
            onFilesSelected={setSelectedFiles}
            selectedFiles={selectedFiles}
            onRemoveFile={handleRemoveFile}
            disabled={isUploading}
          />

          {isUploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>{t('uploading')}</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} />
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setSelectedFiles([])
                setUploadProgress(0)
              }}
              disabled={isUploading}
            >
              {t('common:cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUpload}
              disabled={selectedFiles.length === 0 || isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="me-2 h-4 w-4 animate-spin" />
                  {uploadProgress}%
                </>
              ) : (
                <>
                  <Upload className="me-2 h-4 w-4" />
                  {t('uploadFiles')} ({selectedFiles.length})
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
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
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {t('common:delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default BatchDetailPage
