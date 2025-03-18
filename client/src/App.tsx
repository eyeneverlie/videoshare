import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "./context/AuthContext";

// Pages
import Home from "@/pages/Home";
import VideoPage from "@/pages/VideoPage";
import Admin from "@/pages/Admin";
import Login from "@/pages/Login";
import ChangePassword from "@/pages/ChangePassword";
import NotFound from "@/pages/not-found";

function Router() {
  const [location] = useLocation();

  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/video/:id" component={VideoPage} />
      <Route path="/admin" component={Admin} />
      <Route path="/login" component={Login} />
      <Route path="/change-password" component={ChangePassword} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
