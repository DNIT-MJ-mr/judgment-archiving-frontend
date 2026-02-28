import { ExtractionStatus, BatchStatus, UserRole } from './constants'

// User types
export interface User {
  id: number
  username: string
  full_name: string | null
  role: UserRole
  is_active: boolean
  court_id: number | null
  created_at: string
  updated_at: string
}

export interface UserWithCourt extends User {
  court_name?: string
  court_code?: string
}

export interface UserExtended extends User {
  court: {
    id: number
    name: string
    code: string
  } | null
  permissions: {
    can_upload: boolean
    can_validate: boolean
    can_manage_users: boolean
    can_manage_courts: boolean
    can_view_all_courts: boolean
    can_delete_judgments: boolean
  }
}

// Auth types
export interface LoginCredentials {
  username: string
  password: string
}

export interface AuthToken {
  access_token: string
  token_type: string
}

// Court types
export interface Court {
  id: number
  name: string
  code: string
  aliases: string[]
}

export interface CourtWithStats extends Court {
  total_judgments: number
  verified_judgments: number
  pending_judgments: number
  total_users: number
}

// Judgment types
export interface Judgment {
  id: number
  case_number: string | null
  judgment_number: string | null
  judgment_date: string | null
  judgment_year: number | null
  extracted_court_text: string | null
  court_id: number | null
  judgment_type: string | null
  degree: string | null
  sentence_summary: string | null
  source_file_path: string | null
  source_original_name: string | null
  source_type: string | null
  extraction_status: ExtractionStatus
  confidence_score: number
  field_confidence: Record<string, number>
  field_patterns: Record<string, string | null>
  created_by: number | null
  verified_by: number | null
  duplicate_of_id: number | null
  created_at: string
  updated_at: string
}

export interface JudgmentCreate {
  case_number?: string
  judgment_number?: string
  judgment_date?: string
  extracted_court_text?: string
  court_id?: number
  judgment_type?: string
  degree?: string
  sentence_summary?: string
}

export interface JudgmentUpdate extends Partial<JudgmentCreate> {
  extraction_status?: ExtractionStatus
}

// Template types
export interface TemplateCategory {
  id: number
  name: string
  description: string | null
}

export interface Template {
  id: number
  title: string
  page_count: number
  category_id: number | null
  created_at: string
  created_by: number | null
}

// Batch types
export interface BatchFile {
  id: number
  original_filename: string
  file_path: string
  status: 'pending' | 'processing' | 'done' | 'failed' | 'skipped'
  error_message: string | null
  judgment_id: number | null
  created_at: string
}

export interface Batch {
  id: number
  name: string
  status: BatchStatus
  total_files: number
  processed_files: number
  is_processing: boolean
  created_by: number | null
  created_at: string
  updated_at: string
  last_processed_at: string | null
  files: BatchFile[]
}

export interface BatchDetail extends Batch {
  statistics: {
    pending: number
    processing: number
    done: number
    failed: number
    skipped: number
  }
}

// Queue item types
export interface DataEntryQueueItem {
  id: number
  case_number: string | null
  judgment_number: string | null
  judgment_date: string | null
  extracted_court_text: string | null
  court_id: number | null
  judgment_type: string | null
  degree: string | null
  extraction_status: ExtractionStatus
  confidence_score: number
  source_original_name: string | null
  created_at: string
  created_by: number | null
}

export interface ValidationQueueItem {
  id: number
  case_number: string | null
  judgment_number: string | null
  court: string | null
  judgment_date: string | null
  confidence_score: number
  has_duplicate: boolean
  source_original_name: string | null
  created_at: string
}

// API response types
export interface PaginatedResponse<T> {
  total: number
  page: number
  page_size: number
  total_pages: number
  items: T[]
}

export interface DashboardStats {
  total_judgments: number
  auto: number
  needs_review: number
  verified: number
  failed: number
  pending_validation: number
  total_batches: number
  recent_batches: {
    id: number
    name: string
    status: BatchStatus
    processed_files: number
    total_files: number
    created_at: string
  }[]
  extraction_accuracy: number
}

// Form types
export interface ChangePasswordForm {
  current_password: string
  new_password: string
  confirm_password: string
}

export interface UserCreateForm {
  username: string
  password: string
  full_name?: string
  role: UserRole
  court_id?: number
}

export interface UserUpdateForm {
  full_name?: string
  role?: UserRole
  is_active?: boolean
  court_id?: number
}
