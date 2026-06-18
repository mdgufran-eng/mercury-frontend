import { useQuery } from '@tanstack/react-query'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, FileText } from 'lucide-react'
import { getProject, getJobs } from '@/api/client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { ProjectStatus, JobStatus } from '@/types'

function statusBadgeVariant(status: ProjectStatus) {
  switch (status) {
    case 'ACTIVE': return 'blue'
    case 'FINISHED': return 'green'
    case 'FAILED': return 'red'
    case 'IN_PROGRESS': return 'yellow'
    case 'CREATED': return 'gray'
  }
}

function jobStatusVariant(status: JobStatus) {
  switch (status) {
    case 'COMPLETED': return 'green'
    case 'IN_PROGRESS': return 'blue'
    case 'PENDING': return 'gray'
    case 'FAILED': return 'red'
  }
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

  if (projectLoading) {
    return <div className="p-8 text-gray-400">Loading project…</div>
  }

  if (!project) {
    return <div className="p-8 text-red-500">Project not found.</div>
  }

  return (
    <div className="p-8 max-w-5xl">
      {/* Back */}
      <div className="mb-5">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/projects" className="flex items-center gap-1.5 text-gray-500">
            <ArrowLeft className="w-4 h-4" />
            Back to Projects
          </Link>
        </Button>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
          <p className="text-sm text-gray-400 font-mono mt-0.5">{project.id}</p>
        </div>
        <Badge variant={statusBadgeVariant(project.status)} className="text-sm px-3 py-1">
          {project.status}
        </Badge>
      </div>

      {/* Project info card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Project Details</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
            <div>
              <dt className="text-gray-400 font-medium">Customer</dt>
              <dd className="text-gray-800 mt-0.5">{project.customerName}</dd>
            </div>
            <div>
              <dt className="text-gray-400 font-medium">Template</dt>
              <dd className="text-gray-800 mt-0.5">{project.templateName}</dd>
            </div>
            <div>
              <dt className="text-gray-400 font-medium">Language Pair</dt>
              <dd className="text-gray-800 mt-0.5 font-semibold">
                {project.sourceLang} → {project.targetLang}
              </dd>
            </div>
            <div>
              <dt className="text-gray-400 font-medium">Method</dt>
              <dd className="mt-0.5">
                <Badge variant={project.method === 'MACHINE' ? 'secondary' : 'outline'}>
                  {project.method}
                </Badge>
              </dd>
            </div>
            <div>
              <dt className="text-gray-400 font-medium">Created</dt>
              <dd className="text-gray-800 mt-0.5">
                {new Date(project.createdAt).toLocaleString()}
              </dd>
            </div>
            <div>
              <dt className="text-gray-400 font-medium">Last Updated</dt>
              <dd className="text-gray-800 mt-0.5">
                {new Date(project.updatedAt).toLocaleString()}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {/* Jobs / Files */}
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <FileText className="w-5 h-5 text-gray-400" />
          Files / Jobs
        </h2>
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          {jobsLoading ? (
            <div className="p-6 text-center text-gray-400 text-sm">Loading jobs…</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-semibold text-gray-600">File</TableHead>
                  <TableHead className="font-semibold text-gray-600">Lang Pair</TableHead>
                  <TableHead className="font-semibold text-gray-600">Status</TableHead>
                  <TableHead className="font-semibold text-gray-600">Method</TableHead>
                  <TableHead className="font-semibold text-gray-600">Words</TableHead>
                  <TableHead className="font-semibold text-gray-600">Segments</TableHead>
                  <TableHead className="font-semibold text-gray-600">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs?.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell className="font-medium text-gray-800">{job.fileName}</TableCell>
                    <TableCell className="text-gray-600">
                      {job.sourceLang} → {job.targetLang}
                    </TableCell>
                    <TableCell>
                      <Badge variant={jobStatusVariant(job.status)}>{job.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={job.method === 'MACHINE' ? 'secondary' : 'outline'}>
                        {job.method}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-600">{job.wordCount.toLocaleString()}</TableCell>
                    <TableCell className="text-gray-600">{job.segmentCount}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" asChild>
                        <Link
                          to={`/projects/${project.id}/jobs/${job.id}/segments`}
                          className="text-indigo-600 hover:text-indigo-800"
                        >
                          View Segments
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </div>
  )
}
