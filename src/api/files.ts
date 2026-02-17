import apiClient from './client'
import { API_BASE_URL, STORAGE_KEYS } from '@/lib/constants'

export const filesApi = {
  getDownloadUrl: (path: string): string => {
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)
    return `${API_BASE_URL}/files/download?path=${encodeURIComponent(path)}&token=${token}`
  },

  getJudgmentFileUrl: (judgmentId: number): string => {
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)
    return `${API_BASE_URL}/files/judgment/${judgmentId}?token=${token}`
  },

  getBatchFileUrl: (batchId: number, fileId: number): string => {
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)
    return `${API_BASE_URL}/files/batch/${batchId}/${fileId}?token=${token}`
  },

  // Get file as blob for preview
  downloadJudgmentFile: async (judgmentId: number): Promise<Blob> => {
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)
    console.log('downloadJudgmentFile - token exists:', !!token)

    const response = await apiClient.get(`/files/judgment/${judgmentId}`, {
      responseType: 'blob',
      headers: {
        Authorization: token ? `Bearer ${token}` : undefined,
      },
    })
    console.log('downloadJudgmentFile - response status:', response.status, 'size:', response.data.size)
    return response.data
  },

  downloadFile: async (path: string): Promise<Blob> => {
    const response = await apiClient.get('/files/download', {
      params: { path },
      responseType: 'blob',
    })
    return response.data
  },

  downloadBatchFile: async (batchId: number, fileId: number): Promise<Blob> => {
    const response = await apiClient.get(`/files/batch/${batchId}/${fileId}`, {
      responseType: 'blob',
    })
    return response.data
  },
}

export default filesApi
