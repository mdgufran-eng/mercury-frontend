import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  FolderKanban,
  Bell,
  Users,
  UserCheck,
  BookOpen,
  Languages,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const PRIMARY_NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/projects',  label: 'Projects',  icon: FolderKanban },
]

const CONFIG_NAV = [
  { to: '/tm',          label: 'Trans. Memory', icon: BookOpen },
  { to: '/callbacks',   label: 'Callbacks',     icon: Bell },
  { to: '/customers',   label: 'Customers',     icon: Users },
  { to: '/freelancers', label: 'Freelancers',   icon: UserCheck },
]

function NavItem({ to, label, icon: Icon }: { to: string; label: string; icon: React.ElementType }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          'relative flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all duration-150',
          isActive
            ? 'text-white font-medium before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-5 before:w-0.5 before:rounded-full before:bg-[#7c6cfe] bg-white/5'
            : 'text-gray-500 hover:bg-white/[0.04] hover:text-gray-300',
        )
      }
    >
      <Icon className="w-4 h-4 flex-shrink-0" />
      {label}
    </NavLink>
  )
}

export function Sidebar() {
  return (
    <aside className="flex flex-col w-56 min-h-screen bg-[#0a0a10] text-gray-300 border-r border-white/[0.06]">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-5 border-b border-white/[0.06]">
        <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#7c6cfe]/20 border border-[#7c6cfe]/30">
          <Languages className="w-3.5 h-3.5 text-[#7c6cfe]" />
        </div>
        <div>
          <p className="text-white font-semibold text-sm leading-tight tracking-tight">Mercury</p>
          <p className="text-gray-600 text-[10px] tracking-wide uppercase">TMS · Babel</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-2 space-y-6">
        {/* Workspace */}
        <div className="space-y-0.5">
          <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-gray-700">Workspace</p>
          {PRIMARY_NAV.map((item) => <NavItem key={item.to} {...item} />)}
        </div>

        {/* Config */}
        <div className="space-y-0.5">
          <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-gray-700">Config</p>
          {CONFIG_NAV.map((item) => <NavItem key={item.to} {...item} />)}
        </div>
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-white/[0.06]">
        <p className="text-[10px] text-gray-700 tracking-wide">Phase F5–F6 · v0.1</p>
      </div>
    </aside>
  )
}
