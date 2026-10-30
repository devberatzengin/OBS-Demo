import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, BookOpen, Calendar, CalendarClock, FileText, MessageSquare,
  CheckSquare, LogOut, PanelLeftClose, PanelLeftOpen, User as UserIcon,
  ClipboardCheck, Users, GraduationCap, Building2,
} from 'lucide-react';
import { ThemeToggle, cn } from './ui';

const MENUS = {
  ACADEMICIAN: [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/academician' },
    { name: 'My Schedule', icon: Calendar, path: '/academician/schedule' },
    { name: 'Advising', icon: ClipboardCheck, path: '/academician/advisees' },
    { name: 'My Students', icon: Users, path: '/academician/students' },
    { name: 'Messages', icon: MessageSquare, path: '/academician/messages' },
    { name: 'To-Do List', icon: CheckSquare, path: '/academician/todo' },
    { name: 'Profile', icon: UserIcon, path: '/academician/profile' },
  ],
  ADMIN: [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
    { name: 'Users', icon: Users, path: '/admin/users' },
    { name: 'Courses', icon: BookOpen, path: '/admin/courses' },
    { name: 'Infrastructure', icon: Building2, path: '/admin/infra' },
    { name: 'Messages', icon: MessageSquare, path: '/admin/messages' },
  ],
  ADMINISTRATIVE: [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/administrative' },
    { name: 'Messages', icon: MessageSquare, path: '/administrative/messages' },
    { name: 'Profile', icon: UserIcon, path: '/administrative/profile' },
  ],
  STUDENT: [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/student' },
    { name: 'Course Registration', icon: BookOpen, path: '/student/registration' },
    { name: 'Weekly Schedule', icon: Calendar, path: '/student/schedule' },
    { name: 'Exam Calendar', icon: CalendarClock, path: '/student/exams' },
    { name: 'Transcript', icon: FileText, path: '/student/transcript' },
    { name: 'Attendance', icon: ClipboardCheck, path: '/student/attendance' },
    { name: 'Messages', icon: MessageSquare, path: '/student/messages' },
    { name: 'To-Do List', icon: CheckSquare, path: '/student/todo' },
    { name: 'Profile', icon: UserIcon, path: '/student/profile' },
  ],
};

const ROLE_LABEL = {
  STUDENT: 'Student',
  ACADEMICIAN: 'Academician',
  ADMINISTRATIVE: 'Staff',
  ADMIN: 'Administrator',
};

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const menuItems = MENUS[user?.role] ?? MENUS.STUDENT;
  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.username;
  const initials = (fullName || '?').split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
  const homePath = menuItems[0].path;

  return (
    <aside
      className={cn(
        'sticky top-0 z-30 flex h-screen shrink-0 flex-col border-r border-border bg-surface transition-[width] duration-200',
        collapsed ? 'w-[68px]' : 'w-64',
      )}
    >
      {/* Brand */}
      <div className={cn('flex h-14 items-center border-b border-border px-3', collapsed ? 'justify-center' : 'justify-between')}>
        {!collapsed && (
          <div className="flex items-center gap-2.5 pl-1">
            <div className="flex size-7 items-center justify-center rounded-md bg-accent text-accent-fg">
              <GraduationCap className="size-4" />
            </div>
            <span className="text-sm font-semibold">OBS Portal</span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="rounded-md p-1.5 text-fg-subtle transition-colors hover:bg-surface-hover hover:text-fg cursor-pointer"
        >
          {collapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto p-2">
        {!collapsed && (
          <p className="px-2.5 pt-2 pb-1.5 text-[11px] font-medium tracking-wide text-fg-subtle uppercase">
            {ROLE_LABEL[user?.role] ?? 'Portal'}
          </p>
        )}
        {menuItems.map(({ name, icon: Icon, path }) => (
          <NavLink
            key={path}
            to={path}
            end={path === homePath}
            title={collapsed ? name : undefined}
            className={({ isActive }) => cn(
              'flex h-9 items-center gap-3 rounded-md px-2.5 text-sm font-medium transition-colors',
              collapsed && 'justify-center px-0',
              isActive
                ? 'bg-accent-soft text-accent'
                : 'text-fg-muted hover:bg-surface-hover hover:text-fg',
            )}
          >
            <Icon className="size-4 shrink-0" />
            {!collapsed && <span className="truncate">{name}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="space-y-1 border-t border-border p-2">
        <ThemeToggle showLabel={!collapsed} className={cn('w-full', collapsed && 'justify-center px-0')} />
        <div className={cn('flex items-center gap-3 rounded-md p-2', collapsed && 'justify-center p-1')}>
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent-soft text-xs font-semibold text-accent">
            {initials}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{fullName}</p>
              <p className="truncate text-xs text-fg-subtle">{user?.username}</p>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={logout}
              aria-label="Log out"
              title="Log out"
              className="rounded-md p-1.5 text-fg-subtle transition-colors hover:bg-danger-soft hover:text-danger cursor-pointer"
            >
              <LogOut className="size-4" />
            </button>
          )}
        </div>
        {collapsed && (
          <button
            onClick={logout}
            aria-label="Log out"
            title="Log out"
            className="flex h-9 w-full items-center justify-center rounded-md text-fg-subtle hover:bg-danger-soft hover:text-danger cursor-pointer"
          >
            <LogOut className="size-4" />
          </button>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
