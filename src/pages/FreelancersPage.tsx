import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { UserCheck, Search, Plus, Mail, Briefcase } from 'lucide-react'
import { getFreelancers } from '@/api/client'
import { cn } from '@/lib/utils'
import type { Freelancer } from '@/types'

const AVAILABILITY: Record<Freelancer['status'], { dot: string; text: string; bg: string; label: string }> = {
  AVAILABLE: { dot: 'bg-green-500',  text: 'text-green-400',  bg: 'bg-green-500/10',  label: 'Available' },
  BUSY:      { dot: 'bg-yellow-500', text: 'text-yellow-400', bg: 'bg-yellow-500/10', label: 'Busy' },
  OFFLINE:   { dot: 'bg-gray-500',   text: 'text-gray-500',   bg: 'bg-gray-500/10',   label: 'Offline' },
}

function initials(name: string) {
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
}

const AVATAR_COLORS = [
  'bg-teal-500/20 text-teal-300',
  'bg-violet-500/20 text-violet-300',
  'bg-rose-500/20 text-rose-300',
]

export function FreelancersPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | Freelancer['status']>('ALL')

  const { data: freelancers, isLoading } = useQuery({ queryKey: ['freelancers'], queryFn: getFreelancers })

  const filtered = freelancers?.filter((f) => {
    if (statusFilter !== 'ALL' && f.status !== statusFilter) return false
    const q = search.toLowerCase()
    return !q || f.name.toLowerCase().includes(q) || f.email.toLowerCase().includes(q) || f.langs.some((l) => l.toLowerCase().includes(q))
  })

  const availableCount = freelancers?.filter((f) => f.status === 'AVAILABLE').length ?? 0
  const busyCount = freelancers?.filter((f) => f.status === 'BUSY').length ?? 0

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-100 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-[#9b8fff]" /> Freelancers
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Human translators for HUMAN-method projects</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 text-xs">
            <span className="text-green-400">{availableCount} available</span>
            <span className="text-yellow-400">{busyCount} busy</span>
          </div>
          <button className="flex items-center gap-2 px-3 py-2 bg-[#7c6cfe] hover:bg-[#6355e0] text-white text-sm rounded-lg transition-colors">
            <Plus className="w-4 h-4" /> Add Freelancer
          </button>
        </div>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600" />
          <input
            type="text"
            placeholder="Search by name, email or language…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-4 py-2 bg-[#13131f] border border-white/10 rounded-lg text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-[#7c6cfe] transition-colors"
          />
        </div>
        <div className="flex gap-1 bg-[#13131f] border border-white/5 rounded-lg p-1">
          {(['ALL', 'AVAILABLE', 'BUSY', 'OFFLINE'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                'px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                statusFilter === s ? 'bg-[#7c6cfe] text-white' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5',
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-gray-600 text-sm">Loading…</div>
      ) : (
        <div className="grid gap-3">
          {filtered?.map((fl, i) => {
            const av = AVAILABILITY[fl.status]
            const color = AVATAR_COLORS[i % AVATAR_COLORS.length]
            const maxJobs = Math.max(...(freelancers?.map((f) => f.completedJobs) ?? [1]))
            const barPct = Math.round((fl.completedJobs / maxJobs) * 100)

            return (
              <div key={fl.id} className="bg-[#13131f] border border-white/5 rounded-xl p-4 hover:border-white/10 transition-colors">
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <div className={cn('w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold shrink-0', color)}>
                    {initials(fl.name)}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-200">{fl.name}</p>
                      <span className={cn('inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full', av.bg, av.text)}>
                        <span className={cn('w-1.5 h-1.5 rounded-full', av.dot)} />
                        {av.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="flex items-center gap-1 text-xs text-gray-600">
                        <Mail className="w-3 h-3" /> {fl.email}
                      </span>
                    </div>
                  </div>

                  {/* Languages */}
                  <div className="flex gap-1.5 flex-wrap justify-end">
                    {fl.langs.map((lang) => (
                      <span key={lang} className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-white/5 text-gray-400">
                        {lang}
                      </span>
                    ))}
                  </div>

                  {/* Completed jobs */}
                  <div className="w-28 shrink-0">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="flex items-center gap-1 text-gray-600"><Briefcase className="w-3 h-3" /> Jobs</span>
                      <span className="font-semibold text-gray-300">{fl.completedJobs}</span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-[#7c6cfe] rounded-full" style={{ width: `${barPct}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
      {!isLoading && filtered?.length === 0 && (
        <p className="text-center text-gray-600 text-sm py-8">No freelancers match.</p>
      )}
      <p className="text-xs text-gray-600">{filtered?.length ?? 0} freelancers</p>
    </div>
  )
}
