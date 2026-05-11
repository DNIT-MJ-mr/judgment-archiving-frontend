import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { Loader2, ArrowLeft, Upload, FolderPlus, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import { batchesApi } from '@/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { FileDropzone } from '@/components/batches/FileDropzone'
import { useLanguage } from '@/contexts/LanguageContext'

type Step = 'create' | 'upload' | 'complete'

export function NewBatchPage() {
  const { t } = useTranslation(['batches', 'common', 'errors'])
  const navigate = useNavigate()

  // State
  const [step, setStep] = useState<Step>('create')
  const [batchName, setBatchName] = useState('')
  const [batchId, setBatchId] = useState<number | null>(null)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [uploadProgress, setUploadProgress] = useState(0)
  const { language } = useLanguage()

  // Mutations
  const createBatchMutation = useMutation({
    mutationFn: (name: string) => batchesApi.create(name),
    onSuccess: (batch) => {
      setBatchId(batch.id)
      setStep('upload')
      toast.success(t('batchCreated'))
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || t('errors:generic'))
    },
  })

  const uploadFilesMutation = useMutation({
    mutationFn: ({ batchId, files }: { batchId: number; files: File[] }) =>
      batchesApi.uploadFiles(batchId, files, setUploadProgress),
    onSuccess: () => {
      toast.success(t('filesUploaded'))
      setStep('complete')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || t('errors:fileUploadFailed'))
    },
  })

  // Handlers
  const handleCreateBatch = () => {
    if (!batchName.trim()) {
      toast.error(t('errors:requiredFieldMissing'))
      return
    }
    createBatchMutation.mutate(batchName.trim())
  }

  const handleUploadFiles = () => {
    if (!batchId || selectedFiles.length === 0) return
    uploadFilesMutation.mutate({ batchId, files: selectedFiles })
  }

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleGoToBatch = () => {
    if (batchId) {
      navigate(`/batches/${batchId}`)
    }
  }

  const handleStartProcessing = async () => {
    if (!batchId) return
    try {
      await batchesApi.process(batchId)
      toast.success(t('processingStarted'))
      navigate(`/batches/${batchId}`)
    } catch (error: any) {
      toast.error(error.response?.data?.detail || t('errors:generic'))
    }
  }

  const isCreating = createBatchMutation.isPending
  const isUploading = uploadFilesMutation.isPending

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/batches')}
        >
          {language === 'ar' ? <ArrowRight className="h-5 w-5" /> : <ArrowLeft className="h-5 w-5" />}
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{t('createBatch')}</h1>
          <p className="text-muted-foreground">
            {step === 'create' && t('batchName')}
            {step === 'upload' && t('uploadFiles')}
            {step === 'complete' && t('filesUploaded')}
          </p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-2">
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
            step === 'create'
              ? 'bg-primary text-primary-foreground'
              : 'bg-primary/20 text-primary'
          }`}
        >
          1
        </div>
        <div className={`h-1 flex-1 rounded ${step !== 'create' ? 'bg-primary' : 'bg-gray-200'}`} />
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
            step === 'upload'
              ? 'bg-primary text-primary-foreground'
              : step === 'complete'
              ? 'bg-primary/20 text-primary'
              : 'bg-gray-200 text-gray-500'
          }`}
        >
          2
        </div>
        <div className={`h-1 flex-1 rounded ${step === 'complete' ? 'bg-primary' : 'bg-gray-200'}`} />
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
            step === 'complete'
              ? 'bg-primary text-primary-foreground'
              : 'bg-gray-200 text-gray-500'
          }`}
        >
          3
        </div>
      </div>

      {/* Step 1: Create Batch */}
      {step === 'create' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderPlus className="h-5 w-5" />
              {t('createBatch')}
            </CardTitle>
            <CardDescription>
              {t('common:name')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="batchName">{t('batchName')}</Label>
              <Input
                id="batchName"
                value={batchName}
                onChange={(e) => setBatchName(e.target.value)}
                placeholder={t('batchName')}
                disabled={isCreating}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateBatch()
                }}
              />
            </div>

            <Button
              onClick={handleCreateBatch}
              disabled={!batchName.trim() || isCreating}
              className="w-full"
            >
              {isCreating ? (
                <>
                  <Loader2 className="me-2 h-4 w-4 animate-spin" />
                  {t('common:loading')}
                </>
              ) : (
                <>
                  {t('common:next')}
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Upload Files */}
      {step === 'upload' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              {t('uploadFiles')}
            </CardTitle>
            <CardDescription>
              {t('dragDropFiles')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FileDropzone
              onFilesSelected={setSelectedFiles}
              selectedFiles={selectedFiles}
              onRemoveFile={handleRemoveFile}
              disabled={isUploading}
            />

            {isUploading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>{t('common:loading')}</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} />
              </div>
            )}

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => handleGoToBatch()}
                disabled={isUploading}
              >
                {t('common:cancel')}
              </Button>
              <Button
                onClick={handleUploadFiles}
                disabled={selectedFiles.length === 0 || isUploading}
                className="flex-1"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="me-2 h-4 w-4 animate-spin" />
                    {uploadProgress}%
                  </>
                ) : (
                  <>
                    <Upload className="me-2 h-4 w-4" />
                    {t('uploadFiles')} ({selectedFiles.length})
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Complete */}
      {step === 'complete' && (
        <Card>
          <CardContent className="flex flex-col items-center py-12">
            <div className="rounded-full bg-primary/10 p-4 text-primary">
              <Upload className="h-12 w-12" />
            </div>
            <h3 className="mt-4 text-xl font-semibold">{t('filesUploaded')}</h3>
            <p className="mt-2 text-center text-muted-foreground">
              {selectedFiles.length} {t('common:items')}
            </p>

            <div className="mt-8 flex gap-3">
              <Button variant="outline" onClick={handleGoToBatch}>
                {t('common:details')}
              </Button>
              <Button onClick={handleStartProcessing}>
                {t('startProcessing')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default NewBatchPage
