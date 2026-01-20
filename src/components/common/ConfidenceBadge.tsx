import { useTranslation } from 'react-i18next'
import { cn, formatConfidence, getConfidenceLevel } from '@/lib/utils'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from '@/components/ui/tooltip'

interface ConfidenceBadgeProps {
  score: number
  showLabel?: boolean
  size?: 'sm' | 'md'
  className?: string
}

export function ConfidenceBadge({
  score,
  showLabel = false,
  size = 'md',
  className,
}: ConfidenceBadgeProps) {
  const { t } = useTranslation('validation')
  const level = getConfidenceLevel(score)

  const levelStyles = {
    high: 'bg-mr-green/10 text-mr-green border-mr-green/30',
    medium: 'bg-mr-gold/10 text-amber-700 border-mr-gold/30',
    low: 'bg-mr-red/10 text-mr-red border-mr-red/30',
  }

  const levelLabels = {
    high: t('confidenceHigh'),
    medium: t('confidenceMedium'),
    low: t('confidenceLow'),
  }

  const sizeStyles = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-1',
  }

  const badge = (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded border font-medium',
        levelStyles[level],
        sizeStyles[size],
        className
      )}
    >
      <span>{formatConfidence(score)}</span>
      {showLabel && <span className="text-xs opacity-80">{levelLabels[level]}</span>}
    </span>
  )

  if (!showLabel) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{badge}</TooltipTrigger>
          <TooltipContent>{levelLabels[level]}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return badge
}

interface FieldConfidenceProps {
  fieldName: string
  score: number
  pattern?: string | null
}

export function FieldConfidence({ fieldName, score, pattern }: FieldConfidenceProps) {
  const { t } = useTranslation('dataEntry')
  const level = getConfidenceLevel(score)

  const dotStyles = {
    high: 'bg-mr-green',
    medium: 'bg-mr-gold',
    low: 'bg-mr-red',
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1.5">
            <span
              className={cn('h-2 w-2 rounded-full', dotStyles[level])}
            />
            <span className="text-xs text-muted-foreground">
              {formatConfidence(score)}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-xs">
            <p>{t('fieldConfidence')}: {formatConfidence(score)}</p>
            {pattern && (
              <p className="mt-1 text-muted-foreground">
                {t('pattern')}: {pattern}
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export default ConfidenceBadge
