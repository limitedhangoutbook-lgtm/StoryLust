import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { ThemeProvider } from "@/components/theme-provider";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import StoryReaderPages from "@/pages/story-reader-pages";
import MyReading from "@/pages/my-reading";
import Profile from "@/pages/profile";
import Store from "@/pages/store";
import StoryBuilder from "@/pages/story-builder";
import UserManagement from "@/pages/user-management";
import StoryMapDemo from "@/pages/story-map-demo";
// EggplantStore is handled by the Store component
import { Bookmarks } from "@/pages/bookmarks";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-rose-400 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/story/:storyId" component={StoryReaderPages} />
      <Route path="/my-reading" component={MyReading} />
      <Route path="/bookmarks" component={Bookmarks} />
      <Route path="/profile" component={Profile} />
      <Route path="/store" component={Store} />
      <Route path="/eggplants" component={Store} />
      <Route path="/story-builder" component={StoryBuilder} />
      <Route path="/user-management" component={UserManagement} />
      <Route path="/story-map-demo" component={StoryMapDemo} />
      <Route path="/landing" component={Landing} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <div className="dark">
            <Toaster />
            <Router />
          </div>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
