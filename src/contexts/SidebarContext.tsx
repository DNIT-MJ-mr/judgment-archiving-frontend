import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from 'react'
import { STORAGE_KEYS } from '@/lib/constants'

interface SidebarContextType {
  isCollapsed: boolean
  toggle: () => void
  collapse: () => void
  expand: () => void
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

interface SidebarProviderProps {
  children: ReactNode
}

export function SidebarProvider({ children }: SidebarProviderProps) {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.SIDEBAR_COLLAPSED)
    return stored === 'true'
  })

  const toggle = useCallback(() => {
    setIsCollapsed((prev) => {
      const next = !prev
      localStorage.setItem(STORAGE_KEYS.SIDEBAR_COLLAPSED, String(next))
      return next
    })
  }, [])

  const collapse = useCallback(() => {
    setIsCollapsed(true)
    localStorage.setItem(STORAGE_KEYS.SIDEBAR_COLLAPSED, 'true')
  }, [])

  const expand = useCallback(() => {
    setIsCollapsed(false)
    localStorage.setItem(STORAGE_KEYS.SIDEBAR_COLLAPSED, 'false')
  }, [])

  const value: SidebarContextType = {
    isCollapsed,
    toggle,
    collapse,
    expand,
  }

  return (
    <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
  )
}

export function useSidebar() {
  const context = useContext(SidebarContext)
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider')
  }
  return context
}

export default SidebarContext
