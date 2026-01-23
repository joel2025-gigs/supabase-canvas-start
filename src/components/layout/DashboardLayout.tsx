import { ReactNode, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useOfflineSync } from "@/hooks/useOfflineSync";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard,
  Users,
  Bike,
  CreditCard,
  Receipt,
  FileText,
  Settings,
  Building2,
  Shield,
  History,
  Menu,
  X,
  LogOut,
  User,
  Wifi,
  WifiOff,
  RefreshCw,
  Package,
  TrendingUp,
  Wallet,
  AlertTriangle,
} from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import nawapLogo from "@/assets/nawap-logo-white.png";

interface NavItem {
  label: string;
  href: string;
  icon: ReactNode;
  roles: string[];
  section?: string;
}

const navItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: <LayoutDashboard className="h-5 w-5" />,
    roles: ["super_admin", "admin", "field_officer", "accountant", "client"],
  },
  // Loans & Departments
  {
    label: "All Loans",
    href: "/loans",
    icon: <CreditCard className="h-5 w-5" />,
    roles: ["super_admin", "admin", "field_officer", "accountant"],
    section: "Loans",
  },
  {
    label: "Sales",
    href: "/departments/sales",
    icon: <TrendingUp className="h-5 w-5" />,
    roles: ["super_admin", "admin", "field_officer"],
    section: "Loans",
  },
  {
    label: "Credit & Collection",
    href: "/departments/credit-collection",
    icon: <Wallet className="h-5 w-5" />,
    roles: ["super_admin", "admin", "field_officer", "accountant"],
    section: "Loans",
  },
  {
    label: "Recovery",
    href: "/departments/recovery",
    icon: <AlertTriangle className="h-5 w-5" />,
    roles: ["super_admin", "admin", "field_officer"],
    section: "Loans",
  },
  // Operations
  {
    label: "Products",
    href: "/product-management",
    icon: <Package className="h-5 w-5" />,
    roles: ["super_admin", "admin", "field_officer"],
    section: "Operations",
  },
  {
    label: "Clients",
    href: "/clients",
    icon: <Users className="h-5 w-5" />,
    roles: ["super_admin", "admin", "field_officer", "accountant"],
    section: "Operations",
  },
  {
    label: "Assets",
    href: "/assets",
    icon: <Bike className="h-5 w-5" />,
    roles: ["super_admin", "admin", "field_officer", "accountant"],
    section: "Operations",
  },
  {
    label: "Payments",
    href: "/payments",
    icon: <Receipt className="h-5 w-5" />,
    roles: ["super_admin", "admin", "field_officer", "accountant"],
    section: "Operations",
  },
  {
    label: "Reports",
    href: "/reports",
    icon: <FileText className="h-5 w-5" />,
    roles: ["super_admin", "admin", "accountant"],
    section: "Operations",
  },
  // Admin
  {
    label: "Branches",
    href: "/branches",
    icon: <Building2 className="h-5 w-5" />,
    roles: ["super_admin"],
    section: "Admin",
  },
  {
    label: "Users",
    href: "/users",
    icon: <Shield className="h-5 w-5" />,
    roles: ["super_admin", "admin"],
    section: "Admin",
  },
  {
    label: "Audit Logs",
    href: "/audit-logs",
    icon: <History className="h-5 w-5" />,
    roles: ["super_admin", "admin", "accountant"],
    section: "Admin",
  },
  {
    label: "Settings",
    href: "/settings",
    icon: <Settings className="h-5 w-5" />,
    roles: ["super_admin", "admin"],
    section: "Admin",
  },
];

interface DashboardLayoutProps {
  children: ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { profile, roles, signOut } = useAuth();
  const { isOnline, isSyncing, pendingCount, syncPendingChanges } = useOfflineSync();
  const location = useLocation();
  const navigate = useNavigate();

  const filteredNavItems = navItems.filter((item) =>
    item.roles.some((role) => roles.includes(role as any))
  );

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="min-h-screen gradient-bg">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-sidebar border-r border-sidebar-border transform transition-transform duration-200 ease-in-out lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center justify-between px-4 border-b border-sidebar-border">
          <Link to="/dashboard" className="flex items-center gap-2">
            <img src={nawapLogo} alt={APP_NAME} className="h-10 w-auto object-contain" />
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden text-sidebar-foreground hover:bg-sidebar-accent"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-3">
            {(() => {
              let currentSection = "";
              return filteredNavItems.map((item) => {
                const showSection = item.section && item.section !== currentSection;
                if (item.section) currentSection = item.section;
                
                return (
                  <li key={item.href}>
                    {showSection && (
                      <div className="text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider px-3 pt-4 pb-2">
                        {item.section}
                      </div>
                    )}
                    <Link
                      to={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                        location.pathname === item.href
                          ? "bg-accent/20 text-accent border border-accent/30"
                          : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                      )}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <span className={cn(
                        location.pathname === item.href ? "text-accent" : ""
                      )}>
                        {item.icon}
                      </span>
                      {item.label}
                    </Link>
                  </li>
                );
              });
            })()}
          </ul>
        </nav>

        {/* Sync status */}
        <div className="border-t border-sidebar-border p-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              {isOnline ? (
                <Wifi className="h-4 w-4 text-success" />
              ) : (
                <WifiOff className="h-4 w-4 text-destructive" />
              )}
              <span className={isOnline ? "text-success" : "text-destructive"}>
                {isOnline ? "Online" : "Offline"}
              </span>
            </div>
            {pendingCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={syncPendingChanges}
                disabled={!isOnline || isSyncing}
                className="h-7 text-xs text-primary hover:text-primary hover:bg-primary/10"
              >
                <RefreshCw className={cn("h-3 w-3 mr-1", isSyncing && "animate-spin")} />
                {pendingCount} pending
              </Button>
            )}
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border/50 bg-background/80 backdrop-blur-md px-4 lg:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden hover:bg-muted"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="flex-1" />

          <div className="flex items-center gap-4">
            {/* Offline indicator for mobile */}
            {!isOnline && (
              <Badge variant="destructive" className="hidden sm:flex bg-destructive/20 text-destructive border-destructive/30">
                <WifiOff className="h-3 w-3 mr-1" />
                Offline
              </Badge>
            )}

            {/* User menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 hover:bg-muted rounded-xl px-3">
                  <Avatar className="h-8 w-8 border-2 border-primary/30">
                    <AvatarImage src={profile?.avatar_url || ""} />
                    <AvatarFallback className="bg-primary/20 text-primary font-semibold">
                      {profile?.full_name ? getInitials(profile.full_name) : "U"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:inline text-sm font-medium text-foreground">
                    {profile?.full_name || "User"}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-popover border-border">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span className="text-foreground">{profile?.full_name}</span>
                    <span className="text-xs text-primary capitalize">
                      {roles[0]?.replace("_", " ") || "User"}
                    </span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-border" />
                <DropdownMenuItem onClick={() => navigate("/settings")} className="focus:bg-muted">
                  <User className="h-4 w-4 mr-2 text-primary" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/settings")} className="focus:bg-muted">
                  <Settings className="h-4 w-4 mr-2 text-primary" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-border" />
                <DropdownMenuItem onClick={signOut} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
};
