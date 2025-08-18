import { Link, useLocation } from "wouter";
import { Home, BookOpen, User, ShoppingCart, Plus, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { isAdmin } from "@shared/userRoles";

const navigationItems = [
  {
    name: "Browse",
    path: "/",
    icon: Home,
    requiresAuth: false,
  },
  {
    name: "My Reading",
    path: "/my-reading",
    icon: BookOpen,
    requiresAuth: true,
  },
  {
    name: "Collection",
    path: "/collection",
    icon: Star,
    requiresAuth: true,
  },
  {
    name: "Profile",
    path: "/profile",
    icon: User,
    requiresAuth: true,
  },
  {
    name: "Store",
    path: "/store",
    icon: ShoppingCart,
    requiresAuth: true,
  },
];

export function BottomNavigation() {
  const [location] = useLocation();
  const { user } = useAuth();

  const handleNavClick = (item: typeof navigationItems[0], e: React.MouseEvent) => {
    // Allow browsing for guests, but show modal for user-specific pages
    if (!user && item.requiresAuth) {
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

  // Create dynamic navigation items (add admin create button if user is admin)
  const dynamicItems = [...navigationItems];
  if (user && isAdmin(user)) {
    dynamicItems.splice(2, 0, {
      name: "Create",
      path: "/story-builder",
      icon: Plus,
      requiresAuth: true,
    });
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-dark-secondary border-t border-dark-tertiary z-50">
      <div className="flex items-center justify-around px-2 py-2">
        {dynamicItems.map((item) => {
          const isActive = location === item.path;
          const Icon = item.icon;
          const isDisabled = !user && item.requiresAuth;
          
          return (
            <Link
              key={item.path}
              href={item.path}
              onClick={(e) => handleNavClick(item, e)}
              className={cn(
                "flex flex-col items-center justify-center px-2 py-2 rounded-lg transition-all duration-200",
                "min-w-[50px] max-w-[70px] h-14 flex-1",
                isActive
                  ? "bg-rose-gold/10 text-rose-gold"
                  : isDisabled
                  ? "text-text-muted/30 cursor-not-allowed"
                  : "text-text-muted hover:text-text-secondary hover:bg-dark-tertiary/50"
              )}
            >
              <Icon 
                size={20} 
                className={cn(
                  "mb-1",
                  isActive && "stroke-[2.5px]",
                  isDisabled && "opacity-40"
                )} 
              />
              <span className={cn(
                "text-xs font-medium leading-none",
                isActive && "font-semibold",
                isDisabled && "opacity-40"
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

export default BottomNavigation;