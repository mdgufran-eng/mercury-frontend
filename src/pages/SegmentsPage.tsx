import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, Link } from 'react-router-dom'
import { useState, useRef, useEffect } from 'react'
import {
  ArrowLeft,
  CheckCircle2,
  Lock,
  Pencil,
  X,
  Check,
  Brain,
  Cpu,
  Filter,
  FlagTriangleRight,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import { getSegments, getJob, getProject, updateSegment, approveSegment, completeJob } from '@/api/client'
import { cn } from '@/lib/utils'
import type { Segment } from '@/types'

type FilterTab = 'ALL' | 'ICE' | 'MT' | 'PENDING' | 'TRANSLATED' | 'APPROVED'

interface SegmentState {
  target: string
  approved: boolean
  locked: boolean
  editing: boolean
  draft: string
  saving: boolean
  approving: boolean
  error: string | null
}

function buildInitialState(segments: Segment[]): Record<string, SegmentState> {
  const map: Record<string, SegmentState> = {}
  for (const s of segments) {
    map[s.id] = {
      target: s.target ?? '',
      approved: s.status === 'CONFIRMED',
      locked: s.status === 'CONFIRMED',
      editing: false,
      draft: s.target ?? '',
      saving: false,
      approving: false,
      error: null,
    }
  }
  return map
}

export function SegmentsPage() {
  const { projectId, jobId } = useParams<{ projectId: string; jobId: string }>()
  const [filter, setFilter] = useState<FilterTab>('ALL')
  const [segState, setSegState] = useState<Record<string, SegmentState>>({})
  const [completeError, setCompleteError] = useState<string | null>(null)
  const textareaRefs = useRef<Record<string, HTMLTextAreaElement | null>>({})
  const qc = useQueryClient()

  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => getProject(projectId!),
    enabled: !!projectId,
  })

  const { data: job, refetch: refetchJob } = useQuery({
    queryKey: ['job', jobId],
    queryFn: () => getJob(jobId!),
    enabled: !!jobId,
  })

  const { data: segments, isLoading, refetch: refetchSegments } = useQuery({
    queryKey: ['segments', jobId],
    queryFn: () => getSegments(projectId!, jobId!),
    enabled: !!jobId && !!projectId,
  })

  useEffect(() => {
    if (segments && Object.keys(segState).length === 0) {
      setSegState(buildInitialState(segments))
    }
  }, [segments])

  const isHuman = project?.method === 'HUMAN'
  const isJobComplete = job?.status === 'COMPLETED'

  // ── Complete job mutation ─────────────────────────────────────────────────
  const completeMutation = useMutation({
    mutationFn: () => completeJob(projectId!, jobId!),
    onSuccess: () => {
      setCompleteError(null)
      refetchJob()
      qc.invalidateQueries({ queryKey: ['project', projectId] })
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
      setCompleteError(msg ?? 'Failed to complete job')
    },
  })

  // ── Segment edit & approve ─────────────────────────────────────────────────
  function startEdit(id: string) {
    setSegState((prev) => {
      const s = prev[id]
      if (!s || s.locked) return prev
      return { ...prev, [id]: { ...s, editing: true, draft: s.target } }
    })
    setTimeout(() => textareaRefs.current[id]?.focus(), 50)
  }

  function cancelEdit(id: string) {
    setSegState((prev) => {
      const s = prev[id]
      if (!s) return prev
      return { ...prev, [id]: { ...s, editing: false, draft: s.target, error: null } }
    })
  }

  async function saveEdit(id: string, segmentId: string) {
    const draft = segState[id]?.draft ?? ''
    setSegState((prev) => ({ ...prev, [id]: { ...prev[id], saving: true, error: null } }))
    try {
      await updateSegment(projectId!, segmentId, draft)
      setSegState((prev) => ({
        ...prev,
        [id]: { ...prev[id], editing: false, target: draft, saving: false },
      }))
    } catch {
      setSegState((prev) => ({
        ...prev,
        [id]: { ...prev[id], saving: false, error: 'Save failed — try again' },
      }))
    }
  }

  async function handleApprove(id: string, segmentId: string) {
    const s = segState[id]
    if (!s || s.approved) return
    if (!s.target.trim()) {
      setSegState((prev) => ({ ...prev, [id]: { ...prev[id], error: 'Add a translation first' } }))
      return
    }
    setSegState((prev) => ({ ...prev, [id]: { ...prev[id], approving: true, error: null } }))
    try {
      await approveSegment(projectId!, segmentId)
      setSegState((prev) => ({
        ...prev,
        [id]: { ...prev[id], approving: false, approved: true, locked: true },
      }))
    } catch (err: unknown) {
      const apiErrors = (err as { response?: { data?: { errors?: { message: string }[] } } })
        ?.response?.data?.errors
      const msg = apiErrors?.[0]?.message ?? 'Approve failed'
      setSegState((prev) => ({ ...prev, [id]: { ...prev[id], approving: false, error: msg } }))
    }
  }

  // ── Filter tabs ────────────────────────────────────────────────────────────
  const iceCount = segments?.filter((s) => s.matchType === 'ICE').length ?? 0
  const mtCount = segments?.filter((s) => s.matchType === 'MT').length ?? 0
  const pendingCount = segments?.filter((s) => !segState[s.id]?.target.trim()).length ?? 0
  const translatedCount = segments?.filter(
    (s) => segState[s.id]?.target.trim() && !segState[s.id]?.approved,
  ).length ?? 0
  const approvedCount = Object.values(segState).filter((s) => s.approved).length

  const machineTabs: { id: FilterTab; label: string; count: number }[] = [
    { id: 'ALL', label: 'All', count: segments?.length ?? 0 },
    { id: 'ICE', label: 'ICE', count: iceCount },
    { id: 'MT', label: 'MT', count: mtCount },
  ]

  const humanTabs: { id: FilterTab; label: string; count: number }[] = [
    { id: 'ALL', label: 'All', count: segments?.length ?? 0 },
    { id: 'PENDING', label: 'Pending', count: pendingCount },
    { id: 'TRANSLATED', label: 'Translated', count: translatedCount },
    { id: 'APPROVED', label: 'Approved', count: approvedCount },
  ]

  const tabs = isHuman ? humanTabs : machineTabs

  const filtered = segments?.filter((s) => {
    const ss = segState[s.id]
    if (filter === 'ICE') return s.matchType === 'ICE'
    if (filter === 'MT') return s.matchType === 'MT'
    if (filter === 'PENDING') return !ss?.target.trim()
    if (filter === 'TRANSLATED') return ss?.target.trim() && !ss?.approved
    if (filter === 'APPROVED') return ss?.approved
    return true
  })

  const allTranslated = segments?.every((s) => segState[s.id]?.target.trim()) ?? false

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link to="/projects" className="hover:text-[#9b8fff] transition-colors">Projects</Link>
        <span>/</span>
        <Link to={`/projects/${projectId}`} className="hover:text-[#9b8fff] transition-colors flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" />
          {project?.name ?? 'Project'}
        </Link>
        <span>/</span>
        <span className="text-gray-400 truncate max-w-xs">{job?.fileName ?? 'Segments'}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-100">{job?.fileName ?? 'Segment Viewer'}</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {project?.name} ·{' '}
            <span className="font-mono text-[#9b8fff]">
              {job?.sourceLang} → {job?.targetLang}
            </span>{' '}
            · {job?.wordCount?.toLocaleString()} words
            {isHuman && (
              <span className="ml-2 px-1.5 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded text-xs">
                HUMAN
              </span>
            )}
          </p>
        </div>

        {/* Mark Complete button — HUMAN projects only */}
        {isHuman && !isJobComplete && (
          <div className="flex flex-col items-end gap-1">
            <button
              onClick={() => { setCompleteError(null); completeMutation.mutate() }}
              disabled={!allTranslated || completeMutation.isPending}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                allTranslated && !completeMutation.isPending
                  ? 'bg-green-600 hover:bg-green-500 text-white'
                  : 'bg-white/5 text-gray-600 cursor-not-allowed',
              )}
              title={!allTranslated ? 'All segments must have a translation first' : undefined}
            >
              {completeMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FlagTriangleRight className="w-4 h-4" />
              )}
              Mark Job Complete
            </button>
            {!allTranslated && (
              <p className="text-xs text-gray-600">{pendingCount} segment(s) still need translation</p>
            )}
            {completeError && (
              <p className="text-xs text-red-400 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {completeError}
              </p>
            )}
          </div>
        )}

        {isHuman && isJobComplete && (
          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 text-green-400 border border-green-500/20 rounded-lg text-sm font-medium">
            <CheckCircle2 className="w-4 h-4" /> Job Complete
          </span>
        )}
      </div>

      {/* Stats row */}
      <div className="flex flex-wrap items-center gap-3">
        {isHuman ? (
          <>
            <StatPill icon={<Filter className="w-3.5 h-3.5" />} label="Pending" count={pendingCount} colorClass="bg-gray-500/10 text-gray-400 border-gray-500/20" />
            <StatPill icon={<Pencil className="w-3.5 h-3.5" />} label="Translated" count={translatedCount} colorClass="bg-blue-500/10 text-blue-400 border-blue-500/20" />
            <StatPill icon={<CheckCircle2 className="w-3.5 h-3.5" />} label="Approved" count={approvedCount} colorClass="bg-green-500/10 text-green-400 border-green-500/20" />
          </>
        ) : (
          <>
            <StatPill icon={<Brain className="w-3.5 h-3.5" />} label="ICE" count={iceCount} colorClass="bg-purple-500/10 text-purple-400 border-purple-500/20" />
            <StatPill icon={<Cpu className="w-3.5 h-3.5" />} label="MT" count={mtCount} colorClass="bg-orange-500/10 text-orange-400 border-orange-500/20" />
            <StatPill icon={<CheckCircle2 className="w-3.5 h-3.5" />} label="Approved" count={approvedCount} colorClass="bg-green-500/10 text-green-400 border-green-500/20" />
          </>
        )}
        <div className="ml-auto flex items-center gap-1.5 text-xs text-gray-600">
          <Filter className="w-3.5 h-3.5" />
          {approvedCount}/{segments?.length ?? 0} approved
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-[#13131f] border border-white/5 rounded-lg p-1 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={cn(
              'px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5',
              filter === tab.id
                ? 'bg-[#7c6cfe] text-white'
                : 'text-gray-500 hover:text-gray-300 hover:bg-white/5',
            )}
          >
            {tab.label}
            <span className={cn(
              'text-xs rounded-full px-1.5 py-0 leading-4',
              filter === tab.id ? 'bg-white/20 text-white' : 'bg-white/5 text-gray-600',
            )}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* CAT table */}
      <div className="bg-[#13131f] border border-white/5 rounded-xl overflow-hidden">
        <div className="grid grid-cols-[3rem_1fr_1fr_8rem] border-b border-white/5 bg-[#0f0f1a]">
          <div className="px-4 py-3 text-xs font-medium text-gray-600 uppercase tracking-wider text-center">No.</div>
          <div className="px-4 py-3 text-xs font-medium text-gray-600 uppercase tracking-wider">Source</div>
          <div className="px-4 py-3 text-xs font-medium text-gray-600 uppercase tracking-wider">Target</div>
          <div className="px-4 py-3 text-xs font-medium text-gray-600 uppercase tracking-wider text-center">Status</div>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-gray-600 text-sm">Loading segments…</div>
        ) : !filtered || filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-600 text-sm">No segments match this filter.</div>
        ) : (
          <div className="divide-y divide-white/5">
            {filtered.map((seg) => {
              const ss = segState[seg.id]
              const isICE = seg.matchType === 'ICE'
              const isApproved = ss?.approved ?? false
              const isLocked = ss?.locked ?? false
              const isEditing = ss?.editing ?? false
              const hasTarget = !!ss?.target.trim()

              const borderColor = isApproved
                ? 'border-green-500/40'
                : isHuman
                ? hasTarget
                  ? 'border-blue-500/30'
                  : 'border-gray-700/40'
                : isICE
                ? 'border-[#7c6cfe]/40'
                : 'border-[#f59e0b]/30'

              return (
                <div
                  key={seg.id}
                  className={cn(
                    'grid grid-cols-[3rem_1fr_1fr_8rem] group transition-colors border-l-2',
                    isApproved ? 'bg-green-500/3' : 'hover:bg-white/2',
                    borderColor,
                  )}
                >
                  {/* No. */}
                  <div className="px-3 py-4 flex items-start justify-center">
                    <span className="text-xs font-mono text-gray-600">{seg.no}</span>
                  </div>

                  {/* Source */}
                  <div className="px-4 py-4">
                    <p className="text-sm text-gray-300 leading-relaxed">{seg.source}</p>
                  </div>

                  {/* Target */}
                  <div className="px-4 py-4">
                    {isEditing ? (
                      <div className="space-y-2">
                        <textarea
                          ref={(el) => { textareaRefs.current[seg.id] = el }}
                          value={ss?.draft ?? ''}
                          onChange={(e) =>
                            setSegState((prev) => ({
                              ...prev,
                              [seg.id]: { ...prev[seg.id], draft: e.target.value },
                            }))
                          }
                          rows={3}
                          className="w-full bg-[#0a0a14] border border-[#7c6cfe]/50 rounded-md px-3 py-2 text-sm text-gray-200 leading-relaxed resize-none focus:outline-none focus:border-[#9b8fff] transition-colors"
                        />
                        {ss?.error && (
                          <p className="text-xs text-red-400 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> {ss.error}
                          </p>
                        )}
                        <div className="flex gap-2">
                          <button
                            onClick={() => saveEdit(seg.id, seg.id)}
                            disabled={ss?.saving}
                            className="flex items-center gap-1 px-2.5 py-1 bg-[#7c6cfe] hover:bg-[#6355e0] text-white text-xs rounded-md transition-colors disabled:opacity-50"
                          >
                            {ss?.saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                            Save
                          </button>
                          <button
                            onClick={() => cancelEdit(seg.id)}
                            className="flex items-center gap-1 px-2.5 py-1 bg-white/5 hover:bg-white/10 text-gray-400 text-xs rounded-md transition-colors"
                          >
                            <X className="w-3 h-3" /> Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start gap-2 group/target">
                        {hasTarget ? (
                          <p className={cn('text-sm leading-relaxed flex-1', isLocked ? 'text-gray-500' : 'text-gray-200')}>
                            {ss?.target}
                          </p>
                        ) : (
                          <p className="text-sm leading-relaxed flex-1 text-gray-600 italic">
                            {isHuman ? 'Click edit to add translation…' : '—'}
                          </p>
                        )}
                        {!isLocked && !isJobComplete && (
                          <button
                            onClick={() => startEdit(seg.id)}
                            className="opacity-0 group-hover/target:opacity-100 p-1 rounded hover:bg-white/10 text-gray-600 hover:text-gray-400 transition-all shrink-0 mt-0.5"
                            title="Edit target"
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Status col */}
                  <div className="px-3 py-4 flex flex-col items-center gap-2">
                    {/* Match / state badge */}
                    {isHuman ? (
                      <span className={cn(
                        'inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full',
                        isApproved
                          ? 'bg-green-500/15 text-green-400 border border-green-500/20'
                          : hasTarget
                          ? 'bg-blue-500/15 text-blue-400 border border-blue-500/20'
                          : 'bg-gray-500/15 text-gray-500 border border-gray-500/20',
                      )}>
                        {isApproved ? 'APPROVED' : hasTarget ? 'TRANSLATED' : 'PENDING'}
                      </span>
                    ) : (
                      <span className={cn(
                        'inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full',
                        isICE
                          ? 'bg-[#7c6cfe]/15 text-[#9b8fff] border border-[#7c6cfe]/20'
                          : 'bg-amber-500/15 text-amber-300 border border-amber-500/20',
                      )}>
                        {isICE ? <Brain className="w-2.5 h-2.5" /> : <Cpu className="w-2.5 h-2.5" />}
                        {seg.matchType}
                      </span>
                    )}

                    {/* Approve button */}
                    {ss?.error && !isEditing && (
                      <p className="text-xs text-red-400 text-center">{ss.error}</p>
                    )}
                    {isLocked ? (
                      <span className="flex items-center gap-1 text-xs text-green-400">
                        <Lock className="w-3.5 h-3.5" />
                      </span>
                    ) : !isJobComplete && (
                      <button
                        onClick={() => handleApprove(seg.id, seg.id)}
                        disabled={ss?.approving || !hasTarget}
                        className={cn(
                          'flex items-center gap-1 text-xs px-2 py-0.5 rounded-md border transition-colors disabled:opacity-40 disabled:cursor-not-allowed',
                          isApproved
                            ? 'border-green-500/30 bg-green-500/10 text-green-400'
                            : 'border-white/10 bg-white/3 text-gray-600 hover:border-[#7c6cfe]/40 hover:text-[#9b8fff]',
                        )}
                        title={!hasTarget ? 'Add a translation first' : 'Approve segment'}
                      >
                        {ss?.approving
                          ? <Loader2 className="w-3 h-3 animate-spin" />
                          : <CheckCircle2 className="w-3 h-3" />}
                        {isApproved ? 'Approved' : 'Approve'}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <p className="text-xs text-gray-600">
        Showing {filtered?.length ?? 0} of {segments?.length ?? 0} segments
        {!isHuman && ' · Approve a segment to write it to Translation Memory'}
      </p>
    </div>
  )
}

function StatPill({
  icon, label, count, colorClass,
}: {
  icon: React.ReactNode
  label: string
  count: number
  colorClass: string
}) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border', colorClass)}>
      {icon}
      {label}
      <span className="font-semibold">{count}</span>
    </span>
  )
}
