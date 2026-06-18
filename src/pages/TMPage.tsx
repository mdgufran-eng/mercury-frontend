import { useQuery } from '@tanstack/react-query'
import { getTMEntries } from '@/api/client'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export function TMPage() {
  const { data: entries, isLoading } = useQuery({
    queryKey: ['tm-entries'],
    queryFn: getTMEntries,
  })

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Translation Memory</h1>
        <p className="text-sm text-gray-500 mt-1">Stored segment pairs for reuse across projects</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Loading TM entries…</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="font-semibold text-gray-600">Lang Pair</TableHead>
                <TableHead className="font-semibold text-gray-600 w-[30%]">Source</TableHead>
                <TableHead className="font-semibold text-gray-600 w-[30%]">Target</TableHead>
                <TableHead className="font-semibold text-gray-600 text-center">Match %</TableHead>
                <TableHead className="font-semibold text-gray-600 text-center">Uses</TableHead>
                <TableHead className="font-semibold text-gray-600">Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries?.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell>
                    <Badge variant="secondary">
                      {entry.sourceLang} → {entry.targetLang}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-700 text-sm">{entry.sourceText}</TableCell>
                  <TableCell className="text-gray-700 text-sm">{entry.targetText}</TableCell>
                  <TableCell className="text-center">
                    <span
                      className={`text-xs font-bold ${
                        entry.matchScore === 100 ? 'text-purple-600' : 'text-orange-500'
                      }`}
                    >
                      {entry.matchScore}%
                    </span>
                  </TableCell>
                  <TableCell className="text-center text-gray-600 font-medium">
                    {entry.usageCount}
                  </TableCell>
                  <TableCell className="text-gray-400 text-xs">
                    {new Date(entry.createdAt).toLocaleDateString()}
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
