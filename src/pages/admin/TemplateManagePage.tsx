import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Edit, Trash2, RefreshCw, Search, Eye, Upload as UploadIcon } from 'lucide-react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { Template } from '@/lib/types'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'

interface TemplateFormData {
  title: string
  category_id?: number
}

export function TemplateManagePage() {
  const { t } = useTranslation(['templates', 'common'])
  const navigate = useNavigate()

  // State
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null)
  const [deletingTemplate, setDeletingTemplate] = useState<Template | null>(null)
  const [uploadFiles, setUploadFiles] = useState<File[]>([])
  const [uploadCategoryId, setUploadCategoryId] = useState<number | undefined>()
  const [formData, setFormData] = useState<TemplateFormData>({
    title: '',
    category_id: undefined,
  })

  // Templates query state
  const [templatesData, setTemplatesData] = useState<Awaited<ReturnType<typeof templatesApi.list>> | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchTemplates = useCallback(async () => {
    setIsLoading(true)
    try {
      let categoryId: number | undefined = undefined
      if (categoryFilter !== 'all' && categoryFilter !== 'no-category') {
        categoryId = Number(categoryFilter)
      }
      const result = await templatesApi.list(page, 20, search, categoryId)
      setTemplatesData(result)
    } catch (err) {
      // ignore
    } finally {
      setIsLoading(false)
    }
  }, [page, search, categoryFilter])

  useEffect(() => {
    fetchTemplates()
  }, [fetchTemplates])

  // Categories query state
  const [categories, setCategories] = useState<Awaited<ReturnType<typeof templatesApi.listCategories>>>([])

  const fetchCategories = useCallback(async () => {
    try {
      const result = await templatesApi.listCategories()
      setCategories(result)
    } catch (err) {
      // ignore
    }
  }, [])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  // Mutation loading states
  const [isUploading, setIsUploading] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  const resetForm = () => {
    setFormData({
      title: '',
      category_id: undefined,
    })
  }

  const handleEdit = (template: Template) => {
    setEditingTemplate(template)
    setFormData({
      title: template.title,
      category_id: template.category_id || undefined,
    })
  }

  const handleUpdate = async () => {
    if (!editingTemplate || !formData.title.trim()) {
      toast.error(t('common:required'))
      return
    }
    setIsUpdating(true)
    try {
      await templatesApi.update(editingTemplate.id, {
        title: formData.title,
        category_id: formData.category_id,
      })
      toast.success(t('templates:templateUpdated'))
      await fetchTemplates()
      setEditingTemplate(null)
      resetForm()
    } catch (error: any) {
      toast.error(error.response?.data?.detail || t('templates:errorUpdatingTemplate'))
    } finally {
      setIsUpdating(false)
    }
  }

  const handleUpload = async () => {
    if (uploadFiles.length === 0) {
      toast.error(t('common:required'))
      return
    }
    setIsUploading(true)
    try {
      await templatesApi.bulkUpload(uploadFiles, uploadCategoryId)
      toast.success(t('templates:templatesUploaded'))
      await fetchTemplates()
      setShowUploadDialog(false)
      setUploadFiles([])
      setUploadCategoryId(undefined)
    } catch (error: any) {
      toast.error(error.response?.data?.detail || t('templates:errorUploadingTemplates'))
    } finally {
      setIsUploading(false)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await templatesApi.delete(id)
      toast.success(t('templates:templateDeleted'))
      await fetchTemplates()
      setDeletingTemplate(null)
    } catch (error: any) {
      toast.error(error.response?.data?.detail || t('templates:errorDeletingTemplate'))
    }
  }

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
        <h1 className="text-2xl font-bold">{t('templates:manageTemplates')}</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => fetchTemplates()}>
            <RefreshCw className="h-4 w-4" />
          </Button>

          <Button onClick={() => setShowUploadDialog(true)}>
            <Plus className="me-2 h-4 w-4" />
            {t('templates:manageCategories')}
          </Button>
          <Button onClick={() => navigate('/admin/templates/categories')}>
            {t('templates:manageCategories')}
          </Button>
        </div>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={t('templates:searchTemplates')}
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value)
                    setPage(1)
                  }}
                  className="ps-10"
                />
              </div>
            </div>

            {/* Category Filter */}
            <Select
              value={String(categoryFilter)}
              onValueChange={(value) => {
                setCategoryFilter(value)
                setPage(1)
              }}
            >
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder={t('templates:filterByCategory')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('templates:filterByCategory')}</SelectItem>
                <SelectItem value="no-category">{t('templates:noCategory')}</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={String(cat.id)}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Templates Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('templates:templateTitle')}</TableHead>
                <TableHead>{t('templates:category')}</TableHead>
                <TableHead>{t('templates:pages')}</TableHead>
                <TableHead className="text-end">{t('common:actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templatesData?.data.map((template) => (
                <TableRow key={template.id}>
                  <TableCell className="font-medium">{template.title}</TableCell>
                  <TableCell>
                    {template.category_id
                      ? categories.find((c) => c.id === template.category_id)?.name ||
                        t('templates:noCategory')
                      : t('templates:noCategory')}
                  </TableCell>
                  <TableCell>{template.page_count}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(`/templates/${template.id}/fill`)}
                        title={t('templates:view')}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(template)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeletingTemplate(template)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {templatesData?.data.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    {t('templates:noTemplatesFound')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('templates:uploadTemplates')}</DialogTitle>
            <DialogDescription>{t('templates:templatesDescription')}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Category Select */}
            <div className="space-y-2">
              <Label htmlFor="upload-category">{t('templates:selectCategory')}</Label>
              <Select
                value={String(uploadCategoryId || 'none')}
                onValueChange={(value) => setUploadCategoryId(value === 'none' ? undefined : Number(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('common:optional')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t('common:optional')}</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={String(cat.id)}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* File Upload */}
            <div className="space-y-2">
              <Label htmlFor="pdf-files">{t('templates:selectPDFFiles')}</Label>
              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                <input
                  id="pdf-files"
                  type="file"
                  multiple
                  accept=".pdf"
                  onChange={(e) => setUploadFiles(Array.from(e.target.files || []))}
                  className="hidden"
                />
                <label htmlFor="pdf-files" className="cursor-pointer block">
                  <UploadIcon className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="font-medium text-sm">{t('templates:dragDropPDFs')}</p>
                  {uploadFiles.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-2">
                      {uploadFiles.length} {t('templates:pages')}
                    </p>
                  )}
                </label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowUploadDialog(false)
                setUploadFiles([])
                setUploadCategoryId(undefined)
              }}
            >
              {t('common:cancel')}
            </Button>
            <Button onClick={handleUpload} disabled={isUploading || uploadFiles.length === 0}>
              {t('common:upload')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog
        open={!!editingTemplate}
        onOpenChange={(open) => {
          if (!open) {
            setEditingTemplate(null)
            resetForm()
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('templates:editTemplate')}</DialogTitle>
            <DialogDescription>{t('templates:templatesDescription')}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Template Title */}
            <div className="space-y-2">
              <Label htmlFor="title">{t('templates:templateTitle')} *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                placeholder={t('templates:templateTitle')}
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category">{t('templates:selectCategory')}</Label>
              <Select
                value={String(formData.category_id || 'none')}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    category_id: value === 'none' ? undefined : Number(value),
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('common:optional')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t('common:optional')}</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={String(cat.id)}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditingTemplate(null)
                resetForm()
              }}
            >
              {t('common:cancel')}
            </Button>
            <Button onClick={handleUpdate} disabled={isUpdating}>
              {t('common:save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deletingTemplate}
        onOpenChange={() => setDeletingTemplate(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('templates:deleteTemplateConfirm')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('templates:deleteTemplateWarning', {
                title: deletingTemplate?.title,
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common:cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingTemplate && handleDelete(deletingTemplate.id)}
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

export default TemplateManagePage
