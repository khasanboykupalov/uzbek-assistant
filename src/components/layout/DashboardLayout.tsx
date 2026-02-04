import React, { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Warehouse,
  LayoutDashboard,
  Users,
  Building2,
  CreditCard,
  LogOut,
  Menu,
  X,
  UserCog,
  BarChart3,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { LanguageSelector } from '@/components/LanguageSelector';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: ReactNode;
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  roles: ('owner' | 'admin')[];
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const { user, role, signOut } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const navItems: NavItem[] = [
    { href: '/dashboard', label: t('dashboard'), icon: LayoutDashboard, roles: ['owner', 'admin'] },
    { href: '/dashboard/admins', label: t('admins'), icon: UserCog, roles: ['owner'] },
    { href: '/dashboard/warehouses', label: t('warehouses'), icon: Building2, roles: ['owner', 'admin'] },
    { href: '/dashboard/tenants', label: t('tenants'), icon: Users, roles: ['owner', 'admin'] },
    { href: '/dashboard/payments', label: t('payments'), icon: CreditCard, roles: ['admin'] },
    { href: '/dashboard/statistics', label: t('statistics'), icon: BarChart3, roles: ['owner', 'admin'] },
    { href: '/dashboard/profile', label: t('profile'), icon: Users, roles: ['owner', 'admin'] },
  ];

  const filteredNavItems = navItems.filter((item) => 
    role && item.roles.includes(role as 'owner' | 'admin')
  );

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const NavLinks = ({ onItemClick }: { onItemClick?: () => void }) => (
    <nav className="flex-1 py-4 space-y-1">
      {filteredNavItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.href;
        
        return (
          <Link
            key={item.href}
            to={item.href}
            onClick={onItemClick}
            className={cn(
              'flex items-center gap-3 px-4 py-3 mx-2 rounded-lg transition-all duration-200',
              isActive
                ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-md'
                : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
            )}
          >
            <Icon className="h-5 w-5" />
            <span className="font-medium">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-64 flex-col gradient-sidebar border-r border-sidebar-border">
        {/* Logo */}
        <div className="p-6 border-b border-sidebar-border">
          <Link to="/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <Warehouse className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-sidebar-accent-foreground">{t('app_name')}</h1>
              <p className="text-xs text-sidebar-foreground capitalize">{role && t(role as any)}</p>
            </div>
          </Link>
        </div>

        <NavLinks />

        {/* User Section */}
        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-10 h-10 rounded-full bg-sidebar-accent flex items-center justify-center">
              <span className="text-sm font-semibold text-sidebar-accent-foreground">
                {user?.email?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-accent-foreground truncate">
                {user?.email}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start text-sidebar-foreground hover:text-destructive hover:bg-destructive/10"
            onClick={handleSignOut}
          >
            <LogOut className="mr-2 h-4 w-4" />
            {t('logout')}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Mobile Header */}
        <header className="lg:hidden sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border">
          <div className="flex items-center justify-between px-4 py-3">
            <Link to="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                <Warehouse className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold">{t('app_name')}</span>
            </Link>

            <div className="flex items-center gap-2">
              <LanguageSelector />
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-64 p-0 gradient-sidebar">
                  <div className="p-6 border-b border-sidebar-border">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                          <Warehouse className="h-4 w-4 text-white" />
                        </div>
                        <span className="font-bold text-sidebar-accent-foreground">{t('app_name')}</span>
                      </div>
                    </div>
                  </div>
                  <NavLinks onItemClick={() => setIsMobileMenuOpen(false)} />
                  <div className="p-4 border-t border-sidebar-border">
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-sidebar-foreground hover:text-destructive"
                      onClick={handleSignOut}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      {t('logout')}
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </header>

        {/* Desktop Header */}
        <header className="hidden lg:flex sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border px-6 py-4 justify-end">
          <LanguageSelector />
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
