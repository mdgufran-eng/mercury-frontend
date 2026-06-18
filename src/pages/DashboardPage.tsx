import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  FolderKanban,
  CheckCircle2,
  XCircle,
  Zap,
  FileText,
  Brain,
  Activity,
  ArrowRight,
  Clock,
} from 'lucide-react'
import { getDashboardStats } from '@/api/client'
import { cn } from '@/lib/utils'

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-blue-500',
  IN_PROGRESS: 'bg-yellow-500',
  FINISHED: 'bg-green-500',
  CREATED: 'bg-gray-400',
  FAILED: 'bg-red-500',
}

const STATUS_TEXT: Record<string, string> = {
  ACTIVE: 'text-blue-400',
  IN_PROGRESS: 'text-yellow-400',
  FINISHED: 'text-green-400',
  CREATED: 'text-gray-400',
  FAILED: 'text-red-400',
}

const EVENT_LABELS: Record<string, string> = {
  'project-created': 'Project Created',
  'analysis-finished': 'Analysis Finished',
  'job-finished': 'Job Finished',
  'project-completion': 'Project Completed',
  'source-file-updated': 'Source Updated',
  'project-activity-changed': 'Activity Changed',
}

function fmt(n: number) {
  return n.toLocaleString()
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export function DashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: getDashboardStats,
  })

  if (isLoading || !stats) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 text-sm">
        Loading dashboard…
      </div>
    )
  }

  const statusOrder = ['ACTIVE', 'IN_PROGRESS', 'FINISHED', 'CREATED', 'FAILED']
  const maxCount = Math.max(...Object.values(stats.byStatus))

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-gray-100">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">Mercury TMS · overview</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<FolderKanban className="w-5 h-5 text-indigo-400" />}
          label="Total Projects"
          value={fmt(stats.totalProjects)}
          sub={`${stats.activeProjects} active`}
          accent="indigo"
        />
        <StatCard
          icon={<Zap className="w-5 h-5 text-yellow-400" />}
          label="Total Words"
          value={fmt(stats.totalWords)}
          sub={`${fmt(stats.billableWords)} billable`}
          accent="yellow"
        />
        <StatCard
          icon={<Brain className="w-5 h-5 text-purple-400" />}
          label="TM Leverage"
          value={`${stats.tmLeveragePct}%`}
          sub={`${stats.iceSegments} ICE / ${stats.totalSegments} segs`}
          accent="purple"
        />
        <StatCard
          icon={<CheckCircle2 className="w-5 h-5 text-green-400" />}
          label="Finished"
          value={fmt(stats.finishedProjects)}
          sub={`${stats.failedProjects} failed`}
          accent="green"
        />
      </div>

      {/* Middle row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Projects by status */}
        <div className="bg-[#13131f] border border-white/5 rounded-xl p-5">
          <h2 className="text-sm font-medium text-gray-300 mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-400" />
            Projects by Status
          </h2>
          <div className="space-y-3">
            {statusOrder.map((status) => {
              const count = stats.byStatus[status] ?? 0
              const pct = maxCount ? Math.round((count / maxCount) * 100) : 0
              return (
                <div key={status} className="flex items-center gap-3">
                  <span className="w-24 text-xs text-gray-500 shrink-0">{status}</span>
                  <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className={cn('h-full rounded-full transition-all', STATUS_COLORS[status])}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className={cn('text-xs font-medium w-4 text-right', STATUS_TEXT[status])}>
                    {count}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Segment breakdown */}
          <div className="mt-6 pt-4 border-t border-white/5">
            <p className="text-xs text-gray-500 mb-3">Segment match breakdown</p>
            <div className="flex gap-6">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                <span className="text-xs text-gray-400">ICE (TM hit)</span>
                <span className="text-xs font-semibold text-purple-300">{stats.iceSegments}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                <span className="text-xs text-gray-400">MT (machine)</span>
                <span className="text-xs font-semibold text-orange-300">{stats.mtSegments}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent activity */}
        <div className="bg-[#13131f] border border-white/5 rounded-xl p-5">
          <h2 className="text-sm font-medium text-gray-300 mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-400" />
            Recent Callbacks
          </h2>
          <div className="space-y-2.5">
            {stats.recentCallbacks.map((cb) => (
              <div key={cb.id} className="flex items-start gap-3">
                <div
                  className={cn(
                    'mt-0.5 w-1.5 h-1.5 rounded-full shrink-0',
                    cb.success ? 'bg-green-500' : 'bg-red-500',
                  )}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-300 truncate">
                    <span className="text-indigo-400">{EVENT_LABELS[cb.event] ?? cb.event}</span>
                    {' · '}
                    <span className="text-gray-500">{cb.projectName}</span>
                  </p>
                  {cb.jobFileName && (
                    <p className="text-xs text-gray-600 truncate">{cb.jobFileName}</p>
                  )}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span
                    className={cn(
                      'text-xs font-mono',
                      cb.success ? 'text-green-500' : 'text-red-400',
                    )}
                  >
                    {cb.statusCode}
                  </span>
                  <span className="text-xs text-gray-600">{timeAgo(cb.sentAt)}</span>
                </div>
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
      </div>

      {/* Recent projects */}
      <div className="bg-[#13131f] border border-white/5 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-gray-300 flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-400" />
            Recent Projects
          </h2>
          <Link
            to="/projects"
            className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="divide-y divide-white/5">
          {stats.recentProjects.map((p) => (
            <Link
              key={p.id}
              to={`/projects/${p.id}`}
              className="flex items-center gap-4 py-3 hover:bg-white/3 -mx-1 px-1 rounded-md transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-200 truncate">{p.name}</p>
                <p className="text-xs text-gray-500">
                  {p.sourceLang} → {p.targetLang} · {p.customerName}
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span
                  className={cn(
                    'text-xs font-medium px-2 py-0.5 rounded-full',
                    p.method === 'MACHINE'
                      ? 'bg-blue-500/10 text-blue-400'
                      : 'bg-amber-500/10 text-amber-400',
                  )}
                >
                  {p.method}
                </span>
                <span
                  className={cn(
                    'flex items-center gap-1 text-xs font-medium',
                    STATUS_TEXT[p.status],
                  )}
                >
                  {p.status === 'FINISHED' && <CheckCircle2 className="w-3 h-3" />}
                  {p.status === 'FAILED' && <XCircle className="w-3 h-3" />}
                  {p.status}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ReactNode
  label: string
  value: string
  sub: string
  accent: 'indigo' | 'yellow' | 'purple' | 'green'
}) {
  const ring: Record<string, string> = {
    indigo: 'border-indigo-500/20',
    yellow: 'border-yellow-500/20',
    purple: 'border-purple-500/20',
    green: 'border-green-500/20',
  }
  return (
    <div className={cn('bg-[#13131f] border rounded-xl p-4', ring[accent])}>
      <div className="flex items-center gap-2 mb-3">{icon}<span className="text-xs text-gray-500">{label}</span></div>
      <p className="text-2xl font-semibold text-gray-100">{value}</p>
      <p className="text-xs text-gray-600 mt-1">{sub}</p>
    </div>
  )
}
