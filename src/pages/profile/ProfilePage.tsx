import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  User,
  Shield,
  Building2,
  Calendar,
  Edit3,
  Save,
  X,
  Key,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { authApi } from '@/api'
import { formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

const profileSchema = z.object({
  full_name: z.string().max(100).optional(),
})

type ProfileFormValues = z.infer<typeof profileSchema>

export function ProfilePage() {
  const { t } = useTranslation(['profile', 'common', 'users'])
  const { user, refreshUser } = useAuth()
  const [isEditing, setIsEditing] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: user?.full_name || '',
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: ProfileFormValues) => authApi.updateProfile(data),
    onSuccess: () => {
      toast.success(t('profileUpdated'))
      setIsEditing(false)
      refreshUser()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || t('common:error'))
    },
  })

  const handleCancel = () => {
    reset({ full_name: user?.full_name || '' })
    setIsEditing(false)
  }

  const onSubmit = (data: ProfileFormValues) => {
    updateMutation.mutate(data)
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-mr-red/10 text-mr-red'
      case 'validator':
        return 'bg-mr-green/10 text-mr-green'
      case 'data_entry':
        return 'bg-mr-gold/10 text-mr-gold'
      default:
        return 'bg-muted text-muted-foreground'
    }
  }

  if (!user) return null

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">{t('myProfile')}</h1>
        <p className="text-muted-foreground">
          {t('profileDescription')}
        </p>
      </div>

      {/* Profile Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <User className="h-8 w-8 text-primary" />
              </div>
              <div>
                <CardTitle>{user.full_name || user.username}</CardTitle>
                <CardDescription>@{user.username}</CardDescription>
              </div>
            </div>
            {!isEditing && (
              <Button variant="outline" onClick={() => setIsEditing(true)}>
                <Edit3 className="me-2 h-4 w-4" />
                {t('common:edit')}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('fullName')}</label>
                <Input
                  {...register('full_name')}
                  placeholder={t('fullNamePlaceholder')}
                />
                {errors.full_name && (
                  <p className="text-sm text-destructive">{errors.full_name.message}</p>
                )}
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={handleCancel}>
                  <X className="me-2 h-4 w-4" />
                  {t('common:cancel')}
                </Button>
                <Button type="submit" disabled={!isDirty || updateMutation.isPending}>
                  <Save className="me-2 h-4 w-4" />
                  {updateMutation.isPending ? t('common:loading') : t('common:save')}
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              {/* Full Name */}
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">{t('fullName')}</p>
                  <p className="font-medium">{user.full_name || '-'}</p>
                </div>
              </div>

              {/* Role */}
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">{t('users:role')}</p>
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-sm font-medium ${getRoleBadgeColor(user.role)}`}>
                    {t(`users:roles.${user.role}`)}
                  </span>
                </div>
              </div>

              {/* Court */}
              <div className="flex items-center gap-3">
                <Building2 className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">{t('court')}</p>
                  <p className="font-medium">
                    {user.court?.name || t('noCourt')}
                  </p>
                </div>
              </div>

              {/* Member Since */}
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">{t('memberSince')}</p>
                  <p className="font-medium">{formatDate(user.created_at)}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            {t('security')}
          </CardTitle>
          <CardDescription>
            {t('securityDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link to="/profile/password">
            <Button variant="outline" className="w-full sm:w-auto">
              <Key className="me-2 h-4 w-4" />
              {t('changePassword')}
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Permissions Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            {t('permissions')}
          </CardTitle>
          <CardDescription>
            {t('permissionsDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2">
            {user.permissions && Object.entries(user.permissions).map(([key, value]) => (
              <div
                key={key}
                className={`flex items-center gap-2 rounded-lg border p-3 ${value ? 'bg-mr-green/5 border-mr-green/30' : 'bg-muted/50'
                  }`}
              >
                <div className={`h-2 w-2 rounded-full ${value ? 'bg-mr-green' : 'bg-muted-foreground'}`} />
                <span className="text-sm">
                  {t(`permissionLabels.${key}`)}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default ProfilePage
