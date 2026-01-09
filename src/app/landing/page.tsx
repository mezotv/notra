"use client";

import {
  ArrowRight,
  Bot,
  FileText,
  Github,
  Layers,
  MessageSquareText,
  Sparkles,
  Zap,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { type ComponentType, useEffect, useRef, useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function AnimatedGradient() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Primary gradient orb */}
      <div
        className="absolute -top-[40%] left-1/2 h-[800px] w-[800px] -translate-x-1/2 rounded-full opacity-30 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, oklch(0.6056 0.2189 292.7172) 0%, transparent 70%)",
        }}
      />
      {/* Secondary accent orb */}
      <div
        className="absolute top-[20%] -right-[10%] h-[600px] w-[600px] animate-pulse rounded-full opacity-20 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, oklch(0.709 0.1592 293.5412) 0%, transparent 70%)",
          animationDuration: "4s",
        }}
      />
      {/* Tertiary orb */}
      <div
        className="absolute top-[60%] -left-[10%] h-[500px] w-[500px] animate-pulse rounded-full opacity-15 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, oklch(0.8112 0.1013 293.5712) 0%, transparent 70%)",
          animationDuration: "6s",
        }}
      />
      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(oklch(0.6056 0.2189 292.7172) 1px, transparent 1px),
                           linear-gradient(90deg, oklch(0.6056 0.2189 292.7172) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />
    </div>
  );
}

function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={cn(
        "fixed top-0 right-0 left-0 z-50 transition-all duration-300",
        scrolled
          ? "border-border/50 border-b bg-background/80 backdrop-blur-xl"
          : "bg-transparent"
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link className="flex items-center gap-2" href="/landing">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-semibold text-foreground text-xl tracking-tight">
            Notra
          </span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          <Link
            className="text-muted-foreground text-sm transition-colors hover:text-foreground"
            href="#features"
          >
            Features
          </Link>
          <Link
            className="text-muted-foreground text-sm transition-colors hover:text-foreground"
            href="#how-it-works"
          >
            How it works
          </Link>
          <Link
            className="text-muted-foreground text-sm transition-colors hover:text-foreground"
            href="#integrations"
          >
            Integrations
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <Link
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
            href="/login"
          >
            Sign in
          </Link>
          <Link className={cn(buttonVariants({ size: "sm" }))} href="/signup">
            Get Started
            <ArrowRight className="ml-1 h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </nav>
  );
}

