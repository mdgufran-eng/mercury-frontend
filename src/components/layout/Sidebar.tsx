import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  FolderKanban,
  Bell,
  Users,
  FileText,
  UserCheck,
  BookOpen,
  Languages,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/projects', label: 'Projects', icon: FolderKanban },
  { to: '/callbacks', label: 'Callbacks', icon: Bell },
  { to: '/customers', label: 'Customers', icon: Users },
  { to: '/templates', label: 'Templates', icon: FileText },
  { to: '/freelancers', label: 'Freelancers', icon: UserCheck },
  { to: '/tm', label: 'Trans. Memory', icon: BookOpen },
]

export function Sidebar() {
  return (
    <aside className="flex flex-col w-60 min-h-screen bg-[#0f0f1a] text-gray-300 border-r border-white/5">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-white/5">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-600">
          <Languages className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-white font-semibold text-sm leading-tight">Mercury</p>
          <p className="text-gray-500 text-xs">Translation Admin</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-2 space-y-0.5">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors',
                isActive
                  ? 'bg-indigo-600/20 text-indigo-300 font-medium'
                  : 'text-gray-400 hover:bg-white/5 hover:text-gray-100',
              )
            }
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-white/5">
        <p className="text-xs text-gray-600">Babel TMS · Phase F2</p>
      </div>
    </aside>
  )
}
