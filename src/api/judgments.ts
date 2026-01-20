import apiClient from './client'
import { Judgment, JudgmentCreate, JudgmentUpdate, PaginatedResponse } from '@/lib/types'

export interface JudgmentSearchParams {
  case_number?: string
  judgment_number?: string
  court_id?: number
  court?: string
  judgment_type?: string
  degree?: string
  date_from?: string
  date_to?: string
  extraction_status?: string
  page?: number
  page_size?: number
}

export const judgmentsApi = {
  search: async (params?: JudgmentSearchParams): Promise<PaginatedResponse<Judgment>> => {
    const response = await apiClient.get<PaginatedResponse<Judgment>>('/judgments/', { params })
    return response.data
  },

  get: async (judgmentId: number): Promise<Judgment> => {
    const response = await apiClient.get<Judgment>(`/judgments/${judgmentId}`)
    return response.data
  },

  create: async (data: JudgmentCreate): Promise<Judgment> => {
    const response = await apiClient.post<Judgment>('/judgments/', data)
    return response.data
  },

  update: async (judgmentId: number, data: JudgmentUpdate): Promise<Judgment> => {
    const response = await apiClient.put<Judgment>(`/judgments/${judgmentId}`, data)
    return response.data
  },

  delete: async (judgmentId: number): Promise<void> => {
    await apiClient.delete(`/judgments/${judgmentId}`)
  },

  listVerified: async (params?: {
    court_id?: number
    page?: number
    page_size?: number
  }): Promise<PaginatedResponse<Judgment>> => {
    const response = await apiClient.get<PaginatedResponse<Judgment>>('/judgments/verified', { params })
    return response.data
  },

  reprocess: async (judgmentId: number): Promise<void> => {
    await apiClient.post(`/judgments/${judgmentId}/reprocess`)
  },

  getStats: async (): Promise<{
    total: number
    by_status: Record<string, number>
    verified: number
    pending: number
    failed: number
  }> => {
    const response = await apiClient.get('/judgments/stats/overview')
    return response.data
  },
}

export default judgmentsApi
