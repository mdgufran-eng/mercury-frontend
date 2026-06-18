import { useQuery } from '@tanstack/react-query'
import { getCallbacks } from '@/api/client'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { CallbackEvent } from '@/types'

function eventBadgeVariant(event: CallbackEvent) {
  switch (event) {
    case 'project-created': return 'blue'
    case 'project-completion': return 'green'
    case 'job-finished': return 'yellow'
  }
}

export function CallbacksPage() {
  const { data: callbacks, isLoading } = useQuery({
    queryKey: ['callbacks'],
    queryFn: getCallbacks,
  })

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Callbacks</h1>
        <p className="text-sm text-gray-500 mt-1">Webhook delivery log for all project and job events</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Loading callbacks…</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="font-semibold text-gray-600">Event</TableHead>
                <TableHead className="font-semibold text-gray-600">Project</TableHead>
                <TableHead className="font-semibold text-gray-600">File</TableHead>
                <TableHead className="font-semibold text-gray-600">Sent At</TableHead>
                <TableHead className="font-semibold text-gray-600 text-center">HTTP</TableHead>
                <TableHead className="font-semibold text-gray-600 text-center">Result</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {callbacks?.map((cb) => (
                <TableRow key={cb.id}>
                  <TableCell>
                    <Badge variant={eventBadgeVariant(cb.event)}>{cb.event}</Badge>
                  </TableCell>
                  <TableCell className="text-gray-700 text-sm">{cb.projectName}</TableCell>
                  <TableCell className="text-gray-500 text-sm font-mono text-xs">
                    {cb.jobFileName ?? '—'}
                  </TableCell>
                  <TableCell className="text-gray-500 text-xs">
                    {new Date(cb.sentAt).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-center">
                    <span
                      className={`text-xs font-mono font-semibold ${
                        cb.statusCode >= 200 && cb.statusCode < 300
                          ? 'text-green-600'
                          : 'text-red-500'
                      }`}
                    >
                      {cb.statusCode}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={cb.success ? 'green' : 'red'}>
                      {cb.success ? 'OK' : 'FAILED'}
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
