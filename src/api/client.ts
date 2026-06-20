import axios from 'axios'
import type { Project, Job, Segment, Callback, Customer, Freelancer, TMEntry } from '@/types'

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

export const httpClient = axios.create({
  baseURL: API,
  headers: { 'Content-Type': 'application/json' },
})

// --- Projects ---
export const getProjects = async (): Promise<Project[]> => {
  const { data } = await httpClient.get('/admin/api/projects')
  return data.data.map(mapProject)
}

export const getProject = async (id: string): Promise<Project | undefined> => {
  try {
    const { data } = await httpClient.get(`/admin/api/projects/${id}`)
    return mapProject(data)
  } catch {
    return undefined
  }
}

export const createProject = async (body: {
  name: string
  customerId: string
  targetLang: string
  method: 'MACHINE' | 'HUMAN'
  callbackUrls?: {
    projectCreated?: string
    analysisFinished?: string
    jobFinished?: string
    projectCompletion?: string
  }
}): Promise<Project> => {
  const { data } = await httpClient.post('/admin/api/projects', body)
  return mapProject(data)
}

// --- Jobs ---
export const getJobs = async (projectId: string): Promise<Job[]> => {
  const { data } = await httpClient.get(`/admin/api/projects/${projectId}/jobs`)
  return data.data.map(mapJob)
}

export const getJob = async (jobId: string): Promise<Job | undefined> => {
  try {
    const { data } = await httpClient.get(`/admin/api/jobs/${jobId}`)
    return mapJob(data)
  } catch {
    return undefined
  }
}

