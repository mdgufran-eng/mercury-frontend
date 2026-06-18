import { useQuery } from '@tanstack/react-query'
import { useParams, Link } from 'react-router-dom'
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
  Layers,
} from 'lucide-react'
import { getProject, getJobs, getCallbacks } from '@/api/client'
import { cn } from '@/lib/utils'
import type { ProjectStatus, JobStatus } from '@/types'

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
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link to="/projects" className="flex items-center gap-1.5 hover:text-indigo-400 transition-colors">
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
                <dt className="text-xs text-gray-600">Customer</dt>
                <dd className="text-gray-200 font-medium mt-0.5">{project.customerName}</dd>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Layers className="w-4 h-4 text-gray-600 mt-0.5 shrink-0" />
              <div>
                <dt className="text-xs text-gray-600">Template</dt>
                <dd className="text-gray-200 font-medium mt-0.5">{project.templateName}</dd>
              </div>
            </div>
            <div>
              <dt className="text-xs text-gray-600">Language Pair</dt>
              <dd className="mt-0.5">
                <span className="font-mono text-sm font-semibold text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded">
                  {project.sourceLang} → {project.targetLang}
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
              <span className="text-gray-500">Jobs complete</span>
              <span className="text-gray-300 font-medium">{completedJobs}/{totalJobs}</span>
            </div>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded-full transition-all"
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
          <FileText className="w-4 h-4 text-indigo-400" />
          <h2 className="text-sm font-medium text-gray-300">Files / Jobs</h2>
          <span className="ml-auto text-xs text-gray-600">{totalJobs} files</span>
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
              {jobs?.map((job) => {
                const js = JOB_STATUS[job.status]
                return (
                  <tr key={job.id} className="hover:bg-white/3 transition-colors">
                    <td className="px-5 py-3">
                      <p className="font-medium text-gray-200">{job.fileName}</p>
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
                      <Link
                        to={`/projects/${project.id}/jobs/${job.id}/segments`}
                        className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                      >
                        Segments <ArrowRight className="w-3 h-3" />
                      </Link>
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
            <Clock className="w-4 h-4 text-indigo-400" />
            Callback History
            <span className="ml-auto text-xs text-gray-600">{projectCallbacks.length} events</span>
          </h2>
          <div className="space-y-2.5">
            {projectCallbacks.map((cb) => (
              <div key={cb.id} className="flex items-center gap-3">
                <div className={cn('w-1.5 h-1.5 rounded-full shrink-0', cb.success ? 'bg-green-500' : 'bg-red-500')} />
                <span className="text-xs text-indigo-400 w-36 shrink-0">
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
            className="mt-4 flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            View all callbacks <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      )}
    </div>
  )
}
