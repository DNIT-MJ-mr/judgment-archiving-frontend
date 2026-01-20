import { Outlet } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useSidebar } from '@/contexts/SidebarContext'
import { Header } from './Header'
import { Sidebar } from './Sidebar'

export function AppShell() {
  const { isCollapsed } = useSidebar()

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Sidebar />
      <main
        className={cn(
          'min-h-[calc(100vh-4rem)] transition-all duration-300',
          isCollapsed ? 'ms-16' : 'ms-64'
        )}
      >
        <div className="container mx-auto p-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export default AppShell
