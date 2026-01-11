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
} from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import nawapLogo from "@/assets/nawap-logo.png";

interface NavItem {
  label: string;
  href: string;
  icon: ReactNode;
  roles: string[];
}

const navItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: <LayoutDashboard className="h-5 w-5" />,
    roles: ["super_admin", "admin", "field_officer", "accountant", "client"],
  },
  {
    label: "Clients",
    href: "/clients",
    icon: <Users className="h-5 w-5" />,
    roles: ["super_admin", "admin", "field_officer", "accountant"],
  },
  {
    label: "Assets",
    href: "/assets",
    icon: <Bike className="h-5 w-5" />,
    roles: ["super_admin", "admin", "field_officer", "accountant"],
  },
  {
    label: "Loans",
    href: "/loans",
    icon: <CreditCard className="h-5 w-5" />,
    roles: ["super_admin", "admin", "field_officer", "accountant"],
  },
  {
    label: "Payments",
    href: "/payments",
    icon: <Receipt className="h-5 w-5" />,
    roles: ["super_admin", "admin", "field_officer", "accountant"],
  },
  {
    label: "Reports",
    href: "/reports",
    icon: <FileText className="h-5 w-5" />,
    roles: ["super_admin", "admin", "accountant"],
  },
  {
    label: "Branches",
    href: "/branches",
    icon: <Building2 className="h-5 w-5" />,
    roles: ["super_admin"],
  },
  {
    label: "Users",
    href: "/users",
    icon: <Shield className="h-5 w-5" />,
    roles: ["super_admin"],
  },
  {
    label: "Audit Logs",
    href: "/audit-logs",
    icon: <History className="h-5 w-5" />,
    roles: ["super_admin", "admin", "accountant"],
  },
  {
    label: "Settings",
    href: "/settings",
    icon: <Settings className="h-5 w-5" />,
    roles: ["super_admin", "admin"],
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
    <div className="min-h-screen bg-muted/30">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-card border-r transform transition-transform duration-200 ease-in-out lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center justify-between px-4 border-b">
          <Link to="/dashboard" className="flex items-center gap-2">
            <img src={nawapLogo} alt={APP_NAME} className="h-8 w-8" />
            <span className="font-bold text-lg text-primary">{APP_NAME}</span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-2">
            {filteredNavItems.map((item) => (
              <li key={item.href}>
                <Link
                  to={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    location.pathname === item.href
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  {item.icon}
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Sync status */}
        <div className="border-t p-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              {isOnline ? (
                <Wifi className="h-4 w-4 text-green-500" />
              ) : (
                <WifiOff className="h-4 w-4 text-red-500" />
              )}
              <span className={isOnline ? "text-green-600" : "text-red-600"}>
                {isOnline ? "Online" : "Offline"}
              </span>
            </div>
            {pendingCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={syncPendingChanges}
                disabled={!isOnline || isSyncing}
                className="h-7 text-xs"
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
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-card px-4 lg:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="flex-1" />

          <div className="flex items-center gap-4">
            {/* Offline indicator for mobile */}
            {!isOnline && (
              <Badge variant="destructive" className="hidden sm:flex">
                <WifiOff className="h-3 w-3 mr-1" />
                Offline
              </Badge>
            )}

            {/* User menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profile?.avatar_url || ""} />
                    <AvatarFallback>
                      {profile?.full_name ? getInitials(profile.full_name) : "U"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:inline text-sm font-medium">
                    {profile?.full_name || "User"}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span>{profile?.full_name}</span>
                    <span className="text-xs text-muted-foreground capitalize">
                      {roles[0]?.replace("_", " ") || "User"}
                    </span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/settings")}>
                  <User className="h-4 w-4 mr-2" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/settings")}>
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut} className="text-red-600">
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
