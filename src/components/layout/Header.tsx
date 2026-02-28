import { useTranslation } from 'react-i18next'
import { Menu, LogOut, User, Settings, ChevronDown } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { useSidebar } from '@/contexts/SidebarContext'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Link } from 'react-router-dom'

export function Header() {
  const { t } = useTranslation(['common', 'auth', 'navigation'])
  const { user, logout } = useAuth()
  const { language } = useLanguage()
  const { toggle: toggleSidebar } = useSidebar()

  const handleLogout = async () => {
    await logout()
  }

  return (
    <header className="app-header sticky top-0 z-50 h-16 border-b border-mr-red-dark">
      <div className="flex h-full items-center justify-between px-4">
        {/* Left side: Menu toggle + Logo */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="text-white hover:bg-mr-red-dark"
          >
            <Menu className="h-5 w-5" />
          </Button>
          
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-15 w-15 object-contain items-center justify-center rounded-full bg-mr-green flex-shrink-0">
              <img
                src="/images/National_Seal_of_Mauritania.png"
                alt={t('ministryLogo', 'Ministry of Justice Logo')}
                className="h-12 w-12 object-contain"
              />
            </div>
            <div className="hidden md:block">
              {/* <h1 className="text-lg font-semibold leading-tight">
                {t('common:appNameShort')}
              </h1> */}
              <p className="text-md leading-tight">
                {language === 'ar' 
                        ? 'الجمهورية الإسلامية الموريتانية' 
                        : 'République Islamique de Mauritanie'
                }
              </p>
              <div className="h-0.5 bg-mr-green w-32 my-1"></div>
              <p className="text-md leading-tight">
                {language === 'ar' ? 'وزارة العدل' : 'Ministère de la Justice'}
              </p>
              {/* Separator line */}
              {/* <div className="h-0.5 bg-mr-green w-32 my-1"></div>
              <p className="text-md leading-tight">
                {language === 'ar' ? 'مديرية الرقمنة والابتكار التكنولوجي' : 'Direction de la Numérisation et de l\'Innovation Technologique'}
              </p> */}
            </div>
          </Link>
        </div>

        {/* Right side: Language toggle + User menu */}
        <div className="flex items-center gap-2">
          {/* Language Toggle */}
          {/* <Button
            variant="ghost"
            size="sm"
            onClick={toggleLanguage}
            className="text-white hover:bg-mr-red-dark"
          >
            {language === 'ar' ? 'FR' : 'ع'}
          </Button> */}

          {/* User Menu */}
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center gap-2 text-white hover:bg-mr-red-dark"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-mr-green text-white text-sm">
                      <User />
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden md:inline-block max-w-[150px] truncate">
                    {user.full_name || user.username}
                  </span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">
                      {user.full_name || user.username}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t(`auth:roles.${user.role}`)}
                    </p>
                    {user.court && (
                      <p className="text-xs text-muted-foreground">
                        {user.court.name}
                      </p>
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="flex items-center">
                    <User className="me-2 h-4 w-4" />
                    {t('auth:profile')}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/profile/password" className="flex items-center">
                    <Settings className="me-2 h-4 w-4" />
                    {t('auth:changePassword')}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-destructive focus:text-destructive"
                >
                  <LogOut className="me-2 h-4 w-4" />
                  {t('auth:logout')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header