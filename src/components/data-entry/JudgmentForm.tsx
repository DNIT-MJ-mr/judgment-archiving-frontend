import { useEffect, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AlertCircle, Info, Sparkles } from 'lucide-react'
import { courtsApi } from '@/api'
import { cn } from '@/lib/utils'
import { REQUIRED_FIELDS, JUDGMENT_FIELDS } from '@/lib/constants'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from '@/components/ui/tooltip'

// Form validation schema
const judgmentFormSchema = z.object({
  case_number: z.string().optional(),
  judgment_number: z.string().optional(),
  judgment_date: z.string().optional(),
  extracted_court_text: z.string().optional(),
  court_id: z.number().nullable().optional(),
  judgment_type: z.string().optional(),
  degree: z.string().optional(),
  sentence_summary: z.string().optional(),
})

export type JudgmentFormValues = z.infer<typeof judgmentFormSchema>

interface FieldConfidenceIndicatorProps {
  score?: number
  pattern?: string | null
}

function FieldConfidenceIndicator({ score, pattern }: FieldConfidenceIndicatorProps) {
  if (score === undefined) return null

  const getColor = () => {
    if (score >= 0.9) return 'text-mr-green'
    if (score >= 0.7) return 'text-mr-gold'
    return 'text-mr-red'
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn('flex items-center gap-1 text-xs', getColor())}>
            <Sparkles className="h-3 w-3" />
            {Math.round(score * 100)}%
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            {pattern ? `Pattern: ${pattern}` : 'Auto-extracted'}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

interface JudgmentFormProps {
  initialData: Partial<JudgmentFormValues>
  fieldConfidence?: Record<string, number>
  fieldPatterns?: Record<string, string | null>
  onSubmit: (data: JudgmentFormValues) => void
  onSave?: (data: JudgmentFormValues) => void
  isSubmitting?: boolean
  isSaving?: boolean
  submitLabel?: string
  showConfidence?: boolean
}

export function JudgmentForm({
  initialData,
  fieldConfidence = {},
  fieldPatterns = {},
  onSubmit,
  onSave,
  isSubmitting = false,
  isSaving = false,
  submitLabel,
  showConfidence = true,
}: JudgmentFormProps) {
  const { t } = useTranslation(['judgments', 'dataEntry', 'common', 'errors'])

  const [courts, setCourts] = useState<Awaited<ReturnType<typeof courtsApi.list>> | undefined>(undefined)

  const fetchCourts = useCallback(async () => {
    try {
      const result = await courtsApi.list()
      setCourts(result)
    } catch (err) {
      // courts remain undefined
    }
  }, [])

  useEffect(() => {
    fetchCourts()
  }, [fetchCourts])

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isDirty },
  } = useForm<JudgmentFormValues>({
    resolver: zodResolver(judgmentFormSchema),
    defaultValues: {
      case_number: initialData.case_number || '',
      judgment_number: initialData.judgment_number || '',
      judgment_date: initialData.judgment_date || '',
      extracted_court_text: initialData.extracted_court_text || '',
      court_id: initialData.court_id || undefined,
      judgment_type: initialData.judgment_type || '',
      degree: initialData.degree || '',
      sentence_summary: initialData.sentence_summary || '',
    },
  })

  // Update form when initialData changes
  useEffect(() => {
    reset({
      case_number: initialData.case_number || '',
      judgment_number: initialData.judgment_number || '',
      judgment_date: initialData.judgment_date || '',
      extracted_court_text: initialData.extracted_court_text || '',
      court_id: initialData.court_id || undefined,
      judgment_type: initialData.judgment_type || '',
      degree: initialData.degree || '',
      sentence_summary: initialData.sentence_summary || '',
    })
  }, [initialData, reset])

  const isRequired = (fieldName: any) => REQUIRED_FIELDS.includes(fieldName)

  const renderFieldLabel = (fieldName: string, label: string) => (
    <div className="flex items-center justify-between">
      <Label htmlFor={fieldName} className="flex items-center gap-1">
        {label}
        {isRequired(fieldName) && <span className="text-destructive">*</span>}
      </Label>
      {showConfidence && fieldConfidence[fieldName] !== undefined && (
        <FieldConfidenceIndicator
          score={fieldConfidence[fieldName]}
          pattern={fieldPatterns[fieldName]}
        />
      )}
    </div>
  )

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Tier A - Required Fields */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 rounded-lg bg-primary/5 p-3 text-sm">
          <AlertCircle className="h-4 w-4 text-primary" />
          <span className="font-medium">{t('dataEntry:requiredFields')}</span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Case Number */}
          <div className="space-y-2">
            {renderFieldLabel(JUDGMENT_FIELDS.CASE_NUMBER, t('caseNumber'))}
            <Input
              id="case_number"
              {...register('case_number')}
              placeholder={t('caseNumberPlaceholder')}
              className={cn(errors.case_number && 'border-destructive')}
              dir="ltr"
            />
          </div>

          {/* Judgment Number */}
          <div className="space-y-2">
            {renderFieldLabel(JUDGMENT_FIELDS.JUDGMENT_NUMBER, t('judgmentNumber'))}
            <Input
              id="judgment_number"
              {...register('judgment_number')}
              placeholder={t('judgmentNumberPlaceholder')}
              className={cn(errors.judgment_number && 'border-destructive')}
              dir="ltr"
            />
          </div>

          {/* Judgment Date */}
          <div className="space-y-2">
            {renderFieldLabel(JUDGMENT_FIELDS.JUDGMENT_DATE, t('judgmentDate'))}
            <Input
              id="judgment_date"
              type="date"
              {...register('judgment_date')}
              className={cn(errors.judgment_date && 'border-destructive')}
            />
          </div>

          {/* Extracted Court Text */}
          <div className="space-y-2">
            {renderFieldLabel(JUDGMENT_FIELDS.COURT, t('courtExtracted'))}
            <Input
              id="extracted_court_text"
              {...register('extracted_court_text')}
              placeholder={t('courtPlaceholder')}
              className={cn(errors.extracted_court_text && 'border-destructive')}
            />
          </div>
        </div>

        {/* Court Selection */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="court_id">{t('court')}</Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">{t('dataEntry:courtSelectionHelp')}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Controller
            name="court_id"
            control={control}
            render={({ field }) => (
              <Select
                value={field.value?.toString() || '_none'}
                onValueChange={(value) =>
                  field.onChange(value ? parseInt(value, 10) : null)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('selectCourt')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">-- {t('selectCourt')} --</SelectItem>
                  {courts?.map((court) => (
                    <SelectItem key={court.id} value={court.id.toString()}>
                      {court.name} ({court.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </div>

      {/* Tier B - Optional Fields */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 rounded-lg bg-muted p-3 text-sm">
          <Info className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{t('dataEntry:optionalFields')}</span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Judgment Type */}
          {/* <div className="space-y-2">
            {renderFieldLabel(JUDGMENT_FIELDS.JUDGMENT_TYPE, t('judgmentType'))}
            <Input
              id="judgment_type"
              {...register('judgment_type')}
              placeholder={t('judgmentTypePlaceholder')}
            />
          </div> */}

          {/* Degree */}
          {/* <div className="space-y-2">
            {renderFieldLabel(JUDGMENT_FIELDS.DEGREE, t('degree'))}
            <Input
              id="degree"
              {...register('degree')}
              placeholder={t('degreePlaceholder')}
            />
          </div> */}
        </div>
        
        <div className="space-y-2">
          {renderFieldLabel(JUDGMENT_FIELDS.DEGREE, t('degree'))}
          <Input
            id="degree"
            {...register('degree')}
            placeholder={t('degreePlaceholder')}
          />
        </div>
        
        {/* Sentence Summary */}
        <div className="space-y-2">
          {renderFieldLabel('sentence_summary', t('sentenceSummary'))}
          <textarea
            id="sentence_summary"
            {...register('sentence_summary')}
            placeholder={t('sentenceSummaryPlaceholder')}
            rows={4}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between border-t pt-4">
        <div className="text-sm text-muted-foreground">
          {isDirty && (
            <span className="flex items-center gap-1 text-mr-gold">
              <AlertCircle className="h-3 w-3" />
              {t('dataEntry:unsavedChanges')}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {onSave && (
            <Button
              type="button"
              variant="outline"
              onClick={handleSubmit(onSave)}
              disabled={isSaving || !isDirty}
            >
              {isSaving ? t('common:loading') : t('common:save')}
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? t('common:loading')
              : submitLabel || t('dataEntry:submitForReview')}
          </Button>
        </div>
      </div>
    </form>
  )
}

export default JudgmentForm
