import apiClient from './client'
import { User, UserCreateForm, UserUpdateForm } from '@/lib/types'

export const usersApi = {
  list: async (): Promise<User[]> => {
    const response = await apiClient.get<User[]>('/users/')
    return response.data
  },

  get: async (userId: number): Promise<User> => {
    const response = await apiClient.get<User>(`/users/${userId}`)
    return response.data
  },

  create: async (data: UserCreateForm): Promise<User> => {
    const response = await apiClient.post<User>('/users/', data)
    return response.data
  },

  update: async (userId: number, data: UserUpdateForm): Promise<User> => {
    const response = await apiClient.put<User>(`/users/${userId}`, data)
    return response.data
  },

  delete: async (userId: number): Promise<void> => {
    await apiClient.delete(`/users/${userId}`)
  },

  disable: async (userId: number): Promise<User> => {
    const response = await apiClient.post<User>(`/users/${userId}/disable`)
    return response.data
  },

  enable: async (userId: number): Promise<User> => {
    const response = await apiClient.post<User>(`/users/${userId}/enable`)
    return response.data
  },

  resetPassword: async (userId: number, newPassword: string): Promise<void> => {
    await apiClient.post('/auth/reset-password', {
      user_id: userId,
      new_password: newPassword,
    })
  },
}

export default usersApi
