import apiClient from './client'
import { ValidationQueueItem, Judgment, JudgmentUpdate, PaginatedResponse } from '@/lib/types'

export interface ValidationDetail {
  id: number
  fields: {
    case_number: string | null
    judgment_number: string | null
    judgment_date: string | null
    court: string | null
    court_id: number | null
    judgment_type: string | null
    degree: string | null
    sentence_summary: string | null
  }
  confidence: {
    document: number
    per_field: Record<string, number>
    patterns: Record<string, string | null>
  }
  duplicate_of_id: number | null
  source: {
    path: string | null
    original_name: string | null
    type: string | null
  }
  status: string
  timestamps: {
    created_at: string
    updated_at: string
  }
}

export const validationApi = {
  getQueue: async (params?: {
    page?: number
    page_size?: number
  }): Promise<PaginatedResponse<ValidationQueueItem>> => {
    const response = await apiClient.get<PaginatedResponse<ValidationQueueItem>>('/validation/queue', { params })
    return response.data
  },

  getDetail: async (judgmentId: number): Promise<ValidationDetail> => {
    const response = await apiClient.get<ValidationDetail>(`/validation/judgments/${judgmentId}`)
    return response.data
  },

  update: async (judgmentId: number, data: Partial<ValidationDetail['fields']>): Promise<void> => {
    await apiClient.patch(`/validation/judgments/${judgmentId}`, data)
  },

  verify: async (judgmentId: number): Promise<void> => {
    await apiClient.post(`/validation/judgments/${judgmentId}/verify`)
  },

  sendToDataEntry: async (judgmentId: number): Promise<void> => {
    await apiClient.post(`/validation/judgments/${judgmentId}/send-to-data-entry`)
  },

  confirmDuplicate: async (judgmentId: number, primaryJudgmentId: number): Promise<void> => {
    await apiClient.post(`/validation/judgments/${judgmentId}/confirm-duplicate`, null, {
      params: { primary_judgment_id: primaryJudgmentId },
    })
  },

  dismissDuplicate: async (judgmentId: number): Promise<void> => {
    await apiClient.post(`/validation/judgments/${judgmentId}/dismiss-duplicate`)
  },

  getNext: async (): Promise<Judgment> => {
    const response = await apiClient.get<Judgment>('/validation/next')
    return response.data
  },

  approve: async (judgmentId: number, data?: JudgmentUpdate): Promise<Judgment> => {
    const response = await apiClient.post<Judgment>(`/validation/${judgmentId}/approve`, data || {})
    return response.data
  },

  reject: async (judgmentId: number): Promise<void> => {
    await apiClient.post(`/validation/${judgmentId}/reject`)
  },
}

export default validationApi
