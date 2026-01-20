import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  ExternalLink,
  Check,
  X,
  FileText,
  Calendar,
  Loader2,
  ArrowRight,
} from 'lucide-react'
import { judgmentsApi } from '@/api'
import { formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'

interface DuplicateResolutionProps {
  currentJudgmentId: number
  duplicateOfId: number
  onConfirm: (primaryId: number) => void
  onDismiss: () => void
  isConfirming: boolean
  isDismissing: boolean
}

export function DuplicateResolution({
  currentJudgmentId,
  duplicateOfId,
  onConfirm,
  onDismiss,
  isConfirming,
  isDismissing,
}: DuplicateResolutionProps) {
  const { t } = useTranslation(['validation', 'judgments', 'common'])

  // Fetch the potential duplicate judgment
  const { data: duplicateJudgment, isLoading } = useQuery({
    queryKey: ['judgment', duplicateOfId],
    queryFn: () => judgmentsApi.getOne(duplicateOfId),
    enabled: !!duplicateOfId,
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <LoadingSpinner />
      </div>
    )
  }

  if (!duplicateJudgment) {
    return (
      <div className="text-sm text-muted-foreground">
        {t('duplicateNotFound')}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Explanation */}
      <p className="text-sm text-muted-foreground">
        {t('duplicateExplanation')}
      </p>

      {/* Comparison */}
      <div className="rounded-lg border bg-background p-4">
        <div className="mb-3 flex items-center justify-between">
          <h4 className="font-medium">{t('existingRecord')}</h4>
          <Link
            to={`/judgments/${duplicateOfId}`}
            target="_blank"
            className="flex items-center gap-1 text-sm text-primary hover:underline"
          >
            {t('viewInNewTab')}
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-start gap-3">
            <FileText className="mt-0.5 h-4 w-4 text-muted-foreground" />
            <div>
              <p className="font-medium">
                {duplicateJudgment.case_number || t('judgments:noCaseNumber')}
              </p>
              {duplicateJudgment.judgment_number && (
                <p className="text-muted-foreground">
                  {t('judgments:judgmentNumber')}: {duplicateJudgment.judgment_number}
                </p>
              )}
            </div>
          </div>

          {duplicateJudgment.extracted_court_text && (
            <div className="flex items-center gap-3 text-muted-foreground">
              <span className="w-4" />
              <span>{duplicateJudgment.extracted_court_text}</span>
            </div>
          )}

          {duplicateJudgment.judgment_date && (
            <div className="flex items-center gap-3 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>{formatDate(duplicateJudgment.judgment_date)}</span>
            </div>
          )}

          <div className="flex items-center gap-3 text-muted-foreground">
            <span className="w-4" />
            <span>
              {t('judgments:extractionStatus')}: {' '}
              <span className={
                duplicateJudgment.extraction_status === 'verified' 
                  ? 'text-mr-green font-medium' 
                  : ''
              }>
                {t(`judgments:statuses.${duplicateJudgment.extraction_status}`)}
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3 sm:flex-row">
        {/* Keep Existing (Current becomes duplicate) */}
        <Button
          variant="outline"
          className="flex-1 justify-start"
          onClick={() => onConfirm(duplicateOfId)}
          disabled={isConfirming || isDismissing}
        >
          {isConfirming ? (
            <Loader2 className="me-2 h-4 w-4 animate-spin" />
          ) : (
            <Check className="me-2 h-4 w-4 text-mr-green" />
          )}
          <div className="text-start">
            <p className="font-medium">{t('keepExisting')}</p>
            <p className="text-xs text-muted-foreground">{t('markCurrentAsDuplicate')}</p>
          </div>
        </Button>

        {/* Not a Duplicate */}
        <Button
          variant="outline"
          className="flex-1 justify-start"
          onClick={onDismiss}
          disabled={isConfirming || isDismissing}
        >
          {isDismissing ? (
            <Loader2 className="me-2 h-4 w-4 animate-spin" />
          ) : (
            <X className="me-2 h-4 w-4 text-mr-red" />
          )}
          <div className="text-start">
            <p className="font-medium">{t('notDuplicate')}</p>
            <p className="text-xs text-muted-foreground">{t('removeFlag')}</p>
          </div>
        </Button>
      </div>

      {/* Note about verification */}
      <p className="text-xs text-muted-foreground">
        {t('duplicateNote')}
      </p>
    </div>
  )
}

export default DuplicateResolution
