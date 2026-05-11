import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Key,
  Eye,
  EyeOff,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react'
import { useState } from 'react'
import { authApi } from '@/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useLanguage } from '@/contexts/LanguageContext'

const passwordSchema = z.object({
  current_password: z.string().min(1, 'Current password is required'),
  new_password: z.string().min(8, 'Password must be at least 8 characters'),
  confirm_password: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.new_password === data.confirm_password, {
  message: "Passwords don't match",
  path: ['confirm_password'],
})

type PasswordFormValues = z.infer<typeof passwordSchema>

export function ChangePasswordPage() {
  const { t } = useTranslation(['profile', 'common', 'errors'])
  const navigate = useNavigate()
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const { language } = useLanguage()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    mode: 'onChange',
  })

  const changeMutation = useMutation({
    mutationFn: (data: PasswordFormValues) => authApi.changePassword(data),
    onSuccess: () => {
      toast.success(t('passwordChanged'))
      reset()
      navigate('/profile')
    },
    onError: (error: any) => {
      const detail = error.response?.data?.detail
      if (detail === 'Current password is incorrect') {
        toast.error(t('currentPasswordIncorrect'))
      } else if (detail === 'New password must be different from current password') {
        toast.error(t('passwordMustBeDifferent'))
      } else {
        toast.error(detail || t('errors:generic'))
      }
    },
  })

  const onSubmit = (data: PasswordFormValues) => {
    changeMutation.mutate(data)
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/profile')}
        >
          {language === 'ar' ? <ArrowRight className="h-5 w-5" /> : <ArrowLeft className="h-5 w-5" />}
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{t('changePassword')}</h1>
          <p className="text-muted-foreground">
            {t('changePasswordDescription')}
          </p>
        </div>
      </div>

      {/* Password Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            {t('newPassword')}
          </CardTitle>
          <CardDescription>
            {t('passwordRequirements')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Current Password */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('currentPassword')}</label>
              <div className="relative">
                <Input
                  type={showCurrent ? 'text' : 'password'}
                  {...register('current_password')}
                  placeholder="••••••••"
                  className="pe-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute end-0 top-0 h-full px-3"
                  onClick={() => setShowCurrent(!showCurrent)}
                >
                  {showCurrent ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              {errors.current_password && (
                <p className="text-sm text-destructive">{errors.current_password.message}</p>
              )}
            </div>

            {/* New Password */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('newPasswordLabel')}</label>
              <div className="relative">
                <Input
                  type={showNew ? 'text' : 'password'}
                  {...register('new_password')}
                  placeholder="••••••••"
                  className="pe-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute end-0 top-0 h-full px-3"
                  onClick={() => setShowNew(!showNew)}
                >
                  {showNew ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              {errors.new_password && (
                <p className="text-sm text-destructive">{errors.new_password.message}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('confirmPassword')}</label>
              <div className="relative">
                <Input
                  type={showConfirm ? 'text' : 'password'}
                  {...register('confirm_password')}
                  placeholder="••••••••"
                  className="pe-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute end-0 top-0 h-full px-3"
                  onClick={() => setShowConfirm(!showConfirm)}
                >
                  {showConfirm ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              {errors.confirm_password && (
                <p className="text-sm text-destructive">{errors.confirm_password.message}</p>
              )}
            </div>

            {/* Submit */}
            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/profile')}
              >
                {t('common:cancel')}
              </Button>
              <Button
                type="submit"
                disabled={!isValid || changeMutation.isPending}
              >
                {changeMutation.isPending ? (
                  t('common:loading')
                ) : (
                  <>
                    <ShieldCheck className="me-2 h-4 w-4" />
                    {t('updatePassword')}
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Security Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">{t('securityTips')}</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
              {t('tipLength')}
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
              {t('tipMix')}
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
              {t('tipUnique')}
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
              {t('tipNoPersonal')}
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}

export default ChangePasswordPage
