import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowLeft,
  FileText,
  Calendar,
  Building2,
  User,
  Clock,
  Download,
  Edit,
  ExternalLink,
  Copy,
  Eye,
} from 'lucide-react'
import { judgmentsApi, courtsApi, filesApi, usersApi } from '@/api'
import { formatDate, formatDateTime } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { StatusBadge } from '@/components/common/StatusBadge'
import { ConfidenceBadge } from '@/components/common/ConfidenceBadge'
import { DocumentPreview } from '@/components/data-entry/DocumentPreview'
import { JudgmentAuditLogs } from '@/components/judgments/JudgmentAuditLogs'

function DetailRow({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: React.ReactNode
  icon?: React.ComponentType<{ className?: string }>
}) {
  return (
    <div className="flex flex-col gap-1 py-3 border-b last:border-b-0">
      <span className="text-sm text-muted-foreground flex items-center gap-2">
        {Icon && <Icon className="h-4 w-4" />}
        {label}
      </span>
      <span className="font-medium">
        {value || <span className="text-muted-foreground italic">-</span>}
      </span>
    </div>
  )
}

export function JudgmentDetailPage() {
  const { t } = useTranslation(['judgments', 'common', 'validation'])
  const { judgmentId } = useParams<{ judgmentId: string }>()
  const navigate = useNavigate()
  const { permissions, user } = useAuth()
  const id = parseInt(judgmentId || '0', 10)
  const [showPreview, setShowPreview] = useState(false)

  // Fetch judgment
  const {
    data: judgment,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['judgment', id],
    queryFn: () => judgmentsApi.get(id),
    enabled: !!id,
  })

  // Fetch courts for name lookup
  const { data: courts } = useQuery({
    queryKey: ['courts'],
    queryFn: () => courtsApi.list(),
  })

  // Fetch users for name lookup
  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.list(),
    staleTime: 5 * 60 * 1000,
  })

  // Handle file download
  const handleDownload = async () => {
    if (!judgment?.id) return
    try {
      const blob = await filesApi.downloadJudgmentFile(judgment.id)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = judgment.source_original_name || `judgment-${judgment.id}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Download failed:', error)
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
        <p className="text-destructive">{t('common:error')}</p>
        <Button onClick={() => navigate('/judgments')} variant="outline">
          <ArrowLeft className="me-2 h-4 w-4" />
          {t('common:back')}
        </Button>
      </div>
    )
  }

  const courtName = courts?.find((c) => c.id === judgment.court_id)?.name
  const creator = users?.find((u) => u.id === judgment.created_by)
  const verifier = users?.find((u) => u.id === judgment.verified_by)

  // Determine edit access
  const canEdit =
    permissions.canAccessDataEntry ||
    permissions.canAccessValidation ||
    user?.role === 'admin'

  // Determine which edit page to use
  const getEditPath = () => {
    if (judgment.extraction_status === 'failed') {
      return `/data-entry/${judgment.id}`
    }
    if (judgment.extraction_status === 'needs_review') {
      return `/validation/${judgment.id}`
    }
    if (permissions.canAccessValidation) {
      return `/validation/${judgment.id}`
    }
    return `/data-entry/${judgment.id}`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/judgments')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold">
                {judgment.case_number || t('noCaseNumber')}
              </h1>
              {(user?.role === 'admin' || (user?.court_id && judgment.court_id === user.court_id)) && (
                <>
                  <StatusBadge status={judgment.extraction_status} type="extraction" />
                  <ConfidenceBadge score={judgment.confidence_score} />
                </>
              )}
            </div>
            {judgment.judgment_number && (
              <p className="mt-1 text-muted-foreground">
                {t('judgmentNumber')}: {judgment.judgment_number}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {judgment.source_file_path && (
            <>
              <Button variant="outline" onClick={() => setShowPreview(true)}>
                <Eye className="me-2 h-4 w-4" />
                {t('common:preview')}
              </Button>
              <Button variant="outline" onClick={handleDownload}>
                <Download className="me-2 h-4 w-4" />
                {t('common:download')}
              </Button>
            </>
          )}
          {canEdit && judgment.extraction_status !== 'verified' && (
            <Button asChild>
              <Link to={getEditPath()}>
                <Edit className="me-2 h-4 w-4" />
                {t('common:edit')}
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Duplicate Warning */}
      {judgment.duplicate_of_id && (
        <Card className="border-mr-red/30 bg-mr-red/5">
          <CardContent className="flex items-center gap-4 py-4">
            <Copy className="h-5 w-5 text-mr-red shrink-0" />
            <div className="flex-1">
              <p className="font-medium text-mr-red">{t('validation:duplicateDetected')}</p>
              <p className="text-sm text-muted-foreground">
                {t('validation:duplicateWarning')}
              </p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link to={`/judgments/${judgment.duplicate_of_id}`}>
                <ExternalLink className="me-2 h-4 w-4" />
                {t('validation:viewOriginal')}
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}


      <div className="grid gap-6 lg:grid-cols-2">
        {/* Core Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {t('coreInformation')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DetailRow
              label={t('caseNumber')}
              value={judgment.case_number}
            />
            <DetailRow
              label={t('judgmentNumber')}
              value={judgment.judgment_number}
            />
            <DetailRow
              label={t('judgmentDate')}
              value={judgment.judgment_date ? formatDate(judgment.judgment_date) : null}
              icon={Calendar}
            />
            <DetailRow
              label={t('court')}
              value={courtName || judgment.extracted_court_text}
              icon={Building2}
            />
            {judgment.extracted_court_text && courtName && (
              <DetailRow
                label={t('courtExtracted')}
                value={judgment.extracted_court_text}
              />
            )}
          </CardContent>
        </Card>

        {/* Classification */}
        <Card>
          <CardHeader>
            <CardTitle>{t('classification')}</CardTitle>
          </CardHeader>
          <CardContent>
            <DetailRow
              label={t('judgmentType')}
              value={judgment.judgment_type}
            />
            <DetailRow
              label={t('degree')}
              value={judgment.degree}
            />
            <DetailRow
              label={t('sentenceSummary')}
              value={judgment.sentence_summary}
            />
          </CardContent>
        </Card>

        {/* Source & Metadata Information */}
        {(user?.role === 'admin' || (user?.court_id && judgment.court_id === user.court_id)) && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>{t('sourceInformation')}</CardTitle>
              </CardHeader>
              <CardContent>
                <DetailRow
                  label={t('sourceFile')}
                  value={judgment.source_original_name}
                />
                <DetailRow
                  label={t('sourceType')}
                  value={judgment.source_type}
                />
                <DetailRow
                  label={t('extractionStatus')}
                  value={<StatusBadge status={judgment.extraction_status} type="extraction" />}
                />
                <DetailRow
                  label={t('confidenceScore')}
                  value={<ConfidenceBadge score={judgment.confidence_score} showLabel />}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('metadata')}</CardTitle>
              </CardHeader>
              <CardContent>
                <DetailRow
                  label={t('common:createdAt')}
                  value={formatDateTime(judgment.created_at)}
                  icon={Clock}
                />
                <DetailRow
                  label={t('common:updatedAt')}
                  value={formatDateTime(judgment.updated_at)}
                />
                <DetailRow
                  label={t('createdBy')}
                  value={creator ? `${creator.full_name || creator.username}` : (judgment.created_by ? `User #${judgment.created_by}` : null)}
                  icon={User}
                />
                <DetailRow
                  label={t('verifiedBy')}
                  value={verifier ? `${verifier.full_name || verifier.username}` : (judgment.verified_by ? `User #${judgment.verified_by}` : null)}
                />
                <DetailRow
                  label={t('recordId')}
                  value={`#${judgment.id}`}
                />
              </CardContent>
            </Card>
          </>
        )}
      </div>


      {/* Audit Logs - Visible to admins and same-court users */}
      {(user?.role === 'admin' || (user?.court_id && judgment.court_id === user.court_id)) && (
        <JudgmentAuditLogs judgmentId={judgment.id} />
      )}

      {/* Document Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-5xl h-[90vh]">
          <DialogHeader>
            <DialogTitle>{t('documentPreview')}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-hidden h-full min-h-0">
            <DocumentPreview
              judgmentId={judgment.id}
              sourceFilePath={judgment.source_file_path}
              sourceOriginalName={judgment.source_original_name}
              sourceType={judgment.source_type}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default JudgmentDetailPage
