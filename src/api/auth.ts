import apiClient from './client'
import { AuthToken, User, UserExtended, ChangePasswordForm } from '@/lib/types'

export const authApi = {
  login: async (username: string, password: string): Promise<AuthToken> => {
    // FastAPI OAuth2 expects form data for token endpoint
    const formData = new URLSearchParams()
    formData.append('username', username)
    formData.append('password', password)

    const response = await apiClient.post<AuthToken>('/auth/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })
    return response.data
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout')
  },

  getMe: async (): Promise<User> => {
    const response = await apiClient.get<User>('/auth/me')
    return response.data
  },

  getMeExtended: async (): Promise<UserExtended> => {
    const response = await apiClient.get<UserExtended>('/auth/me/extended')
    return response.data
  },

  changePassword: async (data: ChangePasswordForm): Promise<void> => {
    await apiClient.post('/auth/change-password', data)
  },

  updateProfile: async (data: { full_name?: string }): Promise<void> => {
    await apiClient.put('/auth/profile', data)
  },
}

export default authApi
