import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { FileText } from 'lucide-react'
import { Template, TemplateCategory } from '@/lib/types'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface TemplateCardProps {
  template: Template
  categories: TemplateCategory[]
}

export function TemplateCard({ template, categories }: TemplateCardProps) {
  const { t } = useTranslation(['common'])
  const category = categories.find((c) => c.id === template.category_id)

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Icon and Title */}
          <div className="flex gap-3 items-start">
            <FileText className="h-6 w-6 text-blue-600 mt-1 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold truncate rtl:text-right ltr:text-left">
                {template.title}
              </h3>
              <p className="text-sm text-gray-500 rtl:text-right ltr:text-left">
                {template.page_count} {t('common:pages')}
              </p>
            </div>
          </div>

          {/* Category Badge */}
          {category && (
            <div>
              <Badge variant="secondary" className="rtl:text-right ltr:text-left">
                {category.name}
              </Badge>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Link to={`/templates/${template.id}`} className="flex-1">
              <Button variant="outline" size="sm" className="w-full rtl:text-right ltr:text-left">
                {t('common:view')}
              </Button>
            </Link>
            <Link to={`/templates/${template.id}/fill`} className="flex-1">
              <Button variant="default" size="sm" className="w-full rtl:text-right ltr:text-left">
                {t('common:fill')}
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
