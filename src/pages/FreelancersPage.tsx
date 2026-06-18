import { useQuery } from '@tanstack/react-query'
import { getFreelancers } from '@/api/client'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { Freelancer } from '@/types'

function availabilityVariant(status: Freelancer['status']) {
  switch (status) {
    case 'AVAILABLE': return 'green'
    case 'BUSY': return 'yellow'
    case 'OFFLINE': return 'gray'
  }
}

export function FreelancersPage() {
  const { data: freelancers, isLoading } = useQuery({
    queryKey: ['freelancers'],
    queryFn: getFreelancers,
  })

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Freelancers</h1>
        <p className="text-sm text-gray-500 mt-1">Human translators available for projects</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Loading freelancers…</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="font-semibold text-gray-600">ID</TableHead>
                <TableHead className="font-semibold text-gray-600">Name</TableHead>
                <TableHead className="font-semibold text-gray-600">Email</TableHead>
                <TableHead className="font-semibold text-gray-600">Languages</TableHead>
                <TableHead className="font-semibold text-gray-600">Status</TableHead>
                <TableHead className="font-semibold text-gray-600 text-right">Completed Jobs</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {freelancers?.map((fl) => (
                <TableRow key={fl.id}>
                  <TableCell className="font-mono text-xs text-gray-400">{fl.id}</TableCell>
                  <TableCell className="font-medium text-gray-800">{fl.name}</TableCell>
                  <TableCell className="text-gray-500 text-sm">{fl.email}</TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {fl.langs.map((lang) => (
                        <Badge key={lang} variant="secondary" className="text-xs">
                          {lang}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={availabilityVariant(fl.status)}>{fl.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right text-gray-700 font-medium">
                    {fl.completedJobs}
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
