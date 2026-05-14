import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { validationApi } from '@/api'
import { useLanguage } from '@/contexts'
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileText,
  PanelLeftClose,
  PanelLeft,
  Loader2,
  Copy,
  Edit3,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { ConfidenceBadge } from '@/components/common/ConfidenceBadge'
import { DocumentPreview } from '@/components/data-entry/DocumentPreview'
import { ValidationForm } from '@/components/validation/ValidationForm'
import { DuplicateResolution } from '@/components/validation/DuplicateResolution'

export function ValidationDetailPage() {
  const { t } = useTranslation(['validation', 'judgments', 'common', 'errors'])
  const { language } = useLanguage()
  const { judgmentId } = useParams<{ judgmentId: string }>()
  const navigate = useNavigate()
  const id = parseInt(judgmentId || '0', 10)

  const [showPreview, setShowPreview] = useState(true)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  // Judgment query state
  const [judgment, setJudgment] = useState<Awaited<ReturnType<typeof validationApi.getDetail>> | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchJudgment = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await validationApi.getDetail(id)
      setJudgment(result)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'))
    } finally {
      setIsLoading(false)
    }
  }, [id])

  useEffect(() => {
    if (id) {
      fetchJudgment()
    }
  }, [fetchJudgment, id])

  // Mutation loading states
  const [isVerifying, setIsVerifying] = useState(false)
  const [isSendingToDataEntry, setIsSendingToDataEntry] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isConfirmingDuplicate, setIsConfirmingDuplicate] = useState(false)
  const [isDismissingDuplicate, setIsDismissingDuplicate] = useState(false)

  // Get next item
  const handleNext = async () => {
    try {
      const next = await validationApi.getNext()
      if (next?.id && next.id !== id) {
        navigate(`/validation/${next.id}`)
      } else {
        toast.info(t('noMoreItems'))
        navigate('/validation')
      }
    } catch (error) {
      navigate('/validation')
    }
  }

  // Handle verify
  const handleVerify = async () => {
    if (judgment?.duplicate_of_id) {
      toast.error(t('resolveDuplicateFirst'))
      return
    }
    setIsVerifying(true)
    try {
      await validationApi.verify(id)
      toast.success(t('verifiedSuccessfully'))
      await handleNext()
    } catch (error: any) {
      const detail = error.response?.data?.detail
      toast.error(typeof detail === 'string' ? detail : t('errors:generic'))
    } finally {
      setIsVerifying(false)
    }
  }

  // Handle reject (send to data entry)
  const handleReject = async () => {
    setShowRejectDialog(false)
    setIsSendingToDataEntry(true)
    try {
      await validationApi.sendToDataEntry(id)
      toast.success(t('sentToDataEntry'))
      await handleNext()
    } catch (error: any) {
      toast.error(error.response?.data?.detail || t('errors:generic'))
    } finally {
      setIsSendingToDataEntry(false)
    }
  }

  const handleUpdate = async (data: Record<string, any>) => {
    setIsSaving(true)
    try {
      await validationApi.update(id, data)
      toast.success(t('common:saved'))
      await fetchJudgment()
      setIsEditing(false)
    } catch (error: any) {
      toast.error(error.response?.data?.detail || t('errors:generic'))
    } finally {
      setIsSaving(false)
    }
  }

  const handleConfirmDuplicate = async (primaryId: number) => {
    setIsConfirmingDuplicate(true)
    try {
      await validationApi.confirmDuplicate(id, primaryId)
      toast.success(t('duplicateConfirmed'))
      await fetchJudgment()
    } catch (error: any) {
      toast.error(error.response?.data?.detail || t('errors:generic'))
    } finally {
      setIsConfirmingDuplicate(false)
    }
  }

  const handleDismissDuplicate = async () => {
    setIsDismissingDuplicate(true)
    try {
      await validationApi.dismissDuplicate(id)
      toast.success(t('duplicateDismissed'))
      await fetchJudgment()
    } catch (error: any) {
      toast.error(error.response?.data?.detail || t('errors:generic'))
    } finally {
      setIsDismissingDuplicate(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error || !judgment) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4">
        <p className="text-destructive">{t('errors:judgmentNotFound')}</p>
        <Button onClick={() => navigate('/validation')} variant="outline">
          {language === 'ar' ? <ArrowRight className="me-2 h-4 w-4" /> : <ArrowLeft className="me-2 h-4 w-4" />}
          {t('common:back')}
        </Button>
      </div>
    )
  }

  const fields = judgment.fields || {}
  const confidence = judgment.confidence || {}
  const source = judgment.source || {}
  const hasDuplicate = !!judgment.duplicate_of_id

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/validation')}
          >
            {language === 'ar' ? <ArrowRight className="h-5 w-5" /> : <ArrowLeft className="h-5 w-5" />}
          </Button>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold">
                {fields.case_number || t('judgments:noCaseNumber')}
              </h1>
              <StatusBadge status={judgment.status} type="extraction" />
              <ConfidenceBadge score={confidence.document || 0} />
              {hasDuplicate && (
                <span className="flex items-center gap-1 rounded bg-mr-red/10 px-2 py-0.5 text-xs font-medium text-mr-red">
                  <Copy className="h-3 w-3" />
                  {t('hasDuplicate')}
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {source.original_name || t('noSourceFile')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowPreview(!showPreview)}
            title={showPreview ? t('hidePreview') : t('showPreview')}
          >
            {showPreview ? (
              <PanelLeftClose className="h-4 w-4" />
            ) : (
              <PanelLeft className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="outline"
            onClick={() => setIsEditing(!isEditing)}
          >
            <Edit3 className="me-2 h-4 w-4" />
            {isEditing ? t('common:cancel') : t('edit')}
          </Button>
          <Button
            variant="outline"
            onClick={handleNext}
          >
            {language === 'ar' ? <ArrowRight className="me-2 h-4 w-4" /> : <ArrowLeft className="me-2 h-4 w-4" />}
            {t('skip')}
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 gap-4 overflow-hidden pt-4">
        {/* Document Preview */}
        {showPreview && (
          <div className="hidden w-1/2 overflow-hidden lg:block">
            <DocumentPreview
              judgmentId={id}
              sourceFilePath={source.path}
              sourceOriginalName={source.original_name}
              sourceType={source.type}
            />
          </div>
        )}

        {/* Form/Review Panel */}
        <div className={`flex-1 overflow-auto ${showPreview ? 'lg:w-1/2' : 'w-full'}`}>
          {/* Duplicate Resolution Section */}
          {hasDuplicate && (
            <Card className="mb-4 border-mr-red/30 bg-mr-red/5">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-mr-red">
                  <AlertTriangle className="h-5 w-5" />
                  {t('duplicateDetected')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <DuplicateResolution
                  duplicateOfId={judgment.duplicate_of_id!}
                  onConfirm={(primaryId) => handleConfirmDuplicate(primaryId)}
                  onDismiss={() => handleDismissDuplicate()}
                  isConfirming={isConfirmingDuplicate}
                  isDismissing={isDismissingDuplicate}
                />
              </CardContent>
            </Card>
          )}

          {/* Judgment Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {t('judgmentDetails')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ValidationForm
                fields={fields}
                confidence={confidence}
                isEditing={isEditing}
                onSave={(data) => handleUpdate(data)}
                isSaving={isSaving}
              />
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              className="text-mr-red hover:text-mr-red"
              onClick={() => setShowRejectDialog(true)}
              disabled={isSendingToDataEntry}
            >
              {isSendingToDataEntry ? (
                <Loader2 className="me-2 h-4 w-4 animate-spin" />
              ) : (
                <XCircle className="me-2 h-4 w-4" />
              )}
              {t('sendToDataEntry')}
            </Button>
            <Button
              className="bg-mr-green hover:bg-mr-green/90"
              onClick={handleVerify}
              disabled={isVerifying || hasDuplicate}
            >
              {isVerifying ? (
                <Loader2 className="me-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="me-2 h-4 w-4" />
              )}
              {t('verify')}
            </Button>
          </div>
        </div>
      </div>

      {/* Reject Confirmation Dialog */}
      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('confirmSendToDataEntry')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('sendToDataEntryDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {t('common:cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReject}
              className="bg-mr-red text-white hover:bg-mr-red/90"
            >
              {t('sendToDataEntry')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default ValidationDetailPage
