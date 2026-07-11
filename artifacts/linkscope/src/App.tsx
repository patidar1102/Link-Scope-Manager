import React, { useEffect, useRef } from "react";
import { ClerkProvider, SignIn, SignUp, Show, useClerk } from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { shadcn } from "@clerk/themes";
import { Switch, Route, useLocation, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { ThemeProvider, useTheme } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import Links from "@/pages/links";
import Analytics from "@/pages/analytics";
import BotAnalytics from "@/pages/bot-analytics";
import QrCodes from "@/pages/qr-codes";
import Settings from "@/pages/settings";
import NotFound from "@/pages/not-found";
import Shell from "@/components/layout/shell";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);

const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

if (!clerkPubKey) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY in .env file");
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const queryClient = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (
        prevUserIdRef.current !== undefined &&
        prevUserIdRef.current !== userId
      ) {
        queryClient.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, queryClient]);

  return null;
}

function HomeRedirect() {
  return (
    <>
      <Show when="signed-in">
        <Redirect to="/dashboard" />
      </Show>
      <Show when="signed-out">
        <Landing />
      </Show>
    </>
  );
}

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  return (
    <>
      <Show when="signed-in">
        <Shell>
          <Component />
        </Shell>
      </Show>
      <Show when="signed-out">
        <Redirect to="/" />
      </Show>
    </>
  );
}

function SignInPage() {
  const { theme } = useTheme();
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <SignIn 
        routing="path" 
        path={`${basePath}/sign-in`} 
        signUpUrl={`${basePath}/sign-up`} 
      />
    </div>
  );
}

function SignUpPage() {
  const { theme } = useTheme();
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <SignUp 
        routing="path" 
        path={`${basePath}/sign-up`} 
        signInUrl={`${basePath}/sign-in`} 
      />
    </div>
  );
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();
  const { theme } = useTheme();
  const isDark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  const clerkAppearance = {
    theme: shadcn,
    cssLayerName: "clerk",
    options: {
      logoPlacement: "inside" as const,
      logoLinkUrl: basePath || "/",
      logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
    },
    variables: {
      colorPrimary: "hsl(243, 75%, 59%)",
      colorForeground: isDark ? "hsl(210, 40%, 98%)" : "hsl(222, 47%, 11%)",
      colorMutedForeground: isDark ? "hsl(215, 20%, 65%)" : "hsl(215, 16%, 47%)",
      colorDanger: "hsl(0, 84%, 60%)",
      colorBackground: isDark ? "hsl(222, 47%, 7%)" : "hsl(0, 0%, 100%)",
      colorInput: isDark ? "hsl(217, 32%, 17%)" : "hsl(214, 32%, 91%)",
      colorInputForeground: isDark ? "hsl(210, 40%, 98%)" : "hsl(222, 47%, 11%)",
      colorNeutral: isDark ? "hsl(217, 32%, 17%)" : "hsl(214, 32%, 91%)",
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      borderRadius: "0.5rem",
    },
    elements: {
      rootBox: "w-full flex justify-center",
      cardBox: "bg-card rounded-2xl w-[440px] max-w-full overflow-hidden border border-border shadow-lg",
      card: "!shadow-none !border-0 !bg-transparent !rounded-none",
      footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
      headerTitle: "text-foreground font-semibold tracking-tight",
      headerSubtitle: "text-muted-foreground",
      socialButtonsBlockButtonText: "text-foreground font-medium",
      formFieldLabel: "text-foreground font-medium",
      footerActionLink: "text-primary hover:text-primary/90 font-medium",
      footerActionText: "text-muted-foreground",
      dividerText: "text-muted-foreground text-xs font-medium",
      identityPreviewEditButton: "text-primary hover:text-primary/90",
      formFieldSuccessText: "text-emerald-500",
      alertText: "text-destructive",
    },
  };

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: {
          start: {
            title: "Welcome to LinkScope",
            subtitle: "Sign in to access your dashboard",
          },
        },
        signUp: {
          start: {
            title: "Join LinkScope",
            subtitle: "The precision URL shortener for growth teams",
          },
        },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <TooltipProvider>
          <Switch>
            <Route path="/" component={HomeRedirect} />
            <Route path="/sign-in/*?" component={SignInPage} />
            <Route path="/sign-up/*?" component={SignUpPage} />
            
            <Route path="/dashboard" component={() => <ProtectedRoute component={Dashboard} />} />
            <Route path="/links" component={() => <ProtectedRoute component={Links} />} />
            <Route path="/analytics" component={() => <ProtectedRoute component={Analytics} />} />
            <Route path="/bot-analytics" component={() => <ProtectedRoute component={BotAnalytics} />} />
            <Route path="/qr-codes" component={() => <ProtectedRoute component={QrCodes} />} />
            <Route path="/settings" component={() => <ProtectedRoute component={Settings} />} />
            
            <Route component={NotFound} />
          </Switch>
        </TooltipProvider>
        <Toaster />
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="light">
      <WouterRouter base={basePath}>
        <ClerkProviderWithRoutes />
      </WouterRouter>
    </ThemeProvider>
  );
}

export default App;