import { useParams, useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Download, Printer, Edit2, ArrowRight } from 'lucide-react'
import { useEffect, useState, useCallback } from 'react'
import { templatesApi, apiClient } from '@/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { Badge } from '@/components/ui/badge'
import { usePermissions } from '@/hooks/usePermissions'
import { useLanguage } from '@/contexts/LanguageContext'

export function TemplateDetailPage() {
  const { t } = useTranslation(['common'])
  const { templateId } = useParams<{ templateId: string }>()
  const navigate = useNavigate()
  const { canManageTemplates } = usePermissions()
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null)
  const [pdfLoading, setPdfLoading] = useState(false)
  const { language } = useLanguage()

  const [template, setTemplate] = useState<Awaited<ReturnType<typeof templatesApi.get>> | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const [categories, setCategories] = useState<Awaited<ReturnType<typeof templatesApi.listCategories>>>([])

  const fetchTemplate = useCallback(async () => {
    if (!templateId) return
    setIsLoading(true)
    setError(null)
    try {
      const result = await templatesApi.get(parseInt(templateId, 10))
      setTemplate(result)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'))
    } finally {
      setIsLoading(false)
    }
  }, [templateId])

  useEffect(() => {
    fetchTemplate()
  }, [fetchTemplate])

  const fetchCategories = useCallback(async () => {
    try {
      const result = await templatesApi.listCategories()
      setCategories(result)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'))
    }
  }, [])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  // Fetch PDF blob when template is loaded
  useEffect(() => {
    if (template?.id) {
      setPdfLoading(true)
      apiClient
        .get(`/templates/${template.id}/file`, { responseType: 'blob' })
        .then((response) => {
          const blob = new Blob([response.data], { type: 'application/pdf' })
          const url = URL.createObjectURL(blob)
          setPdfBlobUrl(url)
        })
        .catch(() => {
          setPdfBlobUrl(null)
        })
        .finally(() => {
          setPdfLoading(false)
        })

      // Cleanup on unmount
      return () => {
        if (pdfBlobUrl) {
          URL.revokeObjectURL(pdfBlobUrl)
        }
      }
    }
  }, [template?.id])

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner />
      </div>
    )
  }

  if (error || !template) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{t('common:error')}: {t('common:templateNotFound')}</p>
        <Button onClick={() => navigate('/templates')} className="mt-4">
          {t('common:backToTemplates')}
        </Button>
      </div>
    )
  }

  const category = categories.find((c) => c.id === template.category_id)

  const handleDownload = () => {
    if (pdfBlobUrl) {
      const link = document.createElement('a')
      link.href = pdfBlobUrl
      link.download = `${template.title}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const handlePrint = () => {
    if (pdfBlobUrl) {
      const iframe = document.createElement('iframe')
      iframe.style.display = 'none'
      iframe.src = pdfBlobUrl
      document.body.appendChild(iframe)
      iframe.onload = () => {
        iframe.focus()
        iframe.contentWindow?.print()
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/templates')}
          className="rtl:text-right ltr:text-left"
        >
          {language === 'ar' ? <ArrowRight className="h-4 w-4 rtl:ml-2 ltr:mr-2" /> : <ArrowLeft className="h-4 w-4 rtl:ml-2 ltr:mr-2" />}
          {t('common:back')}
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* PDF Preview */}
        <div className="col-span-2">
          <Card>
            <CardContent className="pt-6">
              <div className="bg-gray-100 rounded-lg overflow-hidden" style={{ height: '600px' }}>
                {pdfLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <LoadingSpinner />
                  </div>
                ) : pdfBlobUrl ? (
                  <iframe
                    src={pdfBlobUrl}
                    title={template.title}
                    className="w-full h-full"
                    style={{ border: 'none' }}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    {t('common:failedToLoadPDF')}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Metadata Panel */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg rtl:text-right ltr:text-left">
                {template.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Pages */}
              <div>
                <p className="text-sm text-gray-600 rtl:text-right ltr:text-left">
                  {t('common:pages')}
                </p>
                <p className="text-lg font-semibold rtl:text-right ltr:text-left">
                  {template.page_count}
                </p>
              </div>

              {/* Category */}
              {category && (
                <div>
                  <p className="text-sm text-gray-600 rtl:text-right ltr:text-left">
                    {t('common:category')}
                  </p>
                  <Badge variant="secondary" className="mt-1 rtl:text-right ltr:text-left">
                    {category.name}
                  </Badge>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-2 pt-4 border-t">
                <Link to={`/templates/${template.id}/fill`} className="block">
                  <Button className="w-full rtl:text-right ltr:text-left">
                    {t('common:fillTemplate')}
                  </Button>
                </Link>

                <Button
                  variant="outline"
                  className="w-full rtl:text-right ltr:text-left"
                  onClick={handleDownload}
                >
                  <Download className="h-4 w-4 rtl:ml-2 ltr:mr-2" />
                  {t('common:download')}
                </Button>

                <Button
                  variant="outline"
                  className="w-full rtl:text-right ltr:text-left"
                  onClick={handlePrint}
                >
                  <Printer className="h-4 w-4 rtl:ml-2 ltr:mr-2" />
                  {t('common:print')}
                </Button>

                {canManageTemplates && (
                  <Link to={`/admin/templates?edit=${template.id}`} className="block">
                    <Button variant="outline" className="w-full rtl:text-right ltr:text-left">
                      <Edit2 className="h-4 w-4 rtl:ml-2 ltr:mr-2" />
                      {t('common:edit')}
                    </Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
