import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Sparkles } from 'lucide-react'
import { courtsApi } from '@/api'
import { cn, formatDate } from '@/lib/utils'
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

interface ValidationFormProps {
  fields: {
    case_number: string | null
    judgment_number: string | null
    judgment_date: string | null
    court_id: number | null
    court?: string | null  // API returns 'court' from extracted_court_text
    extracted_court_text?: string | null
    judgment_type: string | null
    degree: string | null
    sentence_summary: string | null
  }
  confidence: {
    document?: number
    per_field?: Record<string, number>
    patterns?: Record<string, string | null>
  }
  isEditing: boolean
  onSave: (data: Record<string, any>) => void
  isSaving: boolean
}

function FieldConfidenceIndicator({ score, pattern }: { score?: number; pattern?: string | null }) {
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
          <p>{pattern ? `Pattern: ${pattern}` : 'Auto-extracted'}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

function FieldRow({
  label,
  value,
  confidence,
  pattern,
  children,
  isEditing,
}: {
  label: string
  value: React.ReactNode
  confidence?: number
  pattern?: string | null
  children?: React.ReactNode
  isEditing: boolean
}) {
  return (
    <div className="grid grid-cols-3 gap-4 py-3 border-b last:border-b-0">
      <div className="flex items-center gap-2">
        <Label className="font-medium text-muted-foreground">{label}</Label>
        <FieldConfidenceIndicator score={confidence} pattern={pattern} />
      </div>
      <div className="col-span-2">
        {isEditing ? children : (
          <span className={cn(!value && 'text-muted-foreground italic')}>
            {value || '-'}
          </span>
        )}
      </div>
    </div>
  )
}

export function ValidationForm({
  fields,
  confidence,
  isEditing,
  onSave,
  isSaving,
}: ValidationFormProps) {
  const { t } = useTranslation(['judgments', 'validation', 'common'])

  const [formData, setFormData] = useState({
    case_number: fields.case_number || '',
    judgment_number: fields.judgment_number || '',
    judgment_date: fields.judgment_date || '',
    extracted_court_text: fields.extracted_court_text || fields.court || '',
    court_id: fields.court_id,
    judgment_type: fields.judgment_type || '',
    degree: fields.degree || '',
    sentence_summary: fields.sentence_summary || '',
  })

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

  // Update form when fields change
  useEffect(() => {
    setFormData({
      case_number: fields.case_number || '',
      judgment_number: fields.judgment_number || '',
      judgment_date: fields.judgment_date || '',
      extracted_court_text: fields.extracted_court_text || fields.court || '',
      court_id: fields.court_id,
      judgment_type: fields.judgment_type || '',
      degree: fields.degree || '',
      sentence_summary: fields.sentence_summary || '',
    })
  }, [fields])

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = () => {
    onSave(formData)
  }

  const perField = confidence.per_field || {}
  const patterns = confidence.patterns || {}

  // Find court name
  const courtName = courts?.find(c => c.id === fields.court_id)?.name

  return (
    <div className="space-y-1">
      {/* Case Number */}
      <FieldRow
        label={t('caseNumber')}
        value={fields.case_number}
        confidence={perField.case_number}
        pattern={patterns.case_number}
        isEditing={isEditing}
      >
        <Input
          value={formData.case_number}
          onChange={(e) => handleChange('case_number', e.target.value)}
          dir="ltr"
        />
      </FieldRow>

      {/* Judgment Number */}
      <FieldRow
        label={t('judgmentNumber')}
        value={fields.judgment_number}
        confidence={perField.judgment_number}
        pattern={patterns.judgment_number}
        isEditing={isEditing}
      >
        <Input
          value={formData.judgment_number}
          onChange={(e) => handleChange('judgment_number', e.target.value)}
          dir="ltr"
        />
      </FieldRow>

      {/* Judgment Date */}
      <FieldRow
        label={t('judgmentDate')}
        value={fields.judgment_date ? formatDate(fields.judgment_date) : null}
        confidence={perField.judgment_date}
        pattern={patterns.judgment_date}
        isEditing={isEditing}
      >
        <Input
          type="date"
          value={formData.judgment_date}
          onChange={(e) => handleChange('judgment_date', e.target.value)}
        />
      </FieldRow>

      {/* Court (Extracted Text) */}
      <FieldRow
        label={t('courtExtracted')}
        value={fields.extracted_court_text || fields.court}
        confidence={perField.court}
        pattern={patterns.court}
        isEditing={isEditing}
      >
        <Input
          value={formData.extracted_court_text}
          onChange={(e) => handleChange('extracted_court_text', e.target.value)}
        />
      </FieldRow>

      {/* Court (Selected) */}
      <FieldRow
        label={t('court')}
        value={courtName}
        isEditing={isEditing}
      >
        <Select
          value={formData.court_id?.toString() || '_none'}
          onValueChange={(value) => handleChange('court_id', value ? parseInt(value, 10) : null)}
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
      </FieldRow>

      {/* Judgment Type */}
      <FieldRow
        label={t('judgmentType')}
        value={fields.judgment_type}
        confidence={perField.judgment_type}
        pattern={patterns.judgment_type}
        isEditing={isEditing}
      >
        <Input
          value={formData.judgment_type}
          onChange={(e) => handleChange('judgment_type', e.target.value)}
        />
      </FieldRow>

      {/* Degree */}
      <FieldRow
        label={t('degree')}
        value={fields.degree}
        confidence={perField.degree}
        pattern={patterns.degree}
        isEditing={isEditing}
      >
        <Input
          value={formData.degree}
          onChange={(e) => handleChange('degree', e.target.value)}
        />
      </FieldRow>

      {/* Sentence Summary */}
      <FieldRow
        label={t('sentenceSummary')}
        value={fields.sentence_summary}
        confidence={perField.sentence_summary}
        pattern={patterns.sentence_summary}
        isEditing={isEditing}
      >
        <textarea
          value={formData.sentence_summary}
          onChange={(e) => handleChange('sentence_summary', e.target.value)}
          rows={3}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />
      </FieldRow>

      {/* Overall Confidence */}
      <div className="pt-4 border-t mt-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">
            {t('validation:overallConfidence')}
          </span>
          <div className={cn(
            'text-lg font-bold',
            (confidence.document || 0) >= 0.85 ? 'text-mr-green' :
              (confidence.document || 0) >= 0.7 ? 'text-mr-gold' : 'text-mr-red'
          )}>
            {Math.round((confidence.document || 0) * 100)}%
          </div>
        </div>
      </div>

      {/* Save Button (when editing) */}
      {isEditing && (
        <div className="flex justify-end pt-4">
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? t('common:loading') : t('common:save')}
          </Button>
        </div>
      )}
    </div>
  )
}

export default ValidationForm
