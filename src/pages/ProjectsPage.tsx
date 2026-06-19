import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Plus, Search, X, FolderPlus } from 'lucide-react'
import { useState } from 'react'
import { getProjects, getCustomers, createProject } from '@/api/client'
import { cn } from '@/lib/utils'
import type { ProjectStatus } from '@/types'

const STATUS_STYLES: Record<ProjectStatus, { dot: string; text: string; bg: string }> = {
  ACTIVE:      { dot: 'bg-blue-500',   text: 'text-blue-400',   bg: 'bg-blue-500/10' },
  IN_PROGRESS: { dot: 'bg-yellow-500', text: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  FINISHED:    { dot: 'bg-green-500',  text: 'text-green-400',  bg: 'bg-green-500/10' },
  CREATED:     { dot: 'bg-gray-500',   text: 'text-gray-400',   bg: 'bg-gray-500/10' },
  FAILED:      { dot: 'bg-red-500',    text: 'text-red-400',    bg: 'bg-red-500/10' },
}


function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-xs font-medium text-gray-400 mb-1.5">{children}</label>
}

function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'w-full px-3 py-2 bg-[#0a0a14] border border-white/10 rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-[#7c6cfe] transition-colors',
        className,
      )}
      {...props}
    />
  )
}

function Select({ className, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        'w-full px-3 py-2 bg-[#0a0a14] border border-white/10 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-[#7c6cfe] transition-colors',
        className,
      )}
      {...props}
    >
      {children}
    </select>
  )
}

interface NewProjectForm {
  name: string
  customerId: string
  sourceLang: string
  targetLang: string
  method: 'MACHINE' | 'HUMAN'
  cbJobFinished: string
  cbProjectCompletion: string
  cbProjectCreated: string
  cbAnalysisFinished: string
}

function NewProjectModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient()
  const { data: customers } = useQuery({ queryKey: ['customers'], queryFn: getCustomers })

  const [form, setForm] = useState<NewProjectForm>({
    name: '',
    customerId: '',
    sourceLang: 'EN',
    targetLang: '',
    method: 'MACHINE',
    cbProjectCreated:   'http://localhost:9999/project-created',
    cbAnalysisFinished: 'http://localhost:9999/analysis-finished',
    cbJobFinished:      'http://localhost:9999/job-finished',
    cbProjectCompletion:'http://localhost:9999/project-completed',
  })
  const [showWebhooks, setShowWebhooks] = useState(true)
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  function set(key: keyof NewProjectForm, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await createProject({
        name: form.name,
        customerId: form.customerId,
        targetLang: form.targetLang,
        method: form.method,
        callbackUrls: {
          projectCreated:    form.cbProjectCreated    || undefined,
          analysisFinished:  form.cbAnalysisFinished  || undefined,
          jobFinished:       form.cbJobFinished       || undefined,
          projectCompletion: form.cbProjectCompletion || undefined,
        },
      })
      qc.invalidateQueries({ queryKey: ['projects'] })
      setSubmitted(true)
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="bg-[#13131f] border border-white/10 rounded-2xl p-8 w-full max-w-sm text-center">
          <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
            <FolderPlus className="w-6 h-6 text-green-400" />
          </div>
          <h3 className="text-base font-semibold text-gray-100 mb-1">Project Created</h3>
          <p className="text-sm text-gray-500 mb-6">Upload files to start translation.</p>
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-[#7c6cfe] hover:bg-[#6355e0] text-white text-sm rounded-lg transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#13131f] border border-white/10 rounded-2xl p-6 w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-gray-100 flex items-center gap-2">
            <FolderPlus className="w-4 h-4 text-[#9b8fff]" /> Upload Project
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-500 hover:text-gray-300 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Project Name *</Label>
              <Input
                required
                placeholder="e.g. Headout EN→ES Q3 Marketing"
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
              />
            </div>
            <div>
              <Label>Customer *</Label>
              <Select required value={form.customerId} onChange={(e) => set('customerId', e.target.value)}>
                <option value="">Select customer…</option>
                {customers?.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} — {c.company}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Source Language</Label>
              <Input value="EN" disabled className="opacity-40 cursor-not-allowed" />
            </div>
            <div>
              <Label>Target Language *</Label>
              <Input
                required
                placeholder="e.g. ES"
                value={form.targetLang}
                onChange={(e) => set('targetLang', e.target.value.toUpperCase().slice(0, 5))}
              />
            </div>
            <div>
              <Label>Method *</Label>
              <div className="flex rounded-lg border border-white/10 overflow-hidden">
                {(['MACHINE', 'HUMAN'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => set('method', m)}
                    className={cn(
                      'flex-1 py-2 text-xs font-medium transition-colors',
                      form.method === m
                        ? m === 'MACHINE' ? 'bg-blue-500/20 text-blue-400' : 'bg-amber-500/20 text-amber-400'
                        : 'text-gray-600 hover:text-gray-400 hover:bg-white/5',
                    )}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Collapsible webhook URLs section */}
          <div>
            <button
              type="button"
              onClick={() => setShowWebhooks((v) => !v)}
              className="text-xs text-[#9b8fff] hover:text-[#c4baff] transition-colors"
            >
              {showWebhooks ? '− Hide webhook callbacks' : '＋ Add webhook callbacks'}
            </button>
            {showWebhooks && (
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div>
                  <Label>Project Created URL</Label>
                  <Input
                    type="url"
                    placeholder="https://your-server.com/callback"
                    value={form.cbProjectCreated}
                    onChange={(e) => set('cbProjectCreated', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Analysis Finished URL</Label>
                  <Input
                    type="url"
                    placeholder="https://your-server.com/callback"
                    value={form.cbAnalysisFinished}
                    onChange={(e) => set('cbAnalysisFinished', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Job Finished URL</Label>
                  <Input
                    type="url"
                    placeholder="https://your-server.com/callback"
                    value={form.cbJobFinished}
                    onChange={(e) => set('cbJobFinished', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Project Completed URL</Label>
                  <Input
                    type="url"
                    placeholder="https://your-server.com/callback"
                    value={form.cbProjectCompletion}
                    onChange={(e) => set('cbProjectCompletion', e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-400 text-sm rounded-lg transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !form.name || !form.customerId || !form.sourceLang || !form.targetLang}
              className="flex-1 px-4 py-2 bg-[#7c6cfe] hover:bg-[#6355e0] disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors"
            >
              {loading ? 'Creating…' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function ProjectsPage() {
  const [search, setSearch] = useState('')
  const [showNewProject, setShowNewProject] = useState(false)

  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: getProjects,
  })

  const filtered = projects?.filter((p) => {
    const q = search.toLowerCase()
    return (
      p.name.toLowerCase().includes(q) ||
      p.id.toLowerCase().includes(q) ||
      p.poNumber.toLowerCase().includes(q)
    )
  })

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {showNewProject && <NewProjectModal onClose={() => setShowNewProject(false)} />}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-100">Projects</h1>
          <p className="text-sm text-gray-500 mt-0.5">All translation projects across customers</p>
        </div>
        <button
          onClick={() => setShowNewProject(true)}
          className="flex items-center gap-2 px-3 py-2 bg-[#7c6cfe] hover:bg-[#6355e0] text-white text-sm rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Upload Project
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          type="text"
          placeholder="Search by name, ID or PO number…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-[#13131f] border border-white/10 rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-[#7c6cfe] transition-colors"
        />
      </div>

      {/* Table */}
      <div className="bg-[#13131f] border border-white/5 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5">
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">PO Number</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Target Language</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Files</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {isLoading && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-600 text-sm">
                  Loading…
                </td>
              </tr>
            )}
            {filtered?.map((project) => {
              const s = STATUS_STYLES[project.status]
              return (
                <tr key={project.id} className="hover:bg-white/3 transition-colors">
                  <td className="px-4 py-3">
                    <Link
                      to={`/projects/${project.id}`}
                      className="font-medium text-gray-200 hover:text-[#9b8fff] transition-colors"
                    >
                      {project.name}
                    </Link>
                    <p className="text-xs text-gray-600 font-mono mt-0.5">{project.id}</p>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-400">{project.poNumber}</td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs text-gray-300 bg-white/5 px-2 py-0.5 rounded">
                      {project.targetLang}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        'text-xs font-medium px-2 py-0.5 rounded-full',
                        project.method === 'MACHINE'
                          ? 'bg-blue-500/10 text-blue-400'
                          : 'bg-amber-500/10 text-amber-400',
                      )}
                    >
                      {project.method}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn('inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full', s.bg, s.text)}>
                      <span className={cn('w-1.5 h-1.5 rounded-full', s.dot)} />
                      {project.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400">{project.jobCount}</td>
                  <td className="px-4 py-3 text-gray-600 text-xs">
                    {new Date(project.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {!isLoading && filtered?.length === 0 && (
          <p className="px-4 py-8 text-center text-gray-600 text-sm">No projects match your search.</p>
        )}
      </div>
      <p className="mt-3 text-xs text-gray-600">{filtered?.length ?? 0} projects</p>
    </div>
  )
}
