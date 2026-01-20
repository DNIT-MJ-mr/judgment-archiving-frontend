import apiClient from './client'
import { DataEntryQueueItem, Judgment, JudgmentUpdate, PaginatedResponse } from '@/lib/types'

export interface DataEntryDetail {
  id: number
  fields: {
    case_number: string | null
    judgment_number: string | null
    judgment_date: string | null
    judgment_year: number | null
    extracted_court_text: string | null
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
  source: {
    file_path: string | null
    original_name: string | null
    type: string | null
  }
  metadata: {
    extraction_status: string
    duplicate_of_id: number | null
    created_by: number | null
    created_at: string
    updated_at: string
  }
}

export interface DataEntryStats {
  failed: number
  needs_review: number
  total_pending: number
  my_uploads_pending: number
}

export const dataEntryApi = {
  getQueue: async (params?: {
    page?: number
    page_size?: number
    status?: 'failed' | 'needs_review' | 'all'
  }): Promise<PaginatedResponse<DataEntryQueueItem>> => {
    const response = await apiClient.get<PaginatedResponse<DataEntryQueueItem>>('/data-entry/queue', { params })
    return response.data
  },

  getStats: async (): Promise<DataEntryStats> => {
    const response = await apiClient.get<DataEntryStats>('/data-entry/stats')
    return response.data
  },

  getItem: async (judgmentId: number): Promise<DataEntryDetail> => {
    const response = await apiClient.get<DataEntryDetail>(`/data-entry/${judgmentId}`)
    return response.data
  },

  updateItem: async (judgmentId: number, data: Partial<JudgmentUpdate>): Promise<Judgment> => {
    const response = await apiClient.put<Judgment>(`/data-entry/${judgmentId}`, data)
    return response.data
  },

  submitForReview: async (judgmentId: number): Promise<{
    status: string
    judgment_id: number
    has_potential_duplicate: boolean
    duplicate_of_id: number | null
  }> => {
    const response = await apiClient.post(`/data-entry/${judgmentId}/submit-for-review`)
    return response.data
  },

  deleteItem: async (judgmentId: number, reason: string): Promise<void> => {
    await apiClient.delete(`/data-entry/${judgmentId}`, {
      params: { reason },
    })
  },

  getNext: async (): Promise<{
    id: number
    case_number: string | null
    judgment_number: string | null
    source_original_name: string | null
    created_at: string
  }> => {
    const response = await apiClient.get('/data-entry/next')
    return response.data
  },
}

export default dataEntryApi
