import { useQuery } from '@tanstack/react-query'
import { getTemplates } from '@/api/client'

export function TemplatesPage() {
  const { data: templates = [], isLoading } = useQuery({ queryKey: ['templates'], queryFn: getTemplates })

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-xl font-semibold text-gray-100 mb-6">Templates</h1>
      {isLoading ? (
        <p className="text-gray-500 text-sm">Loading…</p>
      ) : templates.length === 0 ? (
        <p className="text-gray-500 text-sm">No templates found.</p>
      ) : (
        <div className="space-y-2">
          {templates.map((t: Record<string, unknown>) => (
            <div key={String(t['templateId'])} className="bg-[#13131f] border border-white/5 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-200">{String(t['name'] ?? '')}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {String(t['sourceLanguage'] ?? '')} → {String(t['targetLanguage'] ?? '')} · {String(t['method'] ?? '')}
                  </p>
                </div>
                <span className="text-xs text-gray-600 font-mono">{String(t['templateId'] ?? '')}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
