import { useQuery } from '@tanstack/react-query'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { getSegments, getJob, getProject } from '@/api/client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export function SegmentsPage() {
  const { projectId, jobId } = useParams<{ projectId: string; jobId: string }>()

  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => getProject(projectId!),
    enabled: !!projectId,
  })

  const { data: job } = useQuery({
    queryKey: ['job', jobId],
    queryFn: () => getJob(jobId!),
    enabled: !!jobId,
  })

  const { data: segments, isLoading } = useQuery({
    queryKey: ['segments', jobId],
    queryFn: () => getSegments(jobId!),
    enabled: !!jobId,
  })

  return (
    <div className="p-8 max-w-6xl">
      {/* Back */}
      <div className="mb-5">
        <Button variant="ghost" size="sm" asChild>
          <Link to={`/projects/${projectId}`} className="flex items-center gap-1.5 text-gray-500">
            <ArrowLeft className="w-4 h-4" />
            Back to Project
          </Link>
        </Button>
      </div>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {job?.fileName ?? 'Segments'}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {project?.name} · {job?.sourceLang} → {job?.targetLang} ·{' '}
          <span className="font-mono text-xs">{jobId}</span>
        </p>
      </div>

      {/* Segment stats */}
      {segments && (
        <div className="flex gap-4 mb-5 text-sm">
          <span className="text-gray-500">
            Total: <strong className="text-gray-800">{segments.length}</strong>
          </span>
          <span className="text-purple-600">
            ICE: <strong>{segments.filter((s) => s.matchType === 'ICE').length}</strong>
          </span>
          <span className="text-orange-600">
            MT: <strong>{segments.filter((s) => s.matchType === 'MT').length}</strong>
          </span>
        </div>
      )}

      {/* CAT-style table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Loading segments…</div>
        ) : !segments || segments.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">
            No segments available for this job yet.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="w-12 font-semibold text-gray-600 text-center">No.</TableHead>
                <TableHead className="font-semibold text-gray-600 w-[40%]">Source</TableHead>
                <TableHead className="font-semibold text-gray-600 w-[40%]">Target</TableHead>
                <TableHead className="font-semibold text-gray-600 text-center">Match</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {segments.map((segment) => (
                <TableRow key={segment.id} className="align-top">
                  <TableCell className="text-center text-gray-400 font-mono text-xs pt-4">
                    {segment.no}
                  </TableCell>
                  <TableCell className="text-gray-700 text-sm leading-relaxed py-3">
                    {segment.source}
                  </TableCell>
                  <TableCell className="text-gray-700 text-sm leading-relaxed py-3">
                    {segment.target}
                  </TableCell>
                  <TableCell className="text-center py-3">
                    <Badge variant={segment.matchType === 'ICE' ? 'purple' : 'orange'}>
                      {segment.matchType}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  )
}
