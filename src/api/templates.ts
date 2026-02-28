import apiClient, { uploadClient } from './client'
import { Template, TemplateCategory } from '@/lib/types'

export interface TemplateCategoryCreate {
  name: string
  description?: string
}

export interface TemplateCategoryUpdate {
  name?: string
  description?: string
}

export interface TemplateUpdate {
  title?: string
  category_id?: number | null
}

export interface TemplatesListResponse {
  data: Template[]
  pagination: {
    page: number
    page_size: number
    total: number
    total_pages: number
  }
}

export const templatesApi = {
  // Category endpoints
  listCategories: async (): Promise<TemplateCategory[]> => {
    const response = await apiClient.get<TemplateCategory[]>('/templates/categories')
    return response.data
  },

  createCategory: async (data: TemplateCategoryCreate): Promise<TemplateCategory> => {
    const response = await apiClient.post<TemplateCategory>('/templates/categories', data)
    return response.data
  },

  updateCategory: async (categoryId: number, data: TemplateCategoryUpdate): Promise<TemplateCategory> => {
    const response = await apiClient.put<TemplateCategory>(`/templates/categories/${categoryId}`, data)
    return response.data
  },

  deleteCategory: async (categoryId: number): Promise<void> => {
    await apiClient.delete(`/templates/categories/${categoryId}`)
  },

  // Template endpoints
  list: async (
    page: number = 1,
    page_size: number = 20,
    search?: string,
    category_id?: number
  ): Promise<TemplatesListResponse> => {
    const response = await apiClient.get<TemplatesListResponse>('/templates/', {
      params: { page, page_size, search, category_id },
    })
    return response.data
  },

  get: async (templateId: number): Promise<Template> => {
    const response = await apiClient.get<Template>(`/templates/${templateId}`)
    return response.data
  },

  getFileUrl: (templateId: number, inline: boolean = true): string => {
    const endpoint = inline ? 'file' : 'download'
    return `/api/templates/${templateId}/${endpoint}`
  },

  bulkUpload: async (files: File[], categoryId?: number): Promise<any> => {
    const formData = new FormData()
    files.forEach((file) => {
      formData.append('files', file)
    })
    if (categoryId !== undefined) {
      formData.append('category_id', String(categoryId))
    }

    const response = await uploadClient.post('/templates/bulk-upload', formData)
    return response.data
  },

  update: async (templateId: number, data: TemplateUpdate): Promise<Template> => {
    const response = await apiClient.put<Template>(`/templates/${templateId}`, data)
    return response.data
  },

  delete: async (templateId: number): Promise<void> => {
    await apiClient.delete(`/templates/${templateId}`)
  },
}

export default templatesApi
