import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { EXTRACTION_STATUS, BATCH_STATUS } from '@/lib/constants'

interface StatusBadgeProps {
  status: string
  type?: 'extraction' | 'batch' | 'file'
  className?: string
}

const extractionStatusStyles: Record<string, string> = {
  [EXTRACTION_STATUS.VERIFIED]: 'status-verified',
  [EXTRACTION_STATUS.NEEDS_REVIEW]: 'status-review',
  [EXTRACTION_STATUS.AUTO]: 'status-auto',
  [EXTRACTION_STATUS.FAILED]: 'status-failed',
}

const batchStatusStyles: Record<string, string> = {
  [BATCH_STATUS.COMPLETED]: 'status-verified',
  [BATCH_STATUS.REVIEWING]: 'status-review',
  [BATCH_STATUS.PROCESSING]: 'status-auto',
  [BATCH_STATUS.UPLOADING]: 'status-pending',
  [BATCH_STATUS.FAILED]: 'status-failed',
}

const fileStatusStyles: Record<string, string> = {
  done: 'status-verified',
  pending: 'status-pending',
  processing: 'status-auto',
  failed: 'status-failed',
  skipped: 'status-review',
}

export function StatusBadge({ status, type = 'extraction', className }: StatusBadgeProps) {
  const { t } = useTranslation(['judgments', 'batches'])

  const getStatusStyle = () => {
    switch (type) {
      case 'batch':
        return batchStatusStyles[status] || 'status-pending'
      case 'file':
        return fileStatusStyles[status] || 'status-pending'
      default:
        return extractionStatusStyles[status] || 'status-pending'
    }
  }

  const getStatusLabel = () => {
    switch (type) {
      case 'batch':
        return t(`batches:batchStatus.${status}`, status)
      case 'file':
        return t(`batches:fileStatus.${status}`, status)
      default:
        return t(`judgments:statuses.${status}`, status)
    }
  }

  return (
    <span className={cn('status-badge', getStatusStyle(), className)}>
      {getStatusLabel()}
    </span>
  )
}

export default StatusBadge
