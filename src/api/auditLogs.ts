import apiClient from './client'

export interface AuditLog {
  id: number
  user_id: number | null
  username: string | null
  action: string
  entity_type: string
  entity_id: number | null
  before: Record<string, any> | null
  after: Record<string, any> | null
  created_at: string
}

export interface AuditLogsResponse {
  total: number
  page: number
  page_size: number
  items: AuditLog[]
}

export interface AuditLogsParams {
  page?: number
  page_size?: number
  action?: string
  entity_type?: string
  entity_id?: number
  user_id?: number
  from_date?: string
  to_date?: string
}

export const auditLogsApi = {
  list: async (params?: AuditLogsParams): Promise<AuditLogsResponse> => {
    // Note: Backend may not have a dedicated audit logs endpoint yet
    // This is a placeholder that can be connected when backend supports it
    const response = await apiClient.get<AuditLogsResponse>('/audit-logs/', { params })
    return response.data
  },

  get: async (logId: number): Promise<AuditLog> => {
    const response = await apiClient.get<AuditLog>(`/audit-logs/${logId}`)
    return response.data
  },
}

export default auditLogsApi
