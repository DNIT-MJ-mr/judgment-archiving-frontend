import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { templatesApi } from '@/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { TemplateCard } from '@/components/templates/TemplateCard'

export function TemplatesPage() {
  const { t } = useTranslation(['common'])
  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState<number | null>(null)
  const [page, setPage] = useState(1)
  const pageSize = 20

  // Fetch categories
  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['templateCategories'],
    queryFn: () => templatesApi.listCategories(),
  })

  // Fetch templates
  const { data: templatesData, isLoading: templatesLoading } = useQuery({
    queryKey: ['templates', page, search, categoryId],
    queryFn: () => templatesApi.list(page, pageSize, search || undefined, categoryId || undefined),
  })

  const isLoading = categoriesLoading || templatesLoading
  const templates = templatesData?.data || []
  const pagination = templatesData?.pagination || { page: 1, total: 0, total_pages: 1 }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">{t('templates')}</h1>
        <p className="text-gray-500 rtl:text-right ltr:text-left mt-2">
          {t('common:browseAndManageTemplates')}
        </p>
      </div>

      {/* Category Filter */}
      {!categoriesLoading && categories.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-2">
              <Button
                variant={categoryId === null ? 'default' : 'outline'}
                onClick={() => {
                  setCategoryId(null)
                  setPage(1)
                }}
                className="rtl:font-arabic"
              >
                {t('common:all')}
              </Button>
              {categories.map((cat) => (
                <Button
                  key={cat.id}
                  variant={categoryId === cat.id ? 'default' : 'outline'}
                  onClick={() => {
                    setCategoryId(cat.id)
                    setPage(1)
                  }}
                  className="rtl:font-arabic"
                >
                  {cat.name}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute rtl:right-3 ltr:left-3 top-3 text-gray-400 h-5 w-5" />
        <Input
          placeholder={t('common:search')}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
          className="rtl:pr-10 ltr:pl-10"
        />
      </div>

      {/* Templates Grid */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : templates.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template) => (
              <TemplateCard key={template.id} template={template} categories={categories} />
            ))}
          </div>

          {/* Pagination */}
          {pagination.total_pages > 1 && (
            <div className="flex justify-between items-center mt-6">
              <div className="text-sm text-gray-600 rtl:text-right ltr:text-left">
                {t('common:page')} {pagination.page} {t('common:of')} {pagination.total_pages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  size="sm"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setPage(Math.min(pagination.total_pages, page + 1))}
                  disabled={page === pagination.total_pages}
                  size="sm"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      ) : (
        <Card>
          <CardContent className="pt-6 text-center text-gray-500">
            {t('common:noTemplatesFound')}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
