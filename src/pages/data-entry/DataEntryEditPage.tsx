import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  ArrowLeft,
  ArrowRight,
  AlertTriangle,
  Trash2,
  FileText,
  PanelLeftClose,
  PanelLeft,
  Loader2,
  Link as LinkIcon,
} from 'lucide-react'
import { dataEntryApi } from '@/api'
import { useLanguage } from '@/contexts'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { StatusBadge } from '@/components/common/StatusBadge'
import { ConfidenceBadge } from '@/components/common/ConfidenceBadge'
import { DocumentPreview } from '@/components/data-entry/DocumentPreview'
import { JudgmentForm, JudgmentFormValues } from '@/components/data-entry/JudgmentForm'

export function DataEntryEditPage() {
  const { t } = useTranslation(['dataEntry', 'judgments', 'common', 'errors'])
  const { language } = useLanguage()
  const { judgmentId } = useParams<{ judgmentId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const id = parseInt(judgmentId || '0', 10)

  const [showPreview, setShowPreview] = useState(true)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteReason, setDeleteReason] = useState('')

  // Fetch judgment details
  const {
    data: judgment,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['data-entry-item', id],
    queryFn: () => dataEntryApi.getItem(id),
    enabled: !!id,
  })

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: JudgmentFormValues) => dataEntryApi.updateItem(id, data as any),
    onSuccess: () => {
      toast.success(t('savedSuccessfully'))
      queryClient.invalidateQueries({ queryKey: ['data-entry-item', id] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || t('errors:generic'))
    },
  })

  // Submit for review mutation
  const submitMutation = useMutation({
    mutationFn: async (data: JudgmentFormValues) => {
      // First save, then submit
      await dataEntryApi.updateItem(id, data as any)
      return dataEntryApi.submitForReview(id)
    },
    onSuccess: (response) => {
      if (response.has_potential_duplicate) {
        toast.warning(t('duplicateWarning'), {
          description: t('duplicateSubmitted'),
        })
      } else {
        toast.success(t('submittedSuccessfully'))
      }
      navigate('/data-entry')
    },
    onError: (error: any) => {
      const detail = error.response?.data?.detail
      if (typeof detail === 'object' && detail.missing) {
        toast.error(t('missingRequiredFields'), {
          description: detail.missing.join(', '),
        })
      } else {
        toast.error(typeof detail === 'string' ? detail : t('errors:generic'))
      }
    },
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (reason: string) => dataEntryApi.deleteItem(id, reason),
    onSuccess: () => {
      toast.success(t('deletedSuccessfully'))
      navigate('/data-entry')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || t('errors:generic'))
    },
  })

  // Get next item mutation
  const getNextMutation = useMutation({
    mutationFn: () => dataEntryApi.getNext(),
    onSuccess: (nextItem) => {
      if (nextItem?.id) {
        navigate(`/data-entry/${nextItem.id}`)
      } else {
        toast.info(t('noMoreItems'))
        navigate('/data-entry')
      }
    },
    onError: () => {
      toast.info(t('noMoreItems'))
      navigate('/data-entry')
    },
  })

  const handleSave = (data: JudgmentFormValues) => {
    updateMutation.mutate(data as any)
  }

  const handleSubmit = (data: JudgmentFormValues) => {
    submitMutation.mutate(data as any)
  }

  const handleDelete = () => {
    if (deleteReason.trim().length < 5) {
      toast.error(t('deleteReasonRequired'))
      return
    }
    deleteMutation.mutate(deleteReason)
  }

  const handleNext = () => {
    getNextMutation.mutate()
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
        <Button onClick={() => navigate('/data-entry')} variant="outline">
          {language === 'ar' ? <ArrowRight className="me-2 h-4 w-4" /> : <ArrowLeft className="me-2 h-4 w-4" />}
          {t('common:back')}
        </Button>
      </div>
    )
  }

  const normalizeFields = (rawFields: any) => {
    if (!rawFields) return {}
    return {
      case_number: rawFields.case_number || undefined,
      judgment_number: rawFields.judgment_number || undefined,
      judgment_date: rawFields.judgment_date || undefined,
      extracted_court_text: rawFields.extracted_court_text || undefined,
      court_id: rawFields.court_id || undefined,
      judgment_type: rawFields.judgment_type || undefined,
      degree: rawFields.degree || undefined,
      sentence_summary: rawFields.sentence_summary || undefined,
    }
  }
  const fields = normalizeFields(judgment.fields)
  const confidence = judgment.confidence || {}
  const source = judgment.source || {}
  const metadata = judgment.metadata || {}

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/data-entry')}
          >
            {language === 'ar' ? <ArrowRight className="h-5 w-5" /> : <ArrowLeft className="h-5 w-5" />}
          </Button>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold">
                {fields.case_number || t('judgments:noCaseNumber')}
              </h1>
              <StatusBadge status={metadata.extraction_status} type="extraction" />
              <ConfidenceBadge score={confidence.document || 0} />
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
            onClick={handleNext}
            disabled={getNextMutation.isPending}
          >
            {getNextMutation.isPending ? (
              <Loader2 className="me-2 h-4 w-4 animate-spin" />
            ) : (
              language === 'ar' ? <ArrowRight className="me-2 h-4 w-4" /> : <ArrowLeft className="me-2 h-4 w-4" />
            )}
            {t('nextItem')}
          </Button>
          <Button
            variant="outline"
            className="text-destructive hover:text-destructive"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="me-2 h-4 w-4" />
            {t('common:delete')}
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
              sourceFilePath={source.file_path}
              sourceOriginalName={source.original_name}
              sourceType={source.type}
            />
          </div>
        )}

        {/* Form */}
        <div className={`flex-1 overflow-auto ${showPreview ? 'lg:w-1/2' : 'w-full'}`}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {t('editJudgment')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Duplicate Warning */}
              {metadata.duplicate_of_id && (
                <div className="mb-6 flex items-start gap-3 rounded-lg bg-mr-gold/10 p-4 border border-mr-gold/20">
                  <AlertTriangle className="h-5 w-5 shrink-0 text-mr-gold" />
                  <div>
                    <p className="font-medium text-mr-gold">
                      {t('potentialDuplicate')}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {t('duplicateId')}: #{metadata.duplicate_of_id}
                    </p>
                    <Button
                      variant="link"
                      size="sm"
                      className="mt-1 h-auto p-0 text-primary"
                      onClick={() => navigate(`/judgments/${metadata.duplicate_of_id}`)}
                    >
                      <LinkIcon className="me-1 h-3 w-3" />
                      {t('viewOriginal')}
                    </Button>
                  </div>
                </div>
              )}

              <JudgmentForm
                initialData={fields}
                fieldConfidence={confidence.per_field}
                fieldPatterns={confidence.patterns}
                onSubmit={handleSubmit}
                onSave={handleSave}
                isSubmitting={submitMutation.isPending}
                isSaving={updateMutation.isPending}
                submitLabel={t('submitForReview')}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('confirmDelete')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('deleteWarning')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="deleteReason">{t('deleteReason')}</Label>
            <Input
              id="deleteReason"
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value)}
              placeholder={t('deleteReasonPlaceholder')}
              className="mt-2"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              {t('deleteReasonMinLength')}
            </p>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteReason('')}>
              {t('common:cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteReason.trim().length < 5 || deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending && (
                <Loader2 className="me-2 h-4 w-4 animate-spin" />
              )}
              {t('common:delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default DataEntryEditPage