export const uploadFiles = async (projectId: string, files: File[]): Promise<void> => {
  const form = new FormData()
  files.forEach((f) => form.append('files', f, f.name))
  await httpClient.post(`/admin/api/projects/${projectId}/jobs`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export const updateFile = async (
  projectId: string,
  jobId: string,
  body: { fileName: string; sourceContent: Record<string, unknown> },
): Promise<void> => {
  await httpClient.put(`/admin/api/projects/${projectId}/jobs/${jobId}`, body)
}

export const deleteFile = async (projectId: string, jobId: string): Promise<void> => {
  await httpClient.delete(`/admin/api/projects/${projectId}/jobs/${jobId}`)
}

export const retryFile = async (projectId: string, jobId: string): Promise<void> => {
  await httpClient.post(`/admin/api/projects/${projectId}/jobs/${jobId}/retry`)
}

// --- Translation download ---
export const downloadTranslations = async (projectId: string, jobIds?: string[]): Promise<void> => {
  const params = new URLSearchParams({ fileType: 'TARGET' })
  if (jobIds?.length) params.set('jobIds', jobIds.join(','))
  const url = `${API}/project-manager-api-rest/projects/${projectId}/files/download?${params}`
  const { data } = await httpClient.get(url, { responseType: 'blob', baseURL: '' })
  const href = URL.createObjectURL(new Blob([data], { type: 'application/zip' }))
  const a = document.createElement('a')
  a.href = href
  a.download = `project-${projectId}-translations.zip`
  a.click()
  URL.revokeObjectURL(href)
}

// --- Segments ---
export const getSegments = async (projectId: string, jobId: string): Promise<Segment[]> => {
  const { data } = await httpClient.get(`/admin/api/projects/${projectId}/segments?jobId=${jobId}`)
  return (data.data ?? []).map(mapSegment)
}

export const updateSegment = async (projectId: string, segmentId: string, target: string): Promise<void> => {
  await httpClient.put(`/admin/api/projects/${projectId}/segments/${segmentId}`, { target })
}

export const approveSegment = async (projectId: string, segmentId: string): Promise<void> => {
  await httpClient.post(`/admin/api/projects/${projectId}/segments/${segmentId}/approve`)
}

export const completeJob = async (projectId: string, jobId: string): Promise<void> => {
  await httpClient.post(`/admin/api/projects/${projectId}/jobs/${jobId}/complete`)
}

// --- Callbacks ---
export const getCallbacks = async (): Promise<Callback[]> => {
  const { data } = await httpClient.get('/admin/api/callbacks')
  return data.data.map(mapCallback)
}

export const resendCallback = async (id: string): Promise<void> => {
  await httpClient.post(`/admin/api/callbacks/${id}/resend`)
}

// --- Customers ---
export const getCustomers = async (): Promise<Customer[]> => {
  const { data } = await httpClient.get('/admin/api/customers')
  return (data.data ?? data).map(mapCustomer)
}

// --- Freelancers ---
export const getFreelancers = async (): Promise<Freelancer[]> => {
  const { data } = await httpClient.get('/admin/api/freelancers')
  return (data.data ?? data).map(mapFreelancer)
}

// --- Translation Memory ---
export const getTMEntries = async (): Promise<TMEntry[]> => {
  try {
    const { data } = await httpClient.get('/admin/api/tm')
    return (data.data ?? []).map(mapTMEntry)
  } catch {
    return []
  }
}

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

export const getDashboardStats = async (): Promise<DashboardStats> => {
  const { data } = await httpClient.get('/admin/api/stats')
  return {
    ...data,
    recentProjects: (data.recentProjects ?? []).map(mapProject),
    recentCallbacks: (data.recentCallbacks ?? []).map(mapCallback),
  }
}

// --- Mappers (backend → frontend types) ---

function mapProject(p: Record<string, unknown>): Project {
  return {
    id: String(p['id'] ?? p['projectId']),
    name: String(p['name'] ?? ''),
    customerId: String(p['customerId'] ?? ''),
    customerName: String(p['customerName'] ?? p['customerId'] ?? ''),
    sourceLang: String(p['sourceLang'] ?? p['sourceLanguage'] ?? 'EN'),
    targetLang: String(p['targetLang'] ?? p['targetLanguage'] ?? ''),
    status: (p['status'] as Project['status']) ?? 'CREATED',
    method: (p['method'] as Project['method']) ?? 'MACHINE',
    poNumber: String(p['poNumber'] ?? ''),
    createdAt: String(p['createdAt'] ?? ''),
    updatedAt: String(p['updatedAt'] ?? ''),
    jobCount: Number(p['jobCount'] ?? (Array.isArray(p['jobs']) ? p['jobs'].length : 0)),
  }
}

function mapJob(j: Record<string, unknown>): Job {
  const rawStatus = String(j['status'] ?? 'PENDING')
  const status = rawStatus === 'CREATED' ? 'PENDING' : rawStatus === 'FINISHED' ? 'COMPLETED' : rawStatus
  return {
    id: String(j['id'] ?? j['jobId']),
    projectId: String(j['projectId'] ?? ''),
    fileName: String(j['fileName'] ?? ''),
    sourceContent: j['sourceContent'] as Record<string, unknown> | undefined,
    sourceHash: j['sourceHash'] ? String(j['sourceHash']) : undefined,
    sourceLang: String(j['sourceLang'] ?? 'EN'),
    targetLang: String(j['targetLang'] ?? ''),
    status: status as Job['status'],
    method: (j['method'] as Job['method']) ?? 'MACHINE',
    wordCount: Number(j['billableWords'] ?? j['wordCount'] ?? 0),
    segmentCount: Number(j['segmentCount'] ?? 0),
    createdAt: String(j['createdAt'] ?? ''),
    completedAt: j['completedAt'] ? String(j['completedAt']) : undefined,
  }
}

function mapSegment(s: Record<string, unknown>): Segment {
  const approved = Boolean(s['approved'])
  return {
    id: String(s['id'] ?? s['segmentId']),
    jobId: String(s['jobId'] ?? ''),
    no: Number(s['no'] ?? s['index'] ?? 0),
    source: String(s['source'] ?? ''),
    target: String(s['target'] ?? ''),
    matchType: (s['matchType'] as Segment['matchType']) ?? 'MT',
    status: approved ? 'CONFIRMED' : 'TRANSLATED',
  }
}

function mapCallback(c: Record<string, unknown>): Callback {
  let payload: Record<string, unknown> = (c['payload'] as Record<string, unknown>) ?? {}
  if (c['body'] && typeof c['body'] === 'string') {
    try { payload = JSON.parse(c['body'] as string) } catch { /* non-JSON body, keep payload */ }
  }
  return {
    id: String(c['id'] ?? c['callbackId']),
    event: (c['event'] as Callback['event']) ?? 'project-created',
    projectId: String(c['projectId'] ?? ''),
    projectName: String(c['projectName'] ?? c['projectId'] ?? ''),
    jobId: c['jobId'] ? String(c['jobId']) : undefined,
    jobFileName: c['jobFileName'] ? String(c['jobFileName']) : undefined,
    payload,
    sentAt: String(c['sentAt'] ?? c['createdAt'] ?? ''),
    statusCode: Number(c['statusCode'] ?? c['responseStatus'] ?? 0),
    success: Boolean(c['success']),
  }
}

function mapCustomer(c: Record<string, unknown>): Customer {
  return {
    id: String(c['id'] ?? c['customerId']),
    name: String(c['name'] ?? ''),
    email: String(c['email'] ?? ''),
    company: String(c['company'] ?? c['type'] ?? ''),
    createdAt: String(c['createdAt'] ?? ''),
  }
}

function mapFreelancer(f: Record<string, unknown>): Freelancer {
  const langs = (f['langs'] ?? f['languages'] ?? []) as string[]
  return {
    id: String(f['id'] ?? f['freelancerId']),
    name: String(f['name'] ?? ''),
    email: String(f['email'] ?? ''),
    langs: langs.map((l) => l.toUpperCase()),
    status: (f['status'] as Freelancer['status']) ?? 'AVAILABLE',
    completedJobs: Number(f['completedJobs'] ?? 0),
  }
}

function mapTMEntry(t: Record<string, unknown>): TMEntry {
  return {
    id: String(t['id'] ?? t['_id'] ?? ''),
    sourceLang: String(t['sourceLang'] ?? t['sourceLanguage'] ?? ''),
    targetLang: String(t['targetLang'] ?? t['targetLanguage'] ?? ''),
    sourceText: String(t['sourceText'] ?? ''),
    targetText: String(t['targetText'] ?? ''),
    matchScore: Number(t['matchScore'] ?? 100),
    usageCount: Number(t['usageCount'] ?? 0),
    createdAt: String(t['createdAt'] ?? ''),
  }
}

// --- Templates ---
export const getTemplates = async () => {
  try {
    const { data } = await httpClient.get('/admin/api/templates')
    return data.data ?? []
  } catch {
    return []
  }
}

// --- Project status controls ---
export const forceCompleteProject = async (projectId: string): Promise<void> => {
  await httpClient.post(`/admin/api/projects/${projectId}/force-complete`)
}

export const changeProjectStatus = async (
  projectId: string,
  status: 'CREATED' | 'ACTIVE' | 'IN_PROGRESS' | 'FINISHED' | 'FAILED',
): Promise<void> => {
  await httpClient.patch(`/admin/api/projects/${projectId}/status`, { status })
}
