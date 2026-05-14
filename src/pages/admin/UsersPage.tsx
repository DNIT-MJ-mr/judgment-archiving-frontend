import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import {
  Plus,
  Edit,
  Trash2,
  UserCheck,
  UserX,
  RefreshCw,
  Search,
} from 'lucide-react'
import { usersApi, courtsApi } from '@/api'
import { USER_ROLES } from '@/lib/constants'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import { User, UserCreateForm, UserUpdateForm } from '@/lib/types'

export function UsersPage() {
  const { t } = useTranslation(['admin', 'common', 'auth'])
  const [search, setSearch] = useState('')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [deletingUser, setDeletingUser] = useState<User | null>(null)

  // Form state
  const [formData, setFormData] = useState<UserCreateForm>({
    username: '',
    password: '',
    full_name: '',
    role: 'viewer',
    court_id: undefined,
  })

  // Users query state
  const [users, setUsers] = useState<User[] | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchUsers = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await usersApi.list()
      setUsers(result)
    } catch (err) {
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  // Courts query state
  const [courts, setCourts] = useState<Awaited<ReturnType<typeof courtsApi.list>> | null>(null)

  const fetchCourts = useCallback(async () => {
    try {
      const result = await courtsApi.list()
      setCourts(result)
    } catch (err) {
      // ignore
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
      username: '',
      password: '',
      full_name: '',
      role: 'viewer',
      court_id: undefined,
    })
  }

  const handleEdit = (user: User) => {
    setEditingUser(user)
    setFormData({
      username: user.username,
      password: '',
      full_name: user.full_name || '',
      role: user.role,
      court_id: user.court_id || undefined,
    })
  }

  const handleCreate = async () => {
    setIsCreating(true)
    try {
      await usersApi.create(formData)
      toast.success(t('userCreated'))
      await fetchUsers()
      setShowCreateDialog(false)
      resetForm()
    } catch (error: any) {
      toast.error(error.response?.data?.detail || t('common:error'))
    } finally {
      setIsCreating(false)
    }
  }

  const handleUpdate = async () => {
    if (!editingUser) return
    const updateData: UserUpdateForm = {
      full_name: formData.full_name || undefined,
      role: formData.role,
      court_id: formData.court_id,
    }
    setIsUpdating(true)
    try {
      await usersApi.update(editingUser.id, updateData)
      toast.success(t('userUpdated'))
      await fetchUsers()
      setEditingUser(null)
      resetForm()
    } catch (error: any) {
      toast.error(error.response?.data?.detail || t('common:error'))
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await usersApi.delete(id)
      toast.success(t('userDeleted'))
      await fetchUsers()
      setDeletingUser(null)
    } catch (error: any) {
      toast.error(error.response?.data?.detail || t('common:error'))
    }
  }

  const handleEnable = async (id: number) => {
    try {
      await usersApi.enable(id)
      toast.success(t('userEnabled'))
      await fetchUsers()
    } catch (err) {
      // ignore
    }
  }

  const handleDisable = async (id: number) => {
    try {
      await usersApi.disable(id)
      toast.success(t('userDisabled'))
      await fetchUsers()
    } catch (err) {
      // ignore
    }
  }

  // Filter users by search
  const filteredUsers = users?.filter(
    (user) =>
      user.username.toLowerCase().includes(search.toLowerCase()) ||
      user.full_name?.toLowerCase().includes(search.toLowerCase())
  )

  const getCourtName = (courtId: number | null) => {
    if (!courtId) return '-'
    return courts?.find((c) => c.id === courtId)?.name || '-'
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-mr-red/10 text-mr-red'
      case 'validator':
        return 'bg-mr-gold/10 text-mr-gold'
      case 'data_entry':
        return 'bg-mr-green/10 text-mr-green'
      default:
        return 'bg-muted text-muted-foreground'
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
        <div>
          <h1 className="text-2xl font-bold">{t('userManagement')}</h1>
          <p className="text-muted-foreground">{t('userManagementDescription')}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => fetchUsers()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="me-2 h-4 w-4" />
            {t('addUser')}
          </Button>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t('searchUsers')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="ps-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('username')}</TableHead>
                <TableHead>{t('fullName')}</TableHead>
                <TableHead>{t('role')}</TableHead>
                <TableHead>{t('court')}</TableHead>
                <TableHead>{t('status')}</TableHead>
                <TableHead className="text-end">{t('common:actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers?.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.username}</TableCell>
                  <TableCell>{user.full_name || '-'}</TableCell>
                  <TableCell>
                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                      {t(`roles.${user.role}`)}
                    </span>
                  </TableCell>
                  <TableCell>{getCourtName(user.court_id)}</TableCell>
                  <TableCell>
                    {user.is_active ? (
                      <span className="flex items-center gap-1 text-mr-green">
                        <UserCheck className="h-4 w-4" />
                        {t('active')}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <UserX className="h-4 w-4" />
                        {t('inactive')}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(user)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      {user.is_active ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDisable(user.id)}
                        >
                          <UserX className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEnable(user.id)}
                        >
                          <UserCheck className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeletingUser(user)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredUsers?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    {t('noUsersFound')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog
        open={showCreateDialog || !!editingUser}
        onOpenChange={(open) => {
          if (!open) {
            setShowCreateDialog(false)
            setEditingUser(null)
            resetForm()
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingUser ? t('editUser') : t('addUser')}
            </DialogTitle>
            <DialogDescription>
              {editingUser ? t('editUserDescription') : t('addUserDescription')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Username - only for create */}
            {!editingUser && (
              <div className="space-y-2">
                <Label htmlFor="username">{t('username')} *</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, username: e.target.value }))
                  }
                  dir="ltr"
                />
              </div>
            )}

            {/* Password - only for create */}
            {!editingUser && (
              <div className="space-y-2">
                <Label htmlFor="password">{t('auth:password')} *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, password: e.target.value }))
                  }
                  dir="ltr"
                />
              </div>
            )}

            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="full_name">{t('fullName')}</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, full_name: e.target.value }))
                }
              />
            </div>

            {/* Role */}
            <div className="space-y-2">
              <Label>{t('role')} *</Label>
              <Select
                value={formData.role}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, role: value as any }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(USER_ROLES).map((role) => (
                    <SelectItem key={role} value={role}>
                      {t(`roles.${role}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Court */}
            <div className="space-y-2">
              <Label>{t('court')}</Label>
              <Select
                value={formData.court_id?.toString() || ''}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    court_id: value ? parseInt(value, 10) : undefined,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('selectCourt')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">{t('noCourt')}</SelectItem>
                  {courts?.map((court) => (
                    <SelectItem key={court.id} value={court.id.toString()}>
                      {court.name}
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
                setShowCreateDialog(false)
                setEditingUser(null)
                resetForm()
              }}
            >
              {t('common:cancel')}
            </Button>
            <Button
              onClick={editingUser ? handleUpdate : handleCreate}
              disabled={isCreating || isUpdating}
            >
              {editingUser ? t('common:save') : t('common:create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingUser} onOpenChange={() => setDeletingUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteUserConfirm')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('deleteUserWarning', { username: deletingUser?.username })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common:cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingUser && handleDelete(deletingUser.id)}
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

export default UsersPage
