import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Users, Search, Building2, Mail, Plus } from 'lucide-react'
import { getCustomers, getProjects } from '@/api/client'
import { cn } from '@/lib/utils'

function initials(name: string) {
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
}

const AVATAR_COLORS = [
  'bg-[#7c6cfe]/20 text-[#b3a9ff]',
  'bg-purple-500/20 text-purple-300',
  'bg-blue-500/20 text-blue-300',
  'bg-emerald-500/20 text-emerald-300',
]

export function CustomersPage() {
  const [search, setSearch] = useState('')

  const { data: customers, isLoading } = useQuery({ queryKey: ['customers'], queryFn: getCustomers })
  const { data: projects } = useQuery({ queryKey: ['projects'], queryFn: getProjects })

  const filtered = customers?.filter((c) => {
    const q = search.toLowerCase()
    return !q || c.name.toLowerCase().includes(q) || c.company.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)
  })

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-[#9b8fff]" /> Customers
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Registered customer accounts</p>
        </div>
        <button className="flex items-center gap-2 px-3 py-2 bg-[#7c6cfe] hover:bg-[#6355e0] text-white text-sm rounded-lg transition-colors">
          <Plus className="w-4 h-4" /> Add Customer
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600" />
        <input
          type="text"
          placeholder="Search by name, company or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-8 pr-4 py-2 bg-[#13131f] border border-white/10 rounded-lg text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-[#7c6cfe] transition-colors"
        />
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-gray-600 text-sm">Loading…</div>
      ) : (
        <div className="grid gap-3">
          {filtered?.map((customer, i) => {
            const projectCount = projects?.filter((p) => p.customerId === customer.id).length ?? 0
            const color = AVATAR_COLORS[i % AVATAR_COLORS.length]
            return (
              <div key={customer.id} className="bg-[#13131f] border border-white/5 rounded-xl p-4 flex items-center gap-4 hover:border-white/10 transition-colors">
                {/* Avatar */}
                <div className={cn('w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold shrink-0', color)}>
                  {initials(customer.name)}
                </div>

                {/* Main info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-200">{customer.name}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <Building2 className="w-3 h-3" /> {customer.company}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-gray-600">
                      <Mail className="w-3 h-3" /> {customer.email}
                    </span>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-6 shrink-0 text-right">
                  <div>
                    <p className="text-lg font-semibold text-gray-200">{projectCount}</p>
                    <p className="text-xs text-gray-600">projects</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 font-mono">{customer.id}</p>
                    <p className="text-xs text-gray-700">{new Date(customer.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
      <p className="text-xs text-gray-600">{filtered?.length ?? 0} customers</p>
    </div>
  )
}
