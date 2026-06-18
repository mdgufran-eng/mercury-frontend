import { useQuery } from '@tanstack/react-query'
import { getTemplates } from '@/api/client'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export function TemplatesPage() {
  const { data: templates, isLoading } = useQuery({
    queryKey: ['templates'],
    queryFn: getTemplates,
  })

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Templates</h1>
        <p className="text-sm text-gray-500 mt-1">Project configuration templates</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Loading templates…</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="font-semibold text-gray-600">ID</TableHead>
                <TableHead className="font-semibold text-gray-600">Name</TableHead>
                <TableHead className="font-semibold text-gray-600">Source</TableHead>
                <TableHead className="font-semibold text-gray-600">Target</TableHead>
                <TableHead className="font-semibold text-gray-600">Method</TableHead>
                <TableHead className="font-semibold text-gray-600">Description</TableHead>
                <TableHead className="font-semibold text-gray-600">Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates?.map((template) => (
                <TableRow key={template.id}>
                  <TableCell className="font-mono text-xs text-gray-400">{template.id}</TableCell>
                  <TableCell className="font-medium text-gray-800">{template.name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{template.sourceLang}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{template.targetLang}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={template.method === 'MACHINE' ? 'secondary' : 'outline'}>
                      {template.method}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-500 text-sm max-w-xs truncate">
                    {template.description}
                  </TableCell>
                  <TableCell className="text-gray-400 text-xs">
                    {new Date(template.createdAt).toLocaleDateString()}
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
