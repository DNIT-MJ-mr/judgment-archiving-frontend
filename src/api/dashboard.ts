import apiClient from './client'
import { DashboardStats } from '@/lib/types'

export const dashboardApi = {
  getStats: async (): Promise<DashboardStats> => {
    const response = await apiClient.get<DashboardStats>('/dashboard/stats')
    return response.data
  },
}

export default dashboardApi
