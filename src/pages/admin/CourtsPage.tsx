import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import {
  Building2,
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  Search,
  FileText,
  CheckCircle,
  X,
} from 'lucide-react'
import { courtsApi } from '@/api'
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
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { Court } from '@/lib/types'

interface CourtFormData {
  name: string
  code: string
  aliases: string[]
}

export function CourtsPage() {
  const { t } = useTranslation(['admin', 'common'])
  const [search, setSearch] = useState('')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingCourt, setEditingCourt] = useState<Court | null>(null)
  const [deletingCourt, setDeletingCourt] = useState<Court | null>(null)
  const [newAlias, setNewAlias] = useState('')

  // Form state
  const [formData, setFormData] = useState<CourtFormData>({
    name: '',
    code: '',
    aliases: [],
  })

  // Courts query state
  const [courts, setCourts] = useState<Awaited<ReturnType<typeof courtsApi.listWithStats>> | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchCourts = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await courtsApi.listWithStats()
      setCourts(result)
    } catch (err) {
      // ignore
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCourts()
  }, [fetchCourts])

  // Mutation loading states
  const [isCreating, setIsCreating] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      aliases: [],
    })
    setNewAlias('')
  }

  const handleEdit = (court: Court) => {
    setEditingCourt(court)
    setFormData({
      name: court.name,
      code: court.code,
      aliases: court.aliases || [],
    })
  }

  const handleAddAlias = () => {
    if (newAlias.trim() && !formData.aliases.includes(newAlias.trim())) {
      setFormData((prev) => ({
        ...prev,
        aliases: [...prev.aliases, newAlias.trim()],
      }))
      setNewAlias('')
    }
  }

  const handleRemoveAlias = (alias: string) => {
    setFormData((prev) => ({
      ...prev,
      aliases: prev.aliases.filter((a) => a !== alias),
    }))
  }

  const handleCreate = async () => {
    setIsCreating(true)
    try {
      await courtsApi.create(formData)
      toast.success(t('courtCreated'))
      await fetchCourts()
      setShowCreateDialog(false)
      resetForm()
    } catch (error: any) {
      toast.error(error.response?.data?.detail || t('common:error'))
    } finally {
      setIsCreating(false)
    }
  }

  const handleUpdate = async () => {
    if (!editingCourt) return
    setIsUpdating(true)
    try {
      await courtsApi.update(editingCourt.id, formData)
      toast.success(t('courtUpdated'))
      await fetchCourts()
      setEditingCourt(null)
      resetForm()
    } catch (error: any) {
      toast.error(error.response?.data?.detail || t('common:error'))
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await courtsApi.delete(id)
      toast.success(t('courtDeleted'))
      await fetchCourts()
      setDeletingCourt(null)
    } catch (error: any) {
      const detail = error.response?.data?.detail
      if (typeof detail === 'object') {
        toast.error(`${detail.message} (${detail.judgments} judgments, ${detail.users} users)`)
      } else {
        toast.error(detail || t('common:error'))
      }
    }
  }

  // Filter courts by search
  const filteredCourts = courts?.filter(
    (court) =>
      court.name.toLowerCase().includes(search.toLowerCase()) ||
      court.code.toLowerCase().includes(search.toLowerCase())
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
          <h1 className="text-2xl font-bold">{t('courtManagement')}</h1>
          <p className="text-muted-foreground">{t('courtManagementDescription')}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => fetchCourts()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="me-2 h-4 w-4" />
            {t('addCourt')}
          </Button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('totalCourts')}</p>
                <p className="text-2xl font-bold">{courts?.length || 0}</p>
              </div>
              <Building2 className="h-8 w-8 text-primary/20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('totalJudgments')}</p>
                <p className="text-2xl font-bold">
                  {courts?.reduce((sum, c) => sum + (c.total_judgments || 0), 0) || 0}
                </p>
              </div>
              <FileText className="h-8 w-8 text-mr-green/20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('verifiedJudgments')}</p>
                <p className="text-2xl font-bold">
                  {courts?.reduce((sum, c) => sum + (c.verified_judgments || 0), 0) || 0}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-mr-green/20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t('searchCourts')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="ps-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Courts Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('courtName')}</TableHead>
                <TableHead>{t('courtCode')}</TableHead>
                <TableHead>{t('aliases')}</TableHead>
                <TableHead className="text-center">{t('judgments')}</TableHead>
                <TableHead className="text-center">{t('users')}</TableHead>
                <TableHead className="text-end">{t('common:actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCourts?.map((court) => (
                <TableRow key={court.id}>
                  <TableCell className="font-medium">{court.name}</TableCell>
                  <TableCell>
                    <code className="rounded bg-muted px-2 py-1 text-sm">
                      {court.code}
                    </code>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {court.aliases?.slice(0, 2).map((alias) => (
                        <Badge key={alias} variant="secondary" className="text-xs">
                          {alias}
                        </Badge>
                      ))}
                      {(court.aliases?.length || 0) > 2 && (
                        <Badge variant="secondary" className="text-xs">
                          +{court.aliases!.length - 2}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <span>{court.total_judgments || 0}</span>
                      {(court.verified_judgments || 0) > 0 && (
                        <span className="text-xs text-mr-green">
                          ({court.verified_judgments} ✓)
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    {court.total_users || 0}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(court)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeletingCourt(court)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredCourts?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    {t('noCourtsFound')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog
        open={showCreateDialog || !!editingCourt}
        onOpenChange={(open) => {
          if (!open) {
            setShowCreateDialog(false)
            setEditingCourt(null)
            resetForm()
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingCourt ? t('editCourt') : t('addCourt')}
            </DialogTitle>
            <DialogDescription>
              {editingCourt ? t('editCourtDescription') : t('addCourtDescription')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Court Name */}
            <div className="space-y-2">
              <Label htmlFor="name">{t('courtName')} *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder={t('courtNamePlaceholder')}
              />
            </div>

            {/* Court Code */}
            <div className="space-y-2">
              <Label htmlFor="code">{t('courtCode')} *</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))
                }
                placeholder={t('courtCodePlaceholder')}
                dir="ltr"
              />
            </div>

            {/* Aliases */}
            <div className="space-y-2">
              <Label>{t('aliases')}</Label>
              <div className="flex gap-2">
                <Input
                  value={newAlias}
                  onChange={(e) => setNewAlias(e.target.value)}
                  placeholder={t('addAliasPlaceholder')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddAlias()
                    }
                  }}
                />
                <Button type="button" variant="outline" onClick={handleAddAlias}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {formData.aliases.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.aliases.map((alias) => (
                    <Badge
                      key={alias}
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      {alias}
                      <button
                        type="button"
                        onClick={() => handleRemoveAlias(alias)}
                        className="hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground">{t('aliasesHelp')}</p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateDialog(false)
                setEditingCourt(null)
                resetForm()
              }}
            >
              {t('common:cancel')}
            </Button>
            <Button
              onClick={editingCourt ? handleUpdate : handleCreate}
              disabled={isCreating || isUpdating}
            >
              {editingCourt ? t('common:save') : t('common:create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingCourt} onOpenChange={() => setDeletingCourt(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteCourtConfirm')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('deleteCourtWarning', { name: deletingCourt?.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common:cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingCourt && handleDelete(deletingCourt.id)}
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

export default CourtsPage
