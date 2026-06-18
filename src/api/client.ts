import axios from 'axios'
import {
  dummyProjects,
  dummyJobs,
  dummySegments,
  dummyCallbacks,
  dummyCustomers,
  dummyTemplates,
  dummyFreelancers,
  dummyTMEntries,
} from '@/data/dummy'
import type { Project, Job, Segment, Callback, Customer, Template, Freelancer, TMEntry } from '@/types'

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

// --- Templates ---
export const getTemplates = (): Promise<Template[]> => delay(dummyTemplates)

// --- Freelancers ---
export const getFreelancers = (): Promise<Freelancer[]> => delay(dummyFreelancers)

// --- Translation Memory ---
export const getTMEntries = (): Promise<TMEntry[]> => delay(dummyTMEntries)
