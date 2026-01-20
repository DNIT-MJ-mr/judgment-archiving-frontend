import apiClient from './client'
import { Court, CourtWithStats } from '@/lib/types'

export interface CourtCreate {
  name: string
  code: string
  aliases?: string[]
}

export interface CourtUpdate {
  name?: string
  code?: string
  aliases?: string[]
}

export const courtsApi = {
  list: async (search?: string): Promise<Court[]> => {
    const response = await apiClient.get<Court[]>('/courts/', {
      params: search ? { search } : undefined,
    })
    return response.data
  },

  listWithStats: async (): Promise<CourtWithStats[]> => {
    const response = await apiClient.get<CourtWithStats[]>('/courts/with-stats')
    return response.data
  },

  get: async (courtId: number): Promise<Court> => {
    const response = await apiClient.get<Court>(`/courts/${courtId}`)
    return response.data
  },

  create: async (data: CourtCreate): Promise<Court> => {
    const response = await apiClient.post<Court>('/courts/', data)
    return response.data
  },

  update: async (courtId: number, data: CourtUpdate): Promise<Court> => {
    const response = await apiClient.put<Court>(`/courts/${courtId}`, data)
    return response.data
  },

  delete: async (courtId: number, force?: boolean): Promise<void> => {
    await apiClient.delete(`/courts/${courtId}`, {
      params: { force },
    })
  },

  addAlias: async (courtId: number, alias: string): Promise<{ aliases: string[] }> => {
    const response = await apiClient.post(`/courts/${courtId}/aliases`, null, {
      params: { alias },
    })
    return response.data
  },

  removeAlias: async (courtId: number, alias: string): Promise<{ aliases: string[] }> => {
    const response = await apiClient.delete(`/courts/${courtId}/aliases`, {
      params: { alias },
    })
    return response.data
  },

  getUsers: async (courtId: number): Promise<{
    court_id: number
    court_name: string
    users: Array<{
      id: number
      username: string
      full_name: string | null
      role: string
      is_active: boolean
    }>
  }> => {
    const response = await apiClient.get(`/courts/${courtId}/users`)
    return response.data
  },
}

export default courtsApi
