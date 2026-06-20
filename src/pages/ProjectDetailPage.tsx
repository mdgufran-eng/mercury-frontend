import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams, Link } from 'react-router-dom'
import { useState, useRef } from 'react'
import {
  ArrowLeft,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  ArrowRight,
  CalendarDays,
  User,
  Upload,
  X,
  FilePlus,
  Download,
  Pencil,
  Trash2,
  RotateCcw,
} from 'lucide-react'
import {
  getProject,
  getJobs,
  getJob,
  getCallbacks,
  uploadFiles,
  updateFile,
  deleteFile,
  retryFile,
  downloadTranslations,
} from '@/api/client'
import { cn } from '@/lib/utils'
import type { Job, ProjectStatus, JobStatus } from '@/types'

const PROJECT_STATUS: Record<ProjectStatus, { dot: string; text: string; bg: string }> = {
  ACTIVE:      { dot: 'bg-blue-500',   text: 'text-blue-400',   bg: 'bg-blue-500/10' },
  IN_PROGRESS: { dot: 'bg-yellow-500', text: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  FINISHED:    { dot: 'bg-green-500',  text: 'text-green-400',  bg: 'bg-green-500/10' },
  CREATED:     { dot: 'bg-gray-500',   text: 'text-gray-400',   bg: 'bg-gray-500/10' },
  FAILED:      { dot: 'bg-red-500',    text: 'text-red-400',    bg: 'bg-red-500/10' },
}

const JOB_STATUS: Record<JobStatus, { icon: React.ReactNode; text: string }> = {
  COMPLETED:   { icon: <CheckCircle2 className="w-3.5 h-3.5" />, text: 'text-green-400' },
  IN_PROGRESS: { icon: <Loader2 className="w-3.5 h-3.5 animate-spin" />, text: 'text-yellow-400' },
  PENDING:     { icon: <Clock className="w-3.5 h-3.5" />, text: 'text-gray-500' },
  FAILED:      { icon: <XCircle className="w-3.5 h-3.5" />, text: 'text-red-400' },
}

const EVENT_LABELS: Record<string, string> = {
  'project-created':          'Project Created',
  'analysis-finished':        'Analysis Finished',
  'job-finished':             'Job Finished',
  'project-completion':       'Project Completed',
  'source-file-updated':      'Source Updated',
  'project-activity-changed': 'Activity Changed',
}

function UploadFileModal({ projectId, onClose }: { projectId: string; onClose: () => void }) {
  const qc = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [files, setFiles] = useState<File[]>([])
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  function pickFiles(fileList: FileList | null) {
    if (!fileList) return
    const valid = Array.from(fileList).filter((f) => /\.json$/i.test(f.name))
    if (valid.length) setFiles((prev) => {
      const names = new Set(prev.map((f) => f.name))
      return [...prev, ...valid.filter((f) => !names.has(f.name))]
    })
  }

  function removeFile(name: string) {
    setFiles((prev) => prev.filter((f) => f.name !== name))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!files.length) return
    setLoading(true)
    try {
      await uploadFiles(projectId, files)
      qc.invalidateQueries({ queryKey: ['jobs', projectId] })
      setSubmitted(true)
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="bg-[#13131f] border border-white/10 rounded-2xl p-8 w-full max-w-sm text-center">
          <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
            <FilePlus className="w-6 h-6 text-green-400" />
          </div>
          <h3 className="text-base font-semibold text-gray-100 mb-1">{files.length} file{files.length > 1 ? 's' : ''} uploaded</h3>
          <p className="text-xs text-gray-600 mb-6">Translation queued · status: PENDING</p>
          <button onClick={onClose} className="w-full px-4 py-2 bg-[#7c6cfe] hover:bg-[#6355e0] text-white text-sm rounded-lg transition-colors">
            Done
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#13131f] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-gray-100 flex items-center gap-2">
            <Upload className="w-4 h-4 text-[#9b8fff]" /> Upload Files
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-500 hover:text-gray-300 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          {/* Drop zone */}
          <div
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); pickFiles(e.dataTransfer.files) }}
            className={cn(
              'border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors',
              dragOver ? 'border-[#7c6cfe] bg-[#7c6cfe]/5' : 'border-white/10 hover:border-white/20',
            )}
          >
            <input
              ref={fileRef}
              type="file"
              accept=".json"
              multiple
              className="hidden"
              onChange={(e) => pickFiles(e.target.files)}
            />
            <Upload className="w-7 h-7 text-gray-600 mx-auto mb-2" />
            <p className="text-sm text-gray-400">Drop JSON files here or click to browse</p>
            <p className="text-xs text-gray-600 mt-1">Multiple files supported · .json only</p>
          </div>

          {/* File list */}
          {files.length > 0 && (
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {files.map((f) => (
                <div key={f.name} className="flex items-center gap-3 px-3 py-2 bg-white/5 rounded-lg">
                  <FileText className="w-3.5 h-3.5 text-[#9b8fff] shrink-0" />
                  <span className="text-xs text-gray-300 font-mono flex-1 truncate">{f.name}</span>
                  <span className="text-xs text-gray-600 shrink-0">{(f.size / 1024).toFixed(1)} KB</span>
                  <button type="button" onClick={() => removeFile(f.name)} className="p-0.5 text-gray-600 hover:text-gray-400 transition-colors">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-400 text-sm rounded-lg transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !files.length}
              className="flex-1 px-4 py-2 bg-[#7c6cfe] hover:bg-[#6355e0] disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Upload className="w-3.5 h-3.5" /> {loading ? 'Uploading…' : files.length > 0 ? `Upload ${files.length} file${files.length > 1 ? 's' : ''}` : 'Upload Files'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function EditFileModal({ projectId, job, onClose }: { projectId: string; job: Job; onClose: () => void }) {
  const qc = useQueryClient()
  const [fileName, setFileName] = useState(job.fileName)
  const [sourceJson, setSourceJson] = useState(JSON.stringify(job.sourceContent ?? {}, null, 2))
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    let sourceContent: Record<string, unknown>
    try {
      const parsed = JSON.parse(sourceJson)
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        setError('Source content must be a JSON object.')
        return
      }
      sourceContent = parsed as Record<string, unknown>
    } catch {
      setError('Source content is not valid JSON.')
      return
    }

    setLoading(true)
    try {
      await updateFile(projectId, job.id, { fileName: fileName.trim(), sourceContent })
      qc.invalidateQueries({ queryKey: ['jobs', projectId] })
      qc.invalidateQueries({ queryKey: ['job', job.id] })
      qc.invalidateQueries({ queryKey: ['segments', job.id] })
      onClose()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update file.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#13131f] border border-white/10 rounded-2xl p-6 w-full max-w-3xl shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-gray-100 flex items-center gap-2">
            <Pencil className="w-4 h-4 text-[#9b8fff]" /> Edit File
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-500 hover:text-gray-300 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <label className="block">
            <span className="block text-xs text-gray-500 mb-1.5">File name</span>
            <input
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 outline-none focus:border-[#7c6cfe]"
            />
          </label>

          <label className="block">
            <span className="block text-xs text-gray-500 mb-1.5">Source JSON</span>
            <textarea
              value={sourceJson}
              onChange={(e) => setSourceJson(e.target.value)}
              spellCheck={false}
              className="w-full h-[420px] bg-[#0d0d16] border border-white/10 rounded-lg px-3 py-2 text-xs text-gray-200 font-mono outline-none focus:border-[#7c6cfe] resize-none"
            />
          </label>

          {error && <p className="text-xs text-red-400">{error}</p>}

          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-400 text-sm rounded-lg transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !fileName.trim()}
              className="px-4 py-2 bg-[#7c6cfe] hover:bg-[#6355e0] disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors"
            >
              {loading ? 'Saving…' : 'Save and retranslate'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const [showUpload, setShowUpload] = useState(false)
  const [editingJob, setEditingJob] = useState<Job | null>(null)
  const [busyJobId, setBusyJobId] = useState<string | null>(null)
  const qc = useQueryClient()

  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => getProject(projectId!),
    enabled: !!projectId,
  })

  const { data: jobs, isLoading: jobsLoading } = useQuery({
    queryKey: ['jobs', projectId],
    queryFn: () => getJobs(projectId!),
    enabled: !!projectId,
  })

  const { data: allCallbacks } = useQuery({
    queryKey: ['callbacks'],
    queryFn: getCallbacks,
  })

  const projectCallbacks = allCallbacks?.filter((c) => c.projectId === projectId) ?? []

  async function openEdit(jobId: string) {
    setBusyJobId(jobId)
    try {
      const job = await getJob(jobId)
      if (job) setEditingJob(job)
    } finally {
      setBusyJobId(null)
    }
  }

  async function retryJob(jobId: string) {
    setBusyJobId(jobId)
    try {
      await retryFile(projectId!, jobId)
      qc.invalidateQueries({ queryKey: ['jobs', projectId] })
      qc.invalidateQueries({ queryKey: ['job', jobId] })
      qc.invalidateQueries({ queryKey: ['segments', jobId] })
    } finally {
      setBusyJobId(null)
    }
  }

  async function removeJob(job: Job) {
    const ok = window.confirm(`Delete ${job.fileName}? This removes its segments and translations.`)
    if (!ok) return

    setBusyJobId(job.id)
    try {
      await deleteFile(projectId!, job.id)
      qc.invalidateQueries({ queryKey: ['project', projectId] })
      qc.invalidateQueries({ queryKey: ['jobs', projectId] })
    } finally {
      setBusyJobId(null)
    }
  }

  if (projectLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 text-sm">
        Loading project…
      </div>
    )
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center h-64 text-red-400 text-sm">
        Project not found.
      </div>
    )
  }

  const ps = PROJECT_STATUS[project.status]
  const completedJobs = jobs?.filter((j) => j.status === 'COMPLETED').length ?? 0
  const totalJobs = jobs?.length ?? 0
  const progressPct = totalJobs ? Math.round((completedJobs / totalJobs) * 100) : 0
  const totalWords = jobs?.reduce((s, j) => s + j.wordCount, 0) ?? 0

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {showUpload && <UploadFileModal projectId={projectId!} onClose={() => setShowUpload(false)} />}
      {editingJob && <EditFileModal projectId={projectId!} job={editingJob} onClose={() => setEditingJob(null)} />}
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link to="/projects" className="flex items-center gap-1.5 hover:text-[#9b8fff] transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          Projects
        </Link>
        <span>/</span>
        <span className="text-gray-400 truncate max-w-xs">{project.name}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-100">{project.name}</h1>
          <p className="text-xs font-mono text-gray-600 mt-0.5">{project.id}</p>
        </div>
        <span className={cn('flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full shrink-0', ps.bg, ps.text)}>
          <span className={cn('w-1.5 h-1.5 rounded-full', ps.dot)} />
          {project.status}
        </span>
      </div>

      {/* Info grid + progress */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Details card */}
        <div className="lg:col-span-2 bg-[#13131f] border border-white/5 rounded-xl p-5">
          <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-4">Project Details</h2>
          <dl className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
            <div className="flex items-start gap-2">
              <User className="w-4 h-4 text-gray-600 mt-0.5 shrink-0" />
              <div>
                <dt className="text-xs text-gray-600">PO Number</dt>
                <dd className="text-gray-200 font-medium font-mono mt-0.5">{project.poNumber}</dd>
              </div>
            </div>
            <div>
              <dt className="text-xs text-gray-600">Target Language</dt>
              <dd className="mt-0.5">
                <span className="font-mono text-sm font-semibold text-[#b3a9ff] bg-[#7c6cfe]/10 px-2 py-0.5 rounded">
                  {project.targetLang}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-xs text-gray-600">Method</dt>
              <dd className="mt-0.5">
                <span className={cn(
                  'text-xs font-medium px-2 py-0.5 rounded-full',
                  project.method === 'MACHINE' ? 'bg-blue-500/10 text-blue-400' : 'bg-amber-500/10 text-amber-400',
                )}>
                  {project.method}
                </span>
              </dd>
            </div>
            <div className="flex items-start gap-2">
              <CalendarDays className="w-4 h-4 text-gray-600 mt-0.5 shrink-0" />
              <div>
                <dt className="text-xs text-gray-600">Created</dt>
                <dd className="text-gray-400 text-xs mt-0.5">{new Date(project.createdAt).toLocaleString()}</dd>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CalendarDays className="w-4 h-4 text-gray-600 mt-0.5 shrink-0" />
              <div>
                <dt className="text-xs text-gray-600">Last Updated</dt>
                <dd className="text-gray-400 text-xs mt-0.5">{new Date(project.updatedAt).toLocaleString()}</dd>
              </div>
            </div>
          </dl>
        </div>

        {/* Progress card */}
        <div className="bg-[#13131f] border border-white/5 rounded-xl p-5 flex flex-col gap-4">
          <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</h2>

          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-gray-500">Files complete</span>
              <span className="text-gray-300 font-medium">{completedJobs}/{totalJobs}</span>
            </div>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#7c6cfe] rounded-full transition-all"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <p className="text-xs text-gray-600 mt-1">{progressPct}% finished</p>
          </div>

          <div className="pt-3 border-t border-white/5 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Total words</span>
              <span className="text-gray-300 font-mono">{totalWords.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Files</span>
              <span className="text-gray-300">{project.jobCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Files / Jobs */}
      <div className="bg-[#13131f] border border-white/5 rounded-xl overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-white/5">
          <FileText className="w-4 h-4 text-[#9b8fff]" />
          <h2 className="text-sm font-medium text-gray-300">Files</h2>
          <span className="text-xs text-gray-600">{totalJobs} files</span>
          <button
            onClick={() => setShowUpload(true)}
            className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-[#7c6cfe] hover:bg-[#6355e0] text-white text-xs rounded-lg transition-colors"
          >
            <Upload className="w-3.5 h-3.5" /> Upload File
          </button>
        </div>

        {jobsLoading ? (
          <div className="p-8 text-center text-gray-600 text-sm">Loading jobs…</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-600 uppercase tracking-wider">File</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-600 uppercase tracking-wider">Status</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-600 uppercase tracking-wider">Words</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-600 uppercase tracking-wider">Segments</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-600 uppercase tracking-wider">Created</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {/* All files row */}
              {jobs && jobs.length > 0 && (
                <tr className="bg-white/[0.02]">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[#9b8fff] shrink-0" />
                      <span className="font-semibold text-gray-200">All files</span>
                      <span className="text-xs text-gray-600 ml-1">{jobs.length} files</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-gray-600">{completedJobs}/{jobs.length} completed</span>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-300 font-mono text-xs font-semibold">
                    {totalWords.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-400 text-xs">
                    {jobs.reduce((s, j) => s + j.segmentCount, 0)}
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs" />
                  <td className="px-4 py-3 text-right">
                    {completedJobs > 0 && (
                      <button
                        onClick={() => downloadTranslations(projectId!)}
                        className="inline-flex items-center gap-1 text-xs text-[#9b8fff] hover:text-[#b3a9ff] transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" /> Download all
                      </button>
                    )}
                  </td>
                </tr>
              )}

              {/* Finished files sub-header */}
              {jobs && completedJobs > 0 && (
                <tr className="bg-white/[0.01]">
                  <td className="px-5 py-2.5" colSpan={6}>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
                      <span className="text-xs font-medium text-green-400">Finished files</span>
                      <span className="text-xs text-gray-600">{completedJobs} files</span>
                    </div>
                  </td>
                </tr>
              )}

              {/* Individual file rows */}
              {jobs?.map((job) => {
                const js = JOB_STATUS[job.status]
                return (
                  <tr key={job.id} className="hover:bg-white/3 transition-colors">
                    <td className="px-5 py-3 pl-10">
                      <p className="font-medium text-gray-200 text-sm">{job.fileName}</p>
                      <p className="text-xs text-gray-600 font-mono mt-0.5">{job.id}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('flex items-center gap-1.5 text-xs font-medium w-fit', js.text)}>
                        {js.icon}
                        {job.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-400 font-mono text-xs">
                      {job.wordCount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-400 text-xs">
                      {job.segmentCount}
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs">
                      {new Date(job.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-3">
                        {job.status === 'COMPLETED' && (
                          <button
                            onClick={() => downloadTranslations(projectId!, [job.id])}
                            title="Download translation"
                            className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 transition-colors"
                          >
                            <Download className="w-3 h-3" />
                          </button>
                        )}
                        {job.status === 'FAILED' && (
                          <button
                            onClick={() => retryJob(job.id)}
                            disabled={busyJobId === job.id}
                            title="Retry failed file"
                            className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 disabled:opacity-40 transition-colors"
                          >
                            <RotateCcw className={cn('w-3 h-3', busyJobId === job.id && 'animate-spin')} />
                          </button>
                        )}
                        <button
                          onClick={() => openEdit(job.id)}
                          disabled={busyJobId === job.id}
                          title="Edit source file"
                          className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 disabled:opacity-40 transition-colors"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => removeJob(job)}
                          disabled={busyJobId === job.id}
                          title="Delete file"
                          className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-red-400 disabled:opacity-40 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                        <Link
                          to={`/projects/${project.id}/jobs/${job.id}/segments`}
                          className="inline-flex items-center gap-1 text-xs text-[#9b8fff] hover:text-[#b3a9ff] transition-colors"
                        >
                          Segments <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Project callbacks */}
      {projectCallbacks.length > 0 && (
        <div className="bg-[#13131f] border border-white/5 rounded-xl p-5">
          <h2 className="text-sm font-medium text-gray-300 mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#9b8fff]" />
            Callback History
            <span className="ml-auto text-xs text-gray-600">{projectCallbacks.length} events</span>
          </h2>
          <div className="space-y-2.5">
            {projectCallbacks.map((cb) => (
              <div key={cb.id} className="flex items-center gap-3">
                <div className={cn('w-1.5 h-1.5 rounded-full shrink-0', cb.success ? 'bg-green-500' : 'bg-red-500')} />
                <span className="text-xs text-[#9b8fff] w-36 shrink-0">
                  {EVENT_LABELS[cb.event] ?? cb.event}
                </span>
                {cb.jobFileName && (
                  <span className="text-xs text-gray-600 truncate flex-1">{cb.jobFileName}</span>
                )}
                <span className={cn('text-xs font-mono ml-auto', cb.success ? 'text-green-500' : 'text-red-400')}>
                  {cb.statusCode}
                </span>
                <span className="text-xs text-gray-600 w-16 text-right">{timeAgo(cb.sentAt)}</span>
              </div>
            ))}
          </div>
          <Link
            to="/callbacks"
            className="mt-4 flex items-center gap-1 text-xs text-[#9b8fff] hover:text-[#b3a9ff] transition-colors"
          >
            View all callbacks <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      )}
    </div>
  )
}
