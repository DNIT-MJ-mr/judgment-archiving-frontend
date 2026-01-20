export const EXTRACTION_STATUS = {
  AUTO: 'auto',
  NEEDS_REVIEW: 'needs_review',
  VERIFIED: 'verified',
  FAILED: 'failed',
} as const

export type ExtractionStatus = typeof EXTRACTION_STATUS[keyof typeof EXTRACTION_STATUS]

export const BATCH_STATUS = {
  UPLOADING: 'uploading',
  PROCESSING: 'processing',
  REVIEWING: 'reviewing',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const

export type BatchStatus = typeof BATCH_STATUS[keyof typeof BATCH_STATUS]

export const USER_ROLES = {
  ADMIN: 'admin',
  VALIDATOR: 'validator',
  DATA_ENTRY: 'data_entry',
  VIEWER: 'viewer',
} as const

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES]

export const JUDGMENT_FIELDS = {
  CASE_NUMBER: 'case_number',
  JUDGMENT_NUMBER: 'judgment_number',
  JUDGMENT_DATE: 'judgment_date',
  COURT: 'extracted_court_text',
  COURT_ID: 'court_id',
  JUDGMENT_TYPE: 'judgment_type',
  DEGREE: 'degree',
  SENTENCE_SUMMARY: 'sentence_summary',
} as const

// Required fields for submission (Tier A)
export const REQUIRED_FIELDS = [
  JUDGMENT_FIELDS.CASE_NUMBER,
  JUDGMENT_FIELDS.JUDGMENT_NUMBER,
  JUDGMENT_FIELDS.JUDGMENT_DATE,
  JUDGMENT_FIELDS.COURT,
]

export const FILE_TYPES = {
  DOCX: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  PDF: 'application/pdf',
}

export const ACCEPTED_FILE_TYPES = {
  [FILE_TYPES.DOCX]: ['.docx'],
  [FILE_TYPES.PDF]: ['.pdf'],
}

export const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  LANGUAGE: 'language',
  SIDEBAR_COLLAPSED: 'sidebar_collapsed',
}
