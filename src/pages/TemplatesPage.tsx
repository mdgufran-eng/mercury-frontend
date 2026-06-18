import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { FileText, Search, Plus, Cpu, User } from 'lucide-react'
import { getTemplates, getProjects } from '@/api/client'
import { cn } from '@/lib/utils'

export function TemplatesPage() {
  const [search, setSearch] = useState('')
  const [methodFilter, setMethodFilter] = useState<'ALL' | 'MACHINE' | 'HUMAN'>('ALL')

  const { data: templates, isLoading } = useQuery({ queryKey: ['templates'], queryFn: getTemplates })
  const { data: projects } = useQuery({ queryKey: ['projects'], queryFn: getProjects })

  const filtered = templates?.filter((t) => {
    if (methodFilter !== 'ALL' && t.method !== methodFilter) return false
    const q = search.toLowerCase()
    return !q || t.name.toLowerCase().includes(q) || t.sourceLang.toLowerCase().includes(q) || t.targetLang.toLowerCase().includes(q)
  })

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-100 flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#9b8fff]" /> Templates
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Project configuration templates (templateId encodes lang + workflow)</p>
        </div>
        <button className="flex items-center gap-2 px-3 py-2 bg-[#7c6cfe] hover:bg-[#6355e0] text-white text-sm rounded-lg transition-colors">
          <Plus className="w-4 h-4" /> New Template
        </button>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600" />
          <input
            type="text"
            placeholder="Search templates…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-4 py-2 bg-[#13131f] border border-white/10 rounded-lg text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-[#7c6cfe] transition-colors"
          />
        </div>
        <div className="flex gap-1 bg-[#13131f] border border-white/5 rounded-lg p-1">
          {(['ALL', 'MACHINE', 'HUMAN'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMethodFilter(m)}
              className={cn(
                'px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                methodFilter === m ? 'bg-[#7c6cfe] text-white' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5',
              )}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-[#13131f] border border-white/5 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5 bg-[#0f0f1a]">
              <th className="text-left px-5 py-3 text-xs font-medium text-gray-600 uppercase tracking-wider">Template</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-600 uppercase tracking-wider">Lang Pair</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-600 uppercase tracking-wider">Method</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-600 uppercase tracking-wider">Description</th>
              <th className="text-center px-4 py-3 text-xs font-medium text-gray-600 uppercase tracking-wider">Projects</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-600 uppercase tracking-wider">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {isLoading && (
              <tr><td colSpan={6} className="px-5 py-8 text-center text-gray-600 text-sm">Loading…</td></tr>
            )}
            {filtered?.map((t) => {
              const projectCount = projects?.filter((p) => p.templateId === t.id).length ?? 0
              return (
                <tr key={t.id} className="hover:bg-white/2 transition-colors">
                  <td className="px-5 py-3">
                    <p className="font-medium text-gray-200">{t.name}</p>
                    <p className="text-xs text-gray-600 font-mono mt-0.5">{t.id}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs font-semibold text-[#b3a9ff] bg-[#7c6cfe]/10 px-2 py-0.5 rounded">
                      {t.sourceLang} → {t.targetLang}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      'inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full',
                      t.method === 'MACHINE'
                        ? 'bg-blue-500/10 text-blue-400'
                        : 'bg-amber-500/10 text-amber-400',
                    )}>
                      {t.method === 'MACHINE' ? <Cpu className="w-3 h-3" /> : <User className="w-3 h-3" />}
                      {t.method}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 max-w-xs truncate">{t.description}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-sm font-semibold text-gray-300">{projectCount}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600">{new Date(t.createdAt).toLocaleDateString()}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {!isLoading && filtered?.length === 0 && (
          <p className="px-5 py-8 text-center text-gray-600 text-sm">No templates match.</p>
        )}
      </div>
      <p className="text-xs text-gray-600">{filtered?.length ?? 0} templates</p>
    </div>
  )
}
