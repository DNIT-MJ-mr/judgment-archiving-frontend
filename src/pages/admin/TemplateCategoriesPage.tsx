import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Plus, Edit, Trash2, RefreshCw, Search, ArrowLeft, ArrowRight } from 'lucide-react'
import { templatesApi } from '@/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { Label } from '@/components/ui/label'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { TemplateCategory } from '@/lib/types'
import { useNavigate } from 'react-router-dom'
import { Textarea } from '@/components/ui/textarea'
import { useLanguage } from '@/contexts/LanguageContext'

interface CategoryFormData {
  name: string
  description?: string
}

export function TemplateCategoriesPage() {
  const { t } = useTranslation(['templates', 'common'])
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingCategory, setEditingCategory] = useState<TemplateCategory | null>(null)
  const [deletingCategory, setDeletingCategory] = useState<TemplateCategory | null>(null)
  const { language } = useLanguage()

  // Form state
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    description: '',
  })

  // Categories query state
  const [categories, setCategories] = useState<TemplateCategory[] | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchCategories = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await templatesApi.listCategories()
      setCategories(result)
    } catch (err) {
      // ignore
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  // Mutation loading states
  const [isCreating, setIsCreating] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
    })
  }

  const handleEdit = (category: TemplateCategory) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      description: category.description || '',
    })
  }

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      toast.error(t('common:required'))
      return
    }
    setIsCreating(true)
    try {
      await templatesApi.createCategory({
        name: formData.name,
        description: formData.description || undefined,
      })
      toast.success(t('templates:categoryCreated'))
      await fetchCategories()
      setShowCreateDialog(false)
      resetForm()
    } catch (error: any) {
      toast.error(error.response?.data?.detail || t('common:error'))
    } finally {
      setIsCreating(false)
    }
  }

  const handleUpdate = async () => {
    if (!editingCategory || !formData.name.trim()) {
      toast.error(t('common:required'))
      return
    }
    setIsUpdating(true)
    try {
      await templatesApi.updateCategory(editingCategory.id, {
        name: formData.name,
        description: formData.description || undefined,
      })
      toast.success(t('templates:categoryUpdated'))
      await fetchCategories()
      setEditingCategory(null)
      resetForm()
    } catch (error: any) {
      toast.error(error.response?.data?.detail || t('common:error'))
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await templatesApi.deleteCategory(id)
      toast.success(t('templates:categoryDeleted'))
      await fetchCategories()
      setDeletingCategory(null)
    } catch (error: any) {
      toast.error(error.response?.data?.detail || t('common:error'))
    }
  }

  // Filter categories by search
  const filteredCategories = categories?.filter((cat) =>
    cat.name.toLowerCase().includes(search.toLowerCase())
  )

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/admin/templates')}
              className="me-2"
            >
              {language === 'ar' ? <ArrowRight className="me-2 h-4 w-4" /> : <ArrowLeft className="me-2 h-4 w-4" />}
            </Button>
            <h1 className="text-2xl font-bold">{t('templates:manageCategories')}</h1>
          </div>
          <p className="text-muted-foreground">{t('templates:categoriesDescription')}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => fetchCategories()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="me-2 h-4 w-4" />
            {t('templates:createNewCategory')}
          </Button>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t('templates:searchTemplates')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="ps-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Categories Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('common:name')}</TableHead>
                <TableHead>{t('templates:description')}</TableHead>
                <TableHead className="text-end">{t('common:actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCategories?.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell className="text-muted-foreground max-w-xs truncate">
                    {category.description || '-'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(category)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeletingCategory(category)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredCategories?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                    {t('templates:noCategoriesFound')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog
        open={showCreateDialog || !!editingCategory}
        onOpenChange={(open) => {
          if (!open) {
            setShowCreateDialog(false)
            setEditingCategory(null)
            resetForm()
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingCategory
                ? t('templates:editCategory')
                : t('templates:createNewCategory')}
            </DialogTitle>
            <DialogDescription>
              {editingCategory
                ? t('templates:categoriesDescription')
                : t('templates:categoriesDescription')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Category Name */}
            <div className="space-y-2">
              <Label htmlFor="name">{t('templates:categoryName')} *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder={t('templates:categoryName')}
              />
            </div>

            {/* Category Description */}
            <div className="space-y-2">
              <Label htmlFor="description">
                {t('templates:description')} ({t('common:optional')})
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder={t('templates:description')}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateDialog(false)
                setEditingCategory(null)
                resetForm()
              }}
            >
              {t('common:cancel')}
            </Button>
            <Button
              onClick={editingCategory ? handleUpdate : handleCreate}
              disabled={isCreating || isUpdating}
            >
              {editingCategory ? t('common:save') : t('common:create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deletingCategory}
        onOpenChange={() => setDeletingCategory(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('templates:deleteCategoryConfirm')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('templates:deleteCategoryWarning', {
                name: deletingCategory?.name,
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common:cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                deletingCategory && handleDelete(deletingCategory.id)
              }
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('common:delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default TemplateCategoriesPage
