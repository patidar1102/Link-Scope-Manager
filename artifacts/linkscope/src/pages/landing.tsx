import React from "react";
import { Link } from "wouter";
import { ArrowRight, BarChart3, Bot, Globe, Link as LinkIcon, QrCode, ShieldCheck, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <header className="px-6 h-20 flex items-center justify-between border-b border-border/50 sticky top-0 bg-background/80 backdrop-blur-md z-50">
        <div className="flex items-center gap-2">
          <div className="bg-primary text-primary-foreground p-1.5 rounded-lg shadow-sm">
            <LinkIcon className="h-6 w-6" />
          </div>
          <span className="font-bold tracking-tight text-xl">LinkScope</span>
        </div>
        <nav className="flex items-center gap-4">
          <Link href="/sign-in">
            <Button variant="ghost" className="hidden sm:inline-flex">Sign In</Button>
          </Link>
          <Link href="/sign-up">
            <Button className="shadow-sm">Get Started</Button>
          </Link>
        </nav>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-24 pb-32 px-6">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-background to-background"></div>
          
          <div className="max-w-5xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4 ring-1 ring-primary/20">
              <Zap className="h-4 w-4" />
              <span>The precision URL shortener for modern growth teams</span>
            </div>
            
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight text-foreground balance leading-tight">
              Know exactly who <br className="hidden md:block"/> clicks your links.
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto balance leading-relaxed">
              Stop guessing if your traffic is human or bots. LinkScope provides forensic click analytics, bot detection, and beautiful short links in one professional dashboard.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
              <Link href="/sign-up">
                <Button size="lg" className="w-full sm:w-auto text-base h-14 px-8 shadow-lg shadow-primary/20">
                  Start tracking for free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/sign-in">
                <Button size="lg" variant="outline" className="w-full sm:w-auto text-base h-14 px-8 border-border">
                  View your dashboard
                </Button>
              </Link>
            </div>
          </div>
          
          {/* Mock Dashboard Preview */}
          <div className="max-w-5xl mx-auto mt-24 relative rounded-xl border border-border/50 bg-card shadow-2xl overflow-hidden ring-1 ring-border shadow-primary/5">
            <div className="h-10 bg-muted/30 border-b border-border flex items-center px-4 gap-2">
              <div className="w-3 h-3 rounded-full bg-destructive/80"></div>
              <div className="w-3 h-3 rounded-full bg-amber-400"></div>
              <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
            </div>
            <div className="p-8 aspect-video sm:aspect-[21/9] bg-gradient-to-br from-card to-muted/20 relative flex items-center justify-center">
              <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none mix-blend-overlay"></div>
              <div className="text-muted-foreground/40 flex flex-col items-center gap-4">
                <BarChart3 className="w-16 h-16" />
                <span className="font-mono text-sm tracking-widest uppercase">Forensic Analytics Engine</span>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-24 px-6 bg-muted/20 border-t border-border/50">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16 space-y-4">
              <h2 className="text-3xl font-bold tracking-tight">Built for clarity and control</h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Go beyond basic vanity metrics. We separate humans from scrapers so you can trust your data.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <FeatureCard 
                icon={ShieldCheck}
                title="Bot & Scraper Detection"
                description="Automatically identify and filter out Facebook crawlers, Google bots, and social media preview scrapers."
              />
              <FeatureCard 
                icon={Globe}
                title="Geographic Breakdowns"
                description="See exactly where your human clicks are coming from down to the city level, alongside device and browser data."
              />
              <FeatureCard 
                icon={QrCode}
                title="Branded QR Codes"
                description="Generate beautiful, reliable QR codes for every link instantly. Perfect for print marketing and events."
              />
            </div>
          </div>
        </section>
      </main>

      <footer className="py-12 px-6 border-t border-border bg-card">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="bg-primary text-primary-foreground p-1 rounded">
              <LinkIcon className="h-4 w-4" />
            </div>
            <span className="font-semibold text-foreground">LinkScope</span>
          </div>
          <p className="text-muted-foreground text-sm">
            © {new Date().getFullYear()} LinkScope. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, description }: { icon: any, title: string, description: string }) {
  return (
    <div className="bg-card p-8 rounded-2xl border border-border/60 shadow-sm transition-all hover:shadow-md hover:border-primary/20">
      <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6 text-primary">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-xl font-semibold mb-3">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">
        {description}
      </p>
    </div>
  );
}