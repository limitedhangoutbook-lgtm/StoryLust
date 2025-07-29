import { Link, useLocation } from "wouter";
import { Home, BookOpen, User, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

const navigationItems = [
  {
    name: "Browse",
    path: "/",
    icon: Home,
  },
  {
    name: "My Reading",
    path: "/my-reading",
    icon: BookOpen,
  },
  {
    name: "Profile",
    path: "/profile",
    icon: User,
  },
  {
    name: "Store",
    path: "/store",
    icon: ShoppingCart,
  },
];

export function BottomNavigation() {
  const [location] = useLocation();
  const { user } = useAuth();

  const handleNavClick = (item: typeof navigationItems[0], e: React.MouseEvent) => {
    // Allow browsing for guests, but show modal for user-specific pages
    if (!user && (item.path === "/my-reading" || item.path === "/profile" || item.path === "/store")) {
      e.preventDefault();
      // Show a user-friendly modal instead of immediate redirect
      const shouldLogin = window.confirm(
        `Sign in required to access ${item.name}. Would you like to sign in now?`
      );
      if (shouldLogin) {
        window.location.href = "/api/login";
      }
      return;
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-dark-secondary border-t border-dark-tertiary z-50">
      <div className="flex items-center justify-around px-2 py-2">
        {navigationItems.map((item) => {
          const isActive = location === item.path;
          const Icon = item.icon;
          const requiresAuth = item.path === "/my-reading" || item.path === "/profile" || item.path === "/store";
          const isDisabled = !user && requiresAuth;
          
          return (
            <Link
              key={item.path}
              href={item.path}
              onClick={(e) => handleNavClick(item, e)}
              className={cn(
                "flex flex-col items-center justify-center px-3 py-2 rounded-lg transition-all duration-200",
                "min-w-[64px] max-w-[80px] h-14",
                isActive
                  ? "bg-rose-gold/10 text-rose-gold"
                  : isDisabled
                  ? "text-text-muted/50"
                  : "text-text-muted hover:text-text-secondary hover:bg-dark-tertiary/50"
              )}
            >
              <Icon 
                size={20} 
                className={cn(
                  "mb-1",
                  isActive && "stroke-[2.5px]"
                )} 
              />
              <span className={cn(
                "text-xs font-medium leading-none",
                isActive && "font-semibold"
              )}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}