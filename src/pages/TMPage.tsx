import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { BookOpen, Search, Brain, TrendingUp, Hash, Upload } from 'lucide-react'
import { getTMEntries } from '@/api/client'
import { cn } from '@/lib/utils'

export function TMPage() {
  const [search, setSearch] = useState('')
  const [langFilter, setLangFilter] = useState('ALL')
  const [matchFilter, setMatchFilter] = useState<'ALL' | '100' | 'PARTIAL'>('ALL')

  const { data: entries, isLoading } = useQuery({ queryKey: ['tm-entries'], queryFn: getTMEntries })

  const langPairs = Array.from(
    new Set(entries?.map((e) => `${e.sourceLang}→${e.targetLang}`) ?? [])
  )

  const filtered = entries?.filter((e) => {
    const pair = `${e.sourceLang}→${e.targetLang}`
    if (langFilter !== 'ALL' && pair !== langFilter) return false
    if (matchFilter === '100' && e.matchScore !== 100) return false
    if (matchFilter === 'PARTIAL' && e.matchScore === 100) return false
    const q = search.toLowerCase()
    return !q || e.sourceText.toLowerCase().includes(q) || e.targetText.toLowerCase().includes(q)
  })

  const totalEntries = entries?.length ?? 0
  const exactCount = entries?.filter((e) => e.matchScore === 100).length ?? 0
  const totalUsage = entries?.reduce((s, e) => s + e.usageCount, 0) ?? 0
  const maxUsage = Math.max(...(entries?.map((e) => e.usageCount) ?? [1]))

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-100 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-400" /> Translation Memory
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Stored segment pairs — reused across projects to avoid re-translation</p>
        </div>
        <button className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 text-gray-300 text-sm rounded-lg border border-white/10 transition-colors">
          <Upload className="w-4 h-4" /> Import TMX
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-[#13131f] border border-white/5 rounded-xl p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-500/10 flex items-center justify-center shrink-0">
            <Hash className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <p className="text-xl font-semibold text-gray-100">{totalEntries}</p>
            <p className="text-xs text-gray-600">Total entries</p>
          </div>
        </div>
        <div className="bg-[#13131f] border border-white/5 rounded-xl p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
            <Brain className="w-4 h-4 text-purple-400" />
          </div>
          <div>
            <p className="text-xl font-semibold text-gray-100">{exactCount}</p>
            <p className="text-xs text-gray-600">100% exact matches</p>
          </div>
        </div>
        <div className="bg-[#13131f] border border-white/5 rounded-xl p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
            <TrendingUp className="w-4 h-4 text-green-400" />
          </div>
          <div>
            <p className="text-xl font-semibold text-gray-100">{totalUsage}</p>
            <p className="text-xs text-gray-600">Total leveraged uses</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600" />
          <input
            type="text"
            placeholder="Search source or target text…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-4 py-2 bg-[#13131f] border border-white/10 rounded-lg text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        <select
          value={langFilter}
          onChange={(e) => setLangFilter(e.target.value)}
          className="px-3 py-2 bg-[#13131f] border border-white/10 rounded-lg text-xs text-gray-400 focus:outline-none focus:border-indigo-500 transition-colors"
        >
          <option value="ALL">All lang pairs</option>
          {langPairs.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>

        <div className="flex gap-1 bg-[#13131f] border border-white/5 rounded-lg p-1">
          {([['ALL', 'All'], ['100', '100% only'], ['PARTIAL', 'Partial']] as const).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setMatchFilter(id)}
              className={cn(
                'px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                matchFilter === id ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* TM table */}
      <div className="bg-[#13131f] border border-white/5 rounded-xl overflow-hidden">
        <div className="grid grid-cols-[6rem_1fr_1fr_5rem_7rem] border-b border-white/5 bg-[#0f0f1a]">
          <div className="px-4 py-3 text-xs font-medium text-gray-600 uppercase tracking-wider">Pair</div>
          <div className="px-4 py-3 text-xs font-medium text-gray-600 uppercase tracking-wider">Source</div>
          <div className="px-4 py-3 text-xs font-medium text-gray-600 uppercase tracking-wider">Target</div>
          <div className="px-4 py-3 text-xs font-medium text-gray-600 uppercase tracking-wider text-center">Match</div>
          <div className="px-4 py-3 text-xs font-medium text-gray-600 uppercase tracking-wider">Usage</div>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-gray-600 text-sm">Loading TM…</div>
        ) : filtered?.length === 0 ? (
          <div className="p-8 text-center text-gray-600 text-sm">No entries match your filters.</div>
        ) : (
          <div className="divide-y divide-white/5">
            {filtered?.map((entry) => {
              const isExact = entry.matchScore === 100
              const usagePct = Math.round((entry.usageCount / maxUsage) * 100)

              return (
                <div key={entry.id} className="grid grid-cols-[6rem_1fr_1fr_5rem_7rem] hover:bg-white/2 transition-colors items-start py-3">
                  {/* Lang pair */}
                  <div className="px-4">
                    <span className="font-mono text-xs font-semibold text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded">
                      {entry.sourceLang}→{entry.targetLang}
                    </span>
                  </div>

                  {/* Source */}
                  <div className="px-4">
                    <p className="text-sm text-gray-300 leading-relaxed">{entry.sourceText}</p>
                  </div>

                  {/* Target */}
                  <div className="px-4">
                    <p className="text-sm text-gray-400 leading-relaxed">{entry.targetText}</p>
                  </div>

                  {/* Match score */}
                  <div className="px-4 text-center">
                    <span className={cn(
                      'inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full',
                      isExact
                        ? 'bg-purple-500/15 text-purple-300 border border-purple-500/20'
                        : 'bg-orange-500/15 text-orange-300 border border-orange-500/20',
                    )}>
                      {isExact && <Brain className="w-2.5 h-2.5" />}
                      {entry.matchScore}%
                    </span>
                  </div>

                  {/* Usage bar */}
                  <div className="px-4">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-600">used</span>
                      <span className="text-gray-400 font-medium">{entry.usageCount}×</span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className={cn('h-full rounded-full', isExact ? 'bg-purple-500' : 'bg-orange-500')}
                        style={{ width: `${usagePct}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-700 mt-0.5">{new Date(entry.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <p className="text-xs text-gray-600">{filtered?.length ?? 0} of {totalEntries} TM entries</p>
    </div>
  )
}
