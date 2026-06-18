import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import {
  RotateCcw,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Search,
  Bell,
} from 'lucide-react'
import { getCallbacks } from '@/api/client'
import { cn } from '@/lib/utils'
import type { CallbackEvent } from '@/types'

const EVENT_META: Record<string, { label: string; color: string }> = {
  'project-created':          { label: 'Project Created',   color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  'analysis-finished':        { label: 'Analysis Finished', color: 'bg-[#7c6cfe]/10 text-[#9b8fff] border-[#7c6cfe]/20' },
  'job-finished':             { label: 'Job Finished',      color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
  'project-completion':       { label: 'Project Completed', color: 'bg-green-500/10 text-green-400 border-green-500/20' },
  'source-file-updated':      { label: 'Source Updated',    color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
  'project-activity-changed': { label: 'Activity Changed',  color: 'bg-gray-500/10 text-gray-400 border-gray-500/20' },
}

type FilterStatus = 'ALL' | 'SUCCESS' | 'FAILED'

const STATUS_FILTERS: { id: FilterStatus; label: string }[] = [
  { id: 'ALL', label: 'All' },
  { id: 'SUCCESS', label: 'Success' },
  { id: 'FAILED', label: 'Failed' },
]

interface ResendState {
  [id: string]: 'idle' | 'sending' | 'sent' | 'error'
}

function simulateResend(id: string, setState: React.Dispatch<React.SetStateAction<ResendState>>) {
  setState((prev) => ({ ...prev, [id]: 'sending' }))
  setTimeout(() => {
    setState((prev) => ({ ...prev, [id]: Math.random() > 0.2 ? 'sent' : 'error' }))
    setTimeout(() => setState((prev) => ({ ...prev, [id]: 'idle' })), 2500)
  }, 1200)
}

export function CallbacksPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('ALL')
  const [eventFilter, setEventFilter] = useState<string>('ALL')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [resendState, setResendState] = useState<ResendState>({})
  const queryClient = useQueryClient()

  const { data: callbacks, isLoading } = useQuery({
    queryKey: ['callbacks'],
    queryFn: getCallbacks,
  })

  const allEvents = Array.from(new Set(callbacks?.map((c) => c.event) ?? []))

  const filtered = callbacks?.filter((cb) => {
    if (statusFilter === 'SUCCESS' && !cb.success) return false
    if (statusFilter === 'FAILED' && cb.success) return false
    if (eventFilter !== 'ALL' && cb.event !== eventFilter) return false
    if (search) {
      const q = search.toLowerCase()
      return (
        cb.projectName.toLowerCase().includes(q) ||
        cb.event.toLowerCase().includes(q) ||
        (cb.jobFileName ?? '').toLowerCase().includes(q)
      )
    }
    return true
  })

  const failedCount = callbacks?.filter((c) => !c.success).length ?? 0
  const successCount = callbacks?.filter((c) => c.success).length ?? 0

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-100 flex items-center gap-2">
            <Bell className="w-5 h-5 text-[#9b8fff]" />
            Callbacks
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Webhook delivery log — all project and job events</p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5 text-green-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {successCount} delivered
          </span>
          <span className="flex items-center gap-1.5 text-red-400">
            <XCircle className="w-3.5 h-3.5" />
            {failedCount} failed
          </span>
        </div>
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600" />
          <input
            type="text"
            placeholder="Search project, event, file…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 bg-[#13131f] border border-white/10 rounded-lg text-xs text-gray-300 placeholder-gray-600 focus:outline-none focus:border-[#7c6cfe] transition-colors"
          />
        </div>

        {/* Status filter */}
        <div className="flex gap-1 bg-[#13131f] border border-white/5 rounded-lg p-1">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id)}
              className={cn(
                'px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                statusFilter === f.id
                  ? 'bg-[#7c6cfe] text-white'
                  : 'text-gray-500 hover:text-gray-300 hover:bg-white/5',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Event filter */}
        <select
          value={eventFilter}
          onChange={(e) => setEventFilter(e.target.value)}
          className="px-3 py-2 bg-[#13131f] border border-white/10 rounded-lg text-xs text-gray-400 focus:outline-none focus:border-[#7c6cfe] transition-colors"
        >
          <option value="ALL">All events</option>
          {allEvents.map((ev) => (
            <option key={ev} value={ev}>
              {EVENT_META[ev]?.label ?? ev}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-[#13131f] border border-white/5 rounded-xl overflow-hidden">
        <div className="grid grid-cols-[1.5rem_11rem_1fr_10rem_5rem_5rem_6.5rem] border-b border-white/5 bg-[#0f0f1a]">
          <div />
          <div className="px-4 py-3 text-xs font-medium text-gray-600 uppercase tracking-wider">Event</div>
          <div className="px-4 py-3 text-xs font-medium text-gray-600 uppercase tracking-wider">Project / File</div>
          <div className="px-4 py-3 text-xs font-medium text-gray-600 uppercase tracking-wider">Sent At</div>
          <div className="px-4 py-3 text-xs font-medium text-gray-600 uppercase tracking-wider text-center">HTTP</div>
          <div className="px-4 py-3 text-xs font-medium text-gray-600 uppercase tracking-wider text-center">Result</div>
          <div className="px-4 py-3 text-xs font-medium text-gray-600 uppercase tracking-wider text-center">Action</div>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-gray-600 text-sm">Loading callbacks…</div>
        ) : filtered?.length === 0 ? (
          <div className="p-8 text-center text-gray-600 text-sm">No callbacks match your filters.</div>
        ) : (
          <div className="divide-y divide-white/5">
            {filtered?.map((cb) => {
              const meta = EVENT_META[cb.event as CallbackEvent] ?? { label: cb.event, color: 'bg-gray-500/10 text-gray-400 border-gray-500/20' }
              const isExpanded = expandedId === cb.id
              const rs = resendState[cb.id] ?? 'idle'

              return (
                <div key={cb.id}>
                  {/* Main row */}
                  <div className="grid grid-cols-[1.5rem_11rem_1fr_10rem_5rem_5rem_6.5rem] hover:bg-white/2 transition-colors items-center">
                    {/* Expand toggle */}
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : cb.id)}
                      className="flex items-center justify-center py-4 text-gray-700 hover:text-gray-400 transition-colors"
                    >
                      {isExpanded
                        ? <ChevronDown className="w-3.5 h-3.5" />
                        : <ChevronRight className="w-3.5 h-3.5" />}
                    </button>

                    {/* Event */}
                    <div className="px-3 py-4">
                      <span className={cn('inline-flex text-xs font-medium px-2 py-0.5 rounded-full border', meta.color)}>
                        {meta.label}
                      </span>
                    </div>

                    {/* Project / file */}
                    <div className="px-4 py-4">
                      <p className="text-sm text-gray-300 truncate">{cb.projectName}</p>
                      {cb.jobFileName && (
                        <p className="text-xs text-gray-600 font-mono truncate mt-0.5">{cb.jobFileName}</p>
                      )}
                    </div>

                    {/* Sent at */}
                    <div className="px-4 py-4 text-xs text-gray-600">
                      {new Date(cb.sentAt).toLocaleString()}
                    </div>

                    {/* HTTP status */}
                    <div className="px-4 py-4 text-center">
                      <span className={cn(
                        'text-xs font-mono font-bold',
                        cb.statusCode >= 200 && cb.statusCode < 300 ? 'text-green-400' : 'text-red-400',
                      )}>
                        {cb.statusCode}
                      </span>
                    </div>

                    {/* Result badge */}
                    <div className="px-4 py-4 text-center">
                      {cb.success ? (
                        <span className="inline-flex items-center gap-1 text-xs text-green-400">
                          <CheckCircle2 className="w-3.5 h-3.5" /> OK
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-red-400">
                          <XCircle className="w-3.5 h-3.5" /> Failed
                        </span>
                      )}
                    </div>

                    {/* Resend */}
                    <div className="px-4 py-4 text-center">
                      <button
                        onClick={() => simulateResend(cb.id, setResendState)}
                        disabled={rs === 'sending'}
                        className={cn(
                          'inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md border transition-all',
                          rs === 'sending' && 'opacity-60 cursor-not-allowed border-white/10 text-gray-500',
                          rs === 'sent'    && 'border-green-500/30 bg-green-500/10 text-green-400',
                          rs === 'error'   && 'border-red-500/30 bg-red-500/10 text-red-400',
                          rs === 'idle'    && 'border-white/10 bg-white/3 text-gray-400 hover:border-[#7c6cfe]/40 hover:text-[#9b8fff]',
                        )}
                      >
                        <RotateCcw className={cn('w-3 h-3', rs === 'sending' && 'animate-spin')} />
                        {rs === 'sending' ? 'Sending…'
                          : rs === 'sent'  ? 'Sent!'
                          : rs === 'error' ? 'Failed'
                          : 'Resend'}
                      </button>
                    </div>
                  </div>

                  {/* Expanded payload */}
                  {isExpanded && (
                    <div className="border-t border-white/5 bg-[#0a0a14] px-8 py-4">
                      <p className="text-xs text-gray-600 mb-2 font-medium uppercase tracking-wider">Payload</p>
                      <pre className="text-xs text-gray-400 font-mono bg-black/30 rounded-lg p-4 overflow-x-auto leading-relaxed border border-white/5">
                        {JSON.stringify(cb.payload, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      <p className="text-xs text-gray-600">{filtered?.length ?? 0} of {callbacks?.length ?? 0} callbacks</p>
    </div>
  )
}
