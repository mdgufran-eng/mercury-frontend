export type ProjectStatus = 'CREATED' | 'ACTIVE' | 'IN_PROGRESS' | 'FINISHED' | 'FAILED'
export type TranslationMethod = 'MACHINE' | 'HUMAN'
export type MatchType = 'ICE' | 'MT'
export type JobStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED'
export type CallbackEvent = 'job-finished' | 'project-completion' | 'project-created'

export interface Customer {
  id: string
  name: string
  email: string
  company: string
  createdAt: string
}

export interface Template {
  id: string
  name: string
  sourceLang: string
  targetLang: string
  method: TranslationMethod
  description: string
  createdAt: string
}

export interface Freelancer {
  id: string
  name: string
  email: string
  langs: string[]
  status: 'AVAILABLE' | 'BUSY' | 'OFFLINE'
  completedJobs: number
}

export interface Project {
  id: string
  name: string
  customerId: string
  customerName: string
  sourceLang: string
  targetLang: string
  status: ProjectStatus
  method: TranslationMethod
  templateId: string
  templateName: string
  createdAt: string
  updatedAt: string
  jobCount: number
}

export interface Job {
  id: string
  projectId: string
  fileName: string
  sourceLang: string
  targetLang: string
  status: JobStatus
  method: TranslationMethod
  wordCount: number
  segmentCount: number
  createdAt: string
  completedAt?: string
}

export interface Segment {
  id: string
  jobId: string
  no: number
  source: string
  target: string
  matchType: MatchType
  status: 'TRANSLATED' | 'CONFIRMED' | 'REVIEW'
}

export interface Callback {
  id: string
  event: CallbackEvent
  projectId: string
  projectName: string
  jobId?: string
  jobFileName?: string
  payload: Record<string, unknown>
  sentAt: string
  statusCode: number
  success: boolean
}

export interface TMEntry {
  id: string
  sourceLang: string
  targetLang: string
  sourceText: string
  targetText: string
  matchScore: number
  usageCount: number
  createdAt: string
}
