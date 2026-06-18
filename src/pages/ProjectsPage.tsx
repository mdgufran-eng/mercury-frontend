import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { getProjects } from '@/api/client'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { ProjectStatus } from '@/types'

function statusBadgeVariant(status: ProjectStatus) {
  switch (status) {
    case 'ACTIVE': return 'blue'
    case 'FINISHED': return 'green'
    case 'FAILED': return 'red'
    case 'IN_PROGRESS': return 'yellow'
    case 'CREATED': return 'gray'
  }
}

export function ProjectsPage() {
  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: getProjects,
  })

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
        <p className="text-sm text-gray-500 mt-1">All translation projects across customers</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Loading projects…</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="font-semibold text-gray-600">ID</TableHead>
                <TableHead className="font-semibold text-gray-600">Name</TableHead>
                <TableHead className="font-semibold text-gray-600">Customer</TableHead>
                <TableHead className="font-semibold text-gray-600">Lang Pair</TableHead>
                <TableHead className="font-semibold text-gray-600">Status</TableHead>
                <TableHead className="font-semibold text-gray-600">Method</TableHead>
                <TableHead className="font-semibold text-gray-600">Jobs</TableHead>
                <TableHead className="font-semibold text-gray-600">Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects?.map((project) => (
                <TableRow key={project.id} className="cursor-pointer">
                  <TableCell className="font-mono text-xs text-gray-400">{project.id}</TableCell>
                  <TableCell>
                    <Link
                      to={`/projects/${project.id}`}
                      className="font-medium text-indigo-600 hover:text-indigo-800 hover:underline"
                    >
                      {project.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-gray-600">{project.customerName}</TableCell>
                  <TableCell>
                    <span className="text-sm font-medium text-gray-700">
                      {project.sourceLang} → {project.targetLang}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusBadgeVariant(project.status)}>{project.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={project.method === 'MACHINE' ? 'secondary' : 'outline'}>
                      {project.method}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-600">{project.jobCount}</TableCell>
                  <TableCell className="text-gray-500 text-xs">
                    {new Date(project.createdAt).toLocaleDateString()}
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
