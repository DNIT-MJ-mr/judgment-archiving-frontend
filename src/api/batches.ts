import apiClient, { uploadClient } from './client'
import { Batch, BatchDetail, BatchFile, PaginatedResponse } from '@/lib/types'

export const batchesApi = {
  list: async (params?: {
    status?: string
    page?: number
    page_size?: number
  }): Promise<Batch[]> => {
    const response = await apiClient.get<Batch[]>('/batches/', { params })
    return response.data
  },

  get: async (batchId: number): Promise<Batch> => {
    const response = await apiClient.get<Batch>(`/batches/${batchId}`)
    return response.data
  },

  getDetails: async (batchId: number): Promise<BatchDetail> => {
    const response = await apiClient.get<BatchDetail>(`/batches/${batchId}/details`)
    return response.data
  },

  create: async (name: string): Promise<Batch> => {
    const response = await apiClient.post<Batch>('/batches/', null, {
      params: { name },
    })
    return response.data
  },

  uploadFiles: async (
    batchId: number,
    files: File[],
    onProgress?: (progress: number) => void
  ): Promise<Batch> => {
    const formData = new FormData()
    files.forEach((file) => {
      formData.append('files', file)
    })

    const response = await uploadClient.post<Batch>(
      `/batches/${batchId}/upload`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const progress = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            )
            onProgress(progress)
          }
        },
      }
    )
    return response.data
  },

  process: async (batchId: number): Promise<{ status: string; batch_id: number; pending_files: number }> => {
    const response = await apiClient.post(`/batches/${batchId}/process`)
    return response.data
  },

  cancel: async (batchId: number): Promise<void> => {
    await apiClient.post(`/batches/${batchId}/cancel`)
  },

  reset: async (batchId: number, force?: boolean): Promise<void> => {
    await apiClient.post(`/batches/${batchId}/reset`, null, {
      params: { force },
    })
  },

  delete: async (batchId: number, deleteJudgments?: boolean): Promise<void> => {
    await apiClient.delete(`/batches/${batchId}`, {
      params: { delete_judgments: deleteJudgments },
    })
  },

  getFiles: async (
    batchId: number,
    params?: { status?: string; page?: number; page_size?: number }
  ): Promise<PaginatedResponse<BatchFile>> => {
    const response = await apiClient.get(`/batches/${batchId}/files`, { params })
    return response.data
  },

  getFile: async (batchId: number, fileId: number): Promise<BatchFile & { judgment?: any }> => {
    const response = await apiClient.get(`/batches/${batchId}/files/${fileId}`)
    return response.data
  },

  retryFile: async (batchId: number, fileId: number): Promise<void> => {
    await apiClient.post(`/batches/${batchId}/files/${fileId}/retry`)
  },

  retryAllFailed: async (batchId: number, autoProcess?: boolean): Promise<{ files_reset: number }> => {
    const response = await apiClient.post(`/batches/${batchId}/retry-failed`, null, {
      params: { auto_process: autoProcess },
    })
    return response.data
  },

  deleteFile: async (batchId: number, fileId: number): Promise<void> => {
    await apiClient.delete(`/batches/${batchId}/files/${fileId}`)
  },
}

export default batchesApi
