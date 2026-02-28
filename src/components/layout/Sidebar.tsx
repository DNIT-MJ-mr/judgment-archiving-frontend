import { useTranslation } from 'react-i18next'
import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Upload,
  FileEdit,
  CheckSquare,
  Search,
  Users,
  Building2,
  ScrollText,
  FileText,
  ChevronLeft,
  ChevronRight,
  Tag,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSidebar } from '@/contexts/SidebarContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { usePermissions } from '@/hooks/usePermissions'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from '@/components/ui/tooltip'
import { Separator } from '@/components/ui/separator'

interface NavItem {
  to: string
  icon: React.ComponentType<{ className?: string }>
  labelKey: string
  permission?: keyof ReturnType<typeof usePermissions>
}

const mainNavItems: NavItem[] = [
  {
    to: '/',
    icon: LayoutDashboard,
    labelKey: 'navigation:dashboard',
  },
  {
    to: '/batches',
    icon: Upload,
    labelKey: 'navigation:batches',
    permission: 'canUpload',
  },
  {
    to: '/data-entry',
    icon: FileEdit,
    labelKey: 'navigation:dataEntry',
    permission: 'canAccessDataEntry',
  },
  {
    to: '/validation',
    icon: CheckSquare,
    labelKey: 'navigation:validation',
    permission: 'canAccessValidation',
  },
  {
    to: '/judgments',
    icon: Search,
    labelKey: 'navigation:judgments',
  },
  {
    to: '/templates',
    icon: FileText,
    labelKey: 'navigation:templates',
  },
]

const adminNavItems: NavItem[] = [
  {
    to: '/admin/users',
    icon: Users,
    labelKey: 'navigation:users',
    permission: 'canManageUsers',
  },
  {
    to: '/admin/courts',
    icon: Building2,
    labelKey: 'navigation:courts',
    permission: 'canManageCourts',
  },
  {
    to: '/admin/audit-logs',
    icon: ScrollText,
    labelKey: 'navigation:auditLogs',
    permission: 'canAccessAdmin',
  },
  {
    to: '/admin/templates',
    icon: FileText,
    labelKey: 'navigation:manageTemplates',
    permission: 'canManageTemplates',
  },
  {
    to: '/admin/templates/categories',
    icon: Tag,
    labelKey: 'templates:manageCategories',
    permission: 'canManageTemplates',
  },
]

function NavItemComponent({
  item,
  isCollapsed,
}: {
  item: NavItem
  isCollapsed: boolean
}) {
  const { t } = useTranslation()
  const location = useLocation()
  const Icon = item.icon
  
  const isActive = location.pathname === item.to || 
    (item.to !== '/' && location.pathname.startsWith(item.to))

  const content = (
    <NavLink
      to={item.to}
      className={cn(
        'sidebar-item',
        isActive ? 'sidebar-item-active' : 'sidebar-item-inactive',
        isCollapsed && 'justify-center px-2'
      )}
    >
      <Icon className="h-5 w-5 shrink-0" />
      {!isCollapsed && <span>{t(item.labelKey)}</span>}
    </NavLink>
  )

  if (isCollapsed) {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="left" sideOffset={10}>
          {t(item.labelKey)}
        </TooltipContent>
      </Tooltip>
    )
  }

  return content
}

export function Sidebar() {
  const { t } = useTranslation()
  const { isCollapsed, toggle } = useSidebar()
  const { direction } = useLanguage()
  const permissions = usePermissions()

  const filterNavItems = (items: NavItem[]) =>
    items.filter((item) => {
      if (!item.permission) return true
      return permissions[item.permission]
    })

  const filteredMainItems = filterNavItems(mainNavItems)
  const filteredAdminItems = filterNavItems(adminNavItems)

  const CollapseIcon = direction === 'rtl' 
    ? (isCollapsed ? ChevronLeft : ChevronRight)
    : (isCollapsed ? ChevronRight : ChevronLeft)

  return (
    <TooltipProvider>
      <aside
        className={cn(
          'fixed top-16 bottom-0 z-40 flex flex-col border-e bg-background transition-all duration-300',
          isCollapsed ? 'w-16' : 'w-64'
        )}
      >
        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-2">
          <div className="space-y-1">
            {filteredMainItems.map((item) => (
              <NavItemComponent
                key={item.to}
                item={item}
                isCollapsed={isCollapsed}
              />
            ))}
          </div>

          {filteredAdminItems.length > 0 && (
            <>
              <Separator className="my-4" />
              {!isCollapsed && (
                <p className="mb-2 px-3 text-xs font-semibold uppercase text-muted-foreground">
                  {t('navigation:admin')}
                </p>
              )}
              <div className="space-y-1">
                {filteredAdminItems.map((item) => (
                  <NavItemComponent
                    key={item.to}
                    item={item}
                    isCollapsed={isCollapsed}
                  />
                ))}
              </div>
            </>
          )}
        </nav>
        
        <p className="mt-8 text-center text-xs text-gray-500">
        {t('common:copyright')}
        </p>

        {/* Collapse toggle */}
        <div className="border-t p-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggle}
            className={cn(
              'w-full justify-center',
              !isCollapsed && 'justify-start'
            )}
          >
            <CollapseIcon className="h-4 w-4" />
            {!isCollapsed && (
              <span className="ms-2">
                {isCollapsed ? t('navigation:expand') : t('navigation:collapse')}
              </span>
            )}
          </Button>
        </div>
      </aside>
    </TooltipProvider>
  )
}

export default Sidebar
