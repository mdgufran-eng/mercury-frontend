import axios from 'axios'
import {
  dummyProjects,
  dummyJobs,
  dummySegments,
  dummyCallbacks,
  dummyCustomers,
  dummyFreelancers,
  dummyTMEntries,
} from '@/data/dummy'
import type { Project, Job, Segment, Callback, Customer, Freelancer, TMEntry } from '@/types'

// Real axios instance (for future use when backend is ready)
export const httpClient = axios.create({
  baseURL: 'http://localhost:3001',
  headers: { 'Content-Type': 'application/json' },
})

// Helper: simulate async delay
const delay = <T>(data: T, ms = 200): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(data), ms))

// --- Projects ---
export const getProjects = (): Promise<Project[]> => delay(dummyProjects)

export const getProject = (id: string): Promise<Project | undefined> =>
  delay(dummyProjects.find((p) => p.id === id))

// --- Jobs ---
export const getJobs = (projectId: string): Promise<Job[]> =>
  delay(dummyJobs.filter((j) => j.projectId === projectId))

export const getJob = (jobId: string): Promise<Job | undefined> =>
  delay(dummyJobs.find((j) => j.id === jobId))

// --- Segments ---
export const getSegments = (jobId: string): Promise<Segment[]> =>
  delay(dummySegments.filter((s) => s.jobId === jobId))

// --- Callbacks ---
export const getCallbacks = (): Promise<Callback[]> => delay(dummyCallbacks)

// --- Customers ---
export const getCustomers = (): Promise<Customer[]> => delay(dummyCustomers)

// --- Freelancers ---
export const getFreelancers = (): Promise<Freelancer[]> => delay(dummyFreelancers)

// --- Translation Memory ---
export const getTMEntries = (): Promise<TMEntry[]> => delay(dummyTMEntries)

// --- Dashboard ---
export interface DashboardStats {
  totalProjects: number
  activeProjects: number
  finishedProjects: number
  failedProjects: number
  totalWords: number
  billableWords: number
  tmLeveragePct: number
  totalSegments: number
  iceSegments: number
  mtSegments: number
  byStatus: Record<string, number>
  recentCallbacks: Callback[]
  recentProjects: Project[]
}

export const getDashboardStats = (): Promise<DashboardStats> => {
  const byStatus: Record<string, number> = {}
  for (const p of dummyProjects) {
    byStatus[p.status] = (byStatus[p.status] ?? 0) + 1
  }

  const totalWords = dummyJobs.reduce((s, j) => s + j.wordCount, 0)
  const iceSegments = dummySegments.filter((s) => s.matchType === 'ICE').length
  const mtSegments = dummySegments.filter((s) => s.matchType === 'MT').length
  const totalSegments = dummySegments.length

  const stats: DashboardStats = {
    totalProjects: dummyProjects.length,
    activeProjects: dummyProjects.filter((p) => p.status === 'ACTIVE' || p.status === 'IN_PROGRESS').length,
    finishedProjects: dummyProjects.filter((p) => p.status === 'FINISHED').length,
    failedProjects: dummyProjects.filter((p) => p.status === 'FAILED').length,
    totalWords,
    billableWords: dummyJobs.reduce((s, j) => s + Math.round(j.wordCount * 0.65), 0),
    tmLeveragePct: totalSegments ? Math.round((iceSegments / totalSegments) * 100) : 0,
    totalSegments,
    iceSegments,
    mtSegments,
    byStatus,
    recentCallbacks: [...dummyCallbacks].sort((a, b) => b.sentAt.localeCompare(a.sentAt)).slice(0, 6),
    recentProjects: [...dummyProjects].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 4),
  }

  return delay(stats)
}
