import React from "react";
import { Link, useLocation } from "wouter";
import { useClerk, useUser } from "@clerk/react";
import { 
  BarChart3, 
  Bot, 
  LayoutDashboard, 
  Link as LinkIcon, 
  LogOut, 
  QrCode, 
  Settings, 
  Menu
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/links", label: "Links", icon: LinkIcon },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/bot-analytics", label: "Bot Activity", icon: Bot },
  { href: "/qr-codes", label: "QR Codes", icon: QrCode },
];

export default function Shell({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { signOut } = useClerk();
  const { user } = useUser();
  const [isMobileOpen, setIsMobileOpen] = React.useState(false);

  const initials = user?.firstName && user?.lastName 
    ? `${user.firstName[0]}${user.lastName[0]}`
    : user?.emailAddresses[0]?.emailAddress.substring(0, 2).toUpperCase() || "U";

  const NavLinks = () => (
    <nav className="space-y-1 mt-6">
      {navItems.map((item) => {
        const active = location === item.href;
        return (
          <Link key={item.href} href={item.href} onClick={() => setIsMobileOpen(false)}>
            <div
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <item.icon className={`h-4 w-4 ${active ? "text-primary" : "text-muted-foreground"}`} />
              {item.label}
            </div>
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between px-4 h-16 border-b border-border bg-card sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <div className="bg-primary text-primary-foreground p-1.5 rounded-md">
            <LinkIcon className="h-5 w-5" />
          </div>
          <span className="font-bold tracking-tight">LinkScope</span>
        </div>
        <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[280px] p-0 flex flex-col">
            <div className="p-6 pb-0 flex items-center gap-2">
              <div className="bg-primary text-primary-foreground p-1.5 rounded-md">
                <LinkIcon className="h-5 w-5" />
              </div>
              <span className="font-bold tracking-tight text-lg">LinkScope</span>
            </div>
            <div className="flex-1 px-4 overflow-y-auto">
              <NavLinks />
            </div>
            <div className="p-4 border-t border-border mt-auto bg-muted/20 space-y-4">
              <Link href="/settings" onClick={() => setIsMobileOpen(false)}>
                <div className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${location === '/settings' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}>
                  <Settings className="h-4 w-4" />
                  Settings
                </div>
              </Link>
              <div className="flex items-center justify-between px-3">
                <div className="flex items-center gap-3 truncate">
                  <Avatar className="h-8 w-8 rounded-md border border-border">
                    <AvatarImage src={user?.imageUrl} />
                    <AvatarFallback className="rounded-md bg-primary/10 text-primary text-xs">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="truncate text-sm font-medium text-foreground">
                    {user?.fullName || user?.emailAddresses[0]?.emailAddress}
                  </div>
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-border bg-card h-screen sticky top-0">
        <div className="p-6 pb-0 flex items-center gap-2">
          <div className="bg-primary text-primary-foreground p-1.5 rounded-md shadow-sm">
            <LinkIcon className="h-5 w-5" />
          </div>
          <span className="font-bold tracking-tight text-xl">LinkScope</span>
        </div>
        
        <div className="flex-1 px-4 overflow-y-auto">
          <NavLinks />
        </div>

        <div className="p-4 border-t border-border bg-muted/10 space-y-2">
          <Link href="/settings">
            <div className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${location === '/settings' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}>
              <Settings className="h-4 w-4" />
              Settings
            </div>
          </Link>
          <div className="flex items-center justify-between px-2 pt-2">
            <div className="flex items-center gap-3 truncate">
              <Avatar className="h-9 w-9 rounded-md border border-border/50">
                <AvatarImage src={user?.imageUrl} />
                <AvatarFallback className="rounded-md bg-primary/10 text-primary text-xs">{initials}</AvatarFallback>
              </Avatar>
              <div className="truncate text-sm">
                <div className="font-medium text-foreground truncate w-[100px]">
                  {user?.fullName || user?.emailAddresses[0]?.emailAddress.split('@')[0]}
                </div>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => signOut()}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 overflow-x-hidden relative">
        <div className="p-6 md:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}