function HeroSection() {
  return (
    <section className="relative flex min-h-[90vh] items-center justify-center overflow-hidden px-6 pt-16">
      <AnimatedGradient />

      <div className="relative z-10 mx-auto max-w-4xl text-center">
        {/* Badge */}
        <div className="mb-8 inline-flex animate-fade-in-down items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <span className="font-medium text-primary text-sm">
            AI-Powered Content Engine
          </span>
        </div>

        {/* Main headline */}
        <h1 className="mb-6 animate-fade-in-up font-bold text-4xl text-foreground tracking-tight md:text-6xl lg:text-7xl">
          Transform your work
          <br />
          <span className="bg-gradient-to-r from-primary via-chart-1 to-chart-2 bg-clip-text text-transparent">
            into content
          </span>
        </h1>

        {/* Subheadline */}
        <p
          className="mx-auto mb-10 max-w-2xl animate-fade-in-up text-lg text-muted-foreground md:text-xl"
          style={{ animationDelay: "0.1s" }}
        >
          Notra connects to your GitHub, analyzes your commits, and
          automatically generates changelogs, blog posts, and social updates.
          Ship content as fast as you ship code.
        </p>

        {/* CTAs */}
        <div
          className="flex animate-fade-in-up flex-col items-center justify-center gap-4 sm:flex-row"
          style={{ animationDelay: "0.2s" }}
        >
          <Link
            className={cn(
              buttonVariants({ size: "lg" }),
              "group h-12 px-8 text-base"
            )}
            href="/signup"
          >
            Start for free
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "h-12 px-8 text-base"
            )}
            href="#how-it-works"
          >
            See how it works
          </Link>
        </div>

        {/* Social proof */}
        <div
          className="mt-16 animate-fade-in-up"
          style={{ animationDelay: "0.3s" }}
        >
          <p className="mb-4 text-muted-foreground text-sm">
            Built for modern development teams
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 text-muted-foreground text-sm">
            <span>Next.js</span>
            <span className="text-muted-foreground/30">•</span>
            <span>React</span>
            <span className="text-muted-foreground/30">•</span>
            <span>TypeScript</span>
            <span className="text-muted-foreground/30">•</span>
            <span>Tailwind CSS</span>
          </div>
        </div>
      </div>

      {/* Floating elements - decorative */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div
          className="absolute top-[30%] left-[10%] animate-float rounded-2xl border border-primary/20 bg-card/80 p-4 shadow-xl backdrop-blur-sm"
          style={{ animationDelay: "0s" }}
        >
          <Github className="h-6 w-6 text-primary" />
        </div>
        <div
          className="absolute top-[25%] right-[15%] animate-float rounded-2xl border border-primary/20 bg-card/80 p-4 shadow-xl backdrop-blur-sm"
          style={{ animationDelay: "0.5s" }}
        >
          <FileText className="h-6 w-6 text-primary" />
        </div>
        <div
          className="absolute bottom-[30%] left-[15%] animate-float rounded-2xl border border-primary/20 bg-card/80 p-4 shadow-xl backdrop-blur-sm"
          style={{ animationDelay: "1s" }}
        >
          <MessageSquareText className="h-6 w-6 text-primary" />
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  const features = [
    {
      icon: Github,
      title: "GitHub Integration",
      description:
        "Connect your repositories and let Notra analyze your commits, PRs, and releases automatically.",
    },
    {
      icon: Bot,
      title: "AI-Powered Generation",
      description:
        "Our AI understands your code changes and generates human-quality content that matches your brand voice.",
    },
    {
      icon: FileText,
      title: "Multi-Format Output",
      description:
        "Generate changelogs, blog posts, social media updates, and investor reports from a single source.",
    },
    {
      icon: Layers,
      title: "Brand Consistency",
      description:
        "Define your brand guidelines once, and Notra ensures every piece of content stays on-brand.",
    },
    {
      icon: Zap,
      title: "Instant Publishing",
      description:
        "Push content directly to your blog, social channels, or export to your favorite tools.",
    },
    {
      icon: MessageSquareText,
      title: "Content Assistant",
      description:
        "Chat with AI to refine your content, adjust tone, or generate variations on the fly.",
    },
  ];

  return (
    <section className="relative px-6 py-32" id="features">
      <div className="mx-auto max-w-6xl">
        {/* Section header */}
        <div className="mb-16 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5">
            <Zap className="h-3.5 w-3.5 text-primary" />
            <span className="font-medium text-primary text-sm">Features</span>
          </div>
          <h2 className="mb-4 font-bold text-3xl text-foreground tracking-tight md:text-5xl">
            Everything you need to
            <br />
            <span className="text-primary">automate content</span>
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Stop spending hours writing changelogs and updates. Let Notra handle
            the heavy lifting while you focus on building.
          </p>
        </div>

        {/* Features grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <FeatureCard feature={feature} index={index} key={feature.title} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureCard({
  feature,
  index,
}: {
  feature: {
    icon: ComponentType<{ className?: string }>;
    title: string;
    description: string;
  };
  index: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const currentRef = ref.current;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
      observer.disconnect();
    };
  }, []);

  const Icon = feature.icon;

  return (
    <div
      className={cn(
        "group relative rounded-2xl border border-border/50 bg-card/50 p-8 backdrop-blur-sm transition-all duration-500 hover:border-primary/30 hover:bg-card/80",
        isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
      )}
      ref={ref}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      <div className="mb-4 inline-flex rounded-xl bg-primary/10 p-3 transition-colors group-hover:bg-primary/20">
        <Icon className="h-6 w-6 text-primary" />
      </div>
      <h3 className="mb-2 font-semibold text-foreground text-xl">
        {feature.title}
      </h3>
      <p className="text-muted-foreground leading-relaxed">
        {feature.description}
      </p>
    </div>
  );
}

function ShowcaseSection() {
  return (
    <section className="relative overflow-hidden px-6 py-32" id="how-it-works">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />

      <div className="relative mx-auto max-w-6xl">
        <div className="grid items-center gap-16 lg:grid-cols-2">
          {/* Content */}
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span className="font-medium text-primary text-sm">
                How it works
              </span>
            </div>
            <h2 className="mb-6 font-bold text-3xl text-foreground tracking-tight md:text-5xl">
              From commit to content
              <br />
              <span className="text-primary">in seconds</span>
            </h2>
            <div className="space-y-6">
              {[
                {
                  step: "01",
                  title: "Connect GitHub",
                  description:
                    "Link your repositories with one click. Notra securely accesses your commit history.",
                },
                {
                  step: "02",
                  title: "Set your brand voice",
                  description:
                    "Define your tone, style, and preferences. Our AI learns to write like you.",
                },
                {
                  step: "03",
                  title: "Generate & publish",
                  description:
                    "Review AI-generated content, make edits, and publish anywhere instantly.",
                },
              ].map((item) => (
                <div className="flex gap-4" key={item.step}>
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 font-mono text-primary text-sm">
                    {item.step}
                  </div>
                  <div>
                    <h3 className="mb-1 font-semibold text-foreground text-lg">
                      {item.title}
                    </h3>
                    <p className="text-muted-foreground">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Visual */}
          <div className="relative">
            <div className="relative rounded-2xl border border-border/50 bg-card/80 p-2 shadow-2xl backdrop-blur-sm">
              {/* Mock browser chrome - decorative */}
              <div
                aria-hidden="true"
                className="mb-2 flex items-center gap-2 px-2"
              >
                <div className="h-3 w-3 rounded-full bg-red-400/50" />
                <div className="h-3 w-3 rounded-full bg-yellow-400/50" />
                <div className="h-3 w-3 rounded-full bg-green-400/50" />
              </div>
              {/* Placeholder for dashboard image */}
              <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-gradient-to-br from-primary/20 via-primary/10 to-transparent">
                <Image
                  alt="Code visualization"
                  className="h-full w-full object-cover opacity-80"
                  fill
                  src="https://cdn.pixabay.com/photo/2016/11/19/14/00/code-1839406_1280.jpg"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-card/90 via-card/50 to-transparent" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="space-y-3 text-center">
                    <div className="mx-auto h-16 w-16 rounded-2xl bg-primary/20 p-4">
                      <Sparkles className="h-full w-full text-primary" />
                    </div>
                    <p className="text-muted-foreground text-sm">
                      AI analyzing your commits...
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating notification cards */}
            <div className="absolute -top-4 -right-4 animate-float rounded-xl border border-primary/20 bg-card/90 p-4 shadow-xl backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-green-500/20 p-1.5">
                  <FileText className="h-full w-full text-green-500" />
                </div>
                <div>
                  <p className="font-medium text-foreground text-sm">
                    Changelog generated
                  </p>
                  <p className="text-muted-foreground text-xs">Just now</p>
                </div>
              </div>
            </div>

            <div
              className="absolute -bottom-4 -left-4 animate-float rounded-xl border border-primary/20 bg-card/90 p-4 shadow-xl backdrop-blur-sm"
              style={{ animationDelay: "1s" }}
            >
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/20 p-1.5">
                  <MessageSquareText className="h-full w-full text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground text-sm">
                    Tweet drafted
                  </p>
                  <p className="text-muted-foreground text-xs">2 mins ago</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function IntegrationsSection() {
  const integrations = [
    { name: "GitHub", icon: Github },
    { name: "Linear", icon: Layers },
    { name: "Slack", icon: MessageSquareText },
  ];

  return (
    <section className="relative px-6 py-32" id="integrations">
      <div className="mx-auto max-w-4xl text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5">
          <Layers className="h-3.5 w-3.5 text-primary" />
          <span className="font-medium text-primary text-sm">Integrations</span>
        </div>
        <h2 className="mb-4 font-bold text-3xl text-foreground tracking-tight md:text-5xl">
          Works with your
          <br />
          <span className="text-primary">existing stack</span>
        </h2>
        <p className="mx-auto mb-12 max-w-2xl text-lg text-muted-foreground">
          Notra integrates seamlessly with the tools you already use. Connect
          once and let the content flow.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-6">
          {integrations.map((integration) => {
            const Icon = integration.icon;
            return (
              <div
                className="group flex items-center gap-3 rounded-2xl border border-border/50 bg-card/50 px-6 py-4 backdrop-blur-sm transition-all hover:border-primary/30 hover:bg-card/80"
                key={integration.name}
              >
                <Icon className="h-6 w-6 text-primary" />
                <span className="font-medium text-foreground">
                  {integration.name}
                </span>
              </div>
            );
          })}
          <div className="flex items-center gap-3 rounded-2xl border border-border/50 border-dashed px-6 py-4 text-muted-foreground">
            <span className="font-medium">+ More coming soon</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="relative px-6 py-32">
      <div className="relative mx-auto max-w-4xl overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-12 text-center md:p-16">
        {/* Background decoration */}
        <div className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />

        <div className="relative z-10">
          <h2 className="mb-4 font-bold text-3xl text-foreground tracking-tight md:text-5xl">
            Ready to transform your
            <br />
            <span className="text-primary">workflow?</span>
          </h2>
          <p className="mx-auto mb-8 max-w-xl text-lg text-muted-foreground">
            Join thousands of developers who save hours every week with Notra.
            Start generating content today.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              className={cn(
                buttonVariants({ size: "lg" }),
                "group h-12 px-8 text-base"
              )}
              href="/signup"
            >
              Get started for free
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "h-12 px-8 text-base"
              )}
              href="/login"
            >
              Sign in
            </Link>
          </div>
          <p className="mt-6 text-muted-foreground text-sm">
            No credit card required. Free forever for small projects.
          </p>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-border/50 border-t px-6 py-12">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground text-xl tracking-tight">
              Notra
            </span>
          </div>

          <div className="flex items-center gap-6 text-muted-foreground text-sm">
            <span>Privacy</span>
            <span>Terms</span>
            <span>Contact</span>
          </div>

          <p className="text-muted-foreground text-sm">
            &copy; {new Date().getFullYear()} Notra. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <HeroSection />
        <FeaturesSection />
        <ShowcaseSection />
        <IntegrationsSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
