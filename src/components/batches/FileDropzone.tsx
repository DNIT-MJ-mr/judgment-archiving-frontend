import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDropzone, FileRejection } from 'react-dropzone'
import {
  Upload,
  File,
  FileText,
  X,
  AlertCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ACCEPTED_FILE_TYPES, MAX_FILE_SIZE } from '@/lib/constants'
import { Button } from '@/components/ui/button'

interface FileDropzoneProps {
  onFilesSelected: (files: File[]) => void
  selectedFiles: File[]
  onRemoveFile: (index: number) => void
  disabled?: boolean
  maxFiles?: number
}

export function FileDropzone({
  onFilesSelected,
  selectedFiles,
  onRemoveFile,
  disabled = false,
  maxFiles = 100,
}: FileDropzoneProps) {
  const { t } = useTranslation(['batches', 'common', 'errors'])
  const [rejectedFiles, setRejectedFiles] = useState<FileRejection[]>([])

  const onDrop = useCallback(
    (acceptedFiles: File[], fileRejections: FileRejection[]) => {
      // Filter to only new files (avoid duplicates)
      const existingNames = new Set(selectedFiles.map((f) => f.name))
      const newFiles = acceptedFiles.filter((f) => !existingNames.has(f.name))

      if (newFiles.length > 0) {
        onFilesSelected([...selectedFiles, ...newFiles])
      }

      setRejectedFiles(fileRejections)
    },
    [selectedFiles, onFilesSelected]
  )

  const { getRootProps, getInputProps, isDragActive, isDragReject } =
    useDropzone({
      onDrop,
      accept: ACCEPTED_FILE_TYPES,
      maxSize: MAX_FILE_SIZE,
      maxFiles: maxFiles - selectedFiles.length,
      disabled,
    })

  const getFileIcon = (filename: string) => {
    const ext = filename.toLowerCase().split('.').pop()
    if (ext === 'pdf') {
      return <FileText className="h-5 w-5 text-red-500" />
    }
    return <File className="h-5 w-5 text-blue-500" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={cn(
          'relative cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors',
          isDragActive && !isDragReject && 'border-primary bg-primary/5',
          isDragReject && 'border-destructive bg-destructive/5',
          !isDragActive && !disabled && 'border-gray-300 hover:border-primary/50 hover:bg-gray-50',
          disabled && 'cursor-not-allowed opacity-50'
        )}
      >
        <input {...getInputProps()} />
        
        <div className="flex flex-col items-center gap-3">
          <div
            className={cn(
              'rounded-full p-4',
              isDragActive && !isDragReject && 'bg-primary/10 text-primary',
              isDragReject && 'bg-destructive/10 text-destructive',
              !isDragActive && 'bg-gray-100 text-gray-500'
            )}
          >
            <Upload className="h-8 w-8" />
          </div>
          
          <div>
            <p className="text-lg font-medium">
              {isDragActive
                ? isDragReject
                  ? t('errors:invalidFileType')
                  : t('dragDropFiles')
                : t('dragDropFiles')}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {t('orClickToBrowse')}
            </p>
          </div>
          
          <p className="text-xs text-muted-foreground">
            {t('supportedFormats')}
          </p>
        </div>
      </div>

      {/* Rejected Files Warning */}
      {rejectedFiles.length > 0 && (
        <div className="rounded-lg bg-destructive/10 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <div>
              <p className="font-medium text-destructive">
                {t('errors:fileUploadFailed')}
              </p>
              <ul className="mt-2 space-y-1 text-sm text-destructive/80">
                {rejectedFiles.map((rejection, index) => (
                  <li key={index}>
                    {rejection.file.name}:{' '}
                    {rejection.errors.map((e) => e.message).join(', ')}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Selected Files List */}
      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">
              {t('common:total')}: {selectedFiles.length} {t('common:items')}
            </h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onFilesSelected([])}
              disabled={disabled}
              className="text-destructive hover:text-destructive"
            >
              {t('common:clear')}
            </Button>
          </div>

          <div className="max-h-64 space-y-2 overflow-y-auto rounded-lg border p-2">
            {selectedFiles.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="flex items-center justify-between rounded-md bg-gray-50 p-2"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {getFileIcon(file.name)}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onRemoveFile(index)}
                  disabled={disabled}
                  className="h-8 w-8 shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default FileDropzone
