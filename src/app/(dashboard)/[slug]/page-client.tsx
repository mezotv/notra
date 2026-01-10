"use client";

import {
  AnalyticsUpIcon,
  ArrowDown01Icon,
  ArrowRight01Icon,
  ArrowUp01Icon,
  Calendar03Icon,
  Clock01Icon,
  CorporateIcon,
  NoteIcon,
  PlugIcon,
  SparklesIcon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import Link from "next/link";
import { Area, AreaChart, XAxis, YAxis } from "recharts";
import { useOrganizationsContext } from "@/components/providers/organization-provider";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Progress, ProgressLabel } from "@/components/ui/progress";

const chartData = [
  { month: "Jan", content: 12, requests: 186 },
  { month: "Feb", content: 19, requests: 305 },
  { month: "Mar", content: 15, requests: 237 },
  { month: "Apr", content: 28, requests: 473 },
  { month: "May", content: 32, requests: 509 },
  { month: "Jun", content: 24, requests: 414 },
];

const chartConfig = {
  content: {
    label: "Content Created",
    color: "var(--color-chart-1)",
  },
  requests: {
    label: "API Requests",
    color: "var(--color-chart-2)",
  },
} satisfies ChartConfig;

interface StatCardProps {
  title: string;
  value: string;
  change: number;
  icon: IconSvgElement;
  description: string;
}

function StatCard({ title, value, change, icon, description }: StatCardProps) {
  const isPositive = change >= 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardDescription className="font-medium text-muted-foreground text-sm">
            {title}
          </CardDescription>
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <HugeiconsIcon icon={icon} size={16} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-1">
        <div className="flex items-baseline gap-2">
          <span className="font-semibold text-2xl tracking-tight">{value}</span>
          <Badge
            className="h-5 gap-0.5 px-1.5"
            variant={isPositive ? "default" : "destructive"}
          >
            <HugeiconsIcon
              icon={isPositive ? ArrowUp01Icon : ArrowDown01Icon}
              size={12}
            />
            {Math.abs(change)}%
          </Badge>
        </div>
        <p className="text-muted-foreground text-xs">{description}</p>
      </CardContent>
    </Card>
  );
}

interface QuickActionProps {
  title: string;
  description: string;
  icon: IconSvgElement;
  href: string;
}

function QuickAction({ title, description, icon, href }: QuickActionProps) {
  return (
    <Link className="group" href={href}>
      <Card className="transition-all duration-200 hover:ring-2 hover:ring-primary/20">
        <CardContent className="flex items-center gap-4 py-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
            <HugeiconsIcon icon={icon} size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-sm">{title}</p>
            <p className="truncate text-muted-foreground text-xs">
              {description}
            </p>
          </div>
          <HugeiconsIcon
            className="text-muted-foreground transition-transform group-hover:translate-x-1"
            icon={ArrowRight01Icon}
            size={16}
          />
        </CardContent>
      </Card>
    </Link>
  );
}

interface ActivityItemProps {
  id: string;
  title: string;
  description: string;
  time: string;
  type: "content" | "integration" | "system";
}

function ActivityItem({ title, description, time, type }: ActivityItemProps) {
  const iconMap = {
    content: NoteIcon,
    integration: PlugIcon,
    system: SparklesIcon,
  };

  const colorMap = {
    content: "bg-chart-1/10 text-chart-1",
    integration: "bg-chart-2/10 text-chart-2",
    system: "bg-chart-3/10 text-chart-3",
  };

  return (
    <div className="flex items-start gap-3 py-3">
      <div
        className={`flex size-8 shrink-0 items-center justify-center rounded-full ${colorMap[type]}`}
      >
        <HugeiconsIcon icon={iconMap[type]} size={14} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-medium text-sm">{title}</p>
        <p className="truncate text-muted-foreground text-xs">{description}</p>
      </div>
      <span className="shrink-0 text-muted-foreground text-xs">{time}</span>
    </div>
  );
}

const recentActivity: ActivityItemProps[] = [
  {
    id: "activity-1",
    title: "Content published",
    description: "New blog post was successfully published",
    time: "2m ago",
    type: "content",
  },
  {
    id: "activity-2",
    title: "Integration synced",
    description: "GitHub repository sync completed",
    time: "15m ago",
    type: "integration",
  },
  {
    id: "activity-3",
    title: "AI generation complete",
    description: "Generated 5 new content variations",
    time: "1h ago",
    type: "system",
  },
  {
    id: "activity-4",
    title: "Content updated",
    description: "Product description was modified",
    time: "2h ago",
    type: "content",
  },
  {
    id: "activity-5",
    title: "New integration added",
    description: "Slack workspace connected",
    time: "3h ago",
    type: "integration",
  },
];

function getGreeting(hour: number): string {
  if (hour < 12) {
    return "Good morning";
  }
  if (hour < 18) {
    return "Good afternoon";
  }
  return "Good evening";
}

export default function PageClient() {
  const { activeOrganization } = useOrganizationsContext();
  const slug = activeOrganization?.slug ?? "";

  const currentHour = new Date().getHours();
  const greeting = getGreeting(currentHour);

  return (
    <div className="flex flex-1 flex-col gap-6 py-6">
      <div className="w-full space-y-6 px-4 lg:px-6">
        {/* Header Section */}
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h1 className="font-bold text-2xl tracking-tight md:text-3xl">
              {greeting}
            </h1>
            <p className="text-muted-foreground text-sm">
              Here&apos;s what&apos;s happening with your workspace today
            </p>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <HugeiconsIcon icon={Calendar03Icon} size={16} />
            <span>
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            change={12}
            description="vs. last month"
            icon={NoteIcon}
            title="Total Content"
            value="128"
          />
          <StatCard
            change={8}
            description="vs. last month"
            icon={AnalyticsUpIcon}
            title="API Requests"
            value="2,847"
          />
          <StatCard
            change={0}
            description="active connections"
            icon={PlugIcon}
            title="Integrations"
            value="7"
          />
          <StatCard
            change={25}
            description="vs. last month"
            icon={UserGroupIcon}
            title="Team Members"
            value="4"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Activity Chart */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Activity Overview</CardTitle>
                  <CardDescription>
                    Content creation and API usage over time
                  </CardDescription>
                </div>
                <Badge className="gap-1" variant="secondary">
                  <HugeiconsIcon icon={Clock01Icon} size={12} />
                  Last 6 months
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <ChartContainer className="h-[240px] w-full" config={chartConfig}>
                <AreaChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="fillContent"
                      x1="0"
                      x2="0"
                      y1="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="var(--color-chart-1)"
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="95%"
                        stopColor="var(--color-chart-1)"
                        stopOpacity={0}
                      />
                    </linearGradient>
                    <linearGradient
                      id="fillRequests"
                      x1="0"
                      x2="0"
                      y1="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="var(--color-chart-2)"
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="95%"
                        stopColor="var(--color-chart-2)"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <XAxis
                    axisLine={false}
                    dataKey="month"
                    fontSize={12}
                    tickLine={false}
                    tickMargin={8}
                  />
                  <YAxis
                    axisLine={false}
                    fontSize={12}
                    tickLine={false}
                    tickMargin={8}
                    width={40}
                  />
                  <ChartTooltip
                    content={<ChartTooltipContent indicator="dot" />}
                    cursor={false}
                  />
                  <Area
                    dataKey="requests"
                    fill="url(#fillRequests)"
                    stroke="var(--color-chart-2)"
                    strokeWidth={2}
                    type="monotone"
                  />
                  <Area
                    dataKey="content"
                    fill="url(#fillContent)"
                    stroke="var(--color-chart-1)"
                    strokeWidth={2}
                    type="monotone"
                  />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Activity</CardTitle>
                <Link
                  className="text-muted-foreground text-xs hover:text-foreground"
                  href={`/${slug}/utility/logs`}
                >
                  View all
                </Link>
              </div>
            </CardHeader>
            <CardContent className="px-4">
              <div className="divide-y">
                {recentActivity.map((activity) => (
                  <ActivityItem key={activity.id} {...activity} />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Progress Section */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Goals</CardTitle>
            <CardDescription>
              Track your progress towards this month&apos;s targets
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <Progress value={72}>
                <ProgressLabel>Content Published</ProgressLabel>
                <span className="ml-auto text-muted-foreground text-sm tabular-nums">
                  72 / 100
                </span>
              </Progress>
              <Progress value={99}>
                <ProgressLabel>API Uptime</ProgressLabel>
                <span className="ml-auto text-muted-foreground text-sm tabular-nums">
                  99.9%
                </span>
              </Progress>
              <Progress value={45}>
                <ProgressLabel>Team Tasks</ProgressLabel>
                <span className="ml-auto text-muted-foreground text-sm tabular-nums">
                  18 / 40
                </span>
              </Progress>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-lg">Quick Actions</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <QuickAction
              description="Start writing new content"
              href={`/${slug}/content`}
              icon={NoteIcon}
              title="Create Content"
            />
            <QuickAction
              description="Connect your tools"
              href={`/${slug}/integrations`}
              icon={PlugIcon}
              title="Manage Integrations"
            />
            <QuickAction
              description="Update your brand settings"
              href={`/${slug}/brand/identity`}
              icon={CorporateIcon}
              title="Brand Identity"
            />
            <QuickAction
              description="Monitor system activity"
              href={`/${slug}/utility/logs`}
              icon={AnalyticsUpIcon}
              title="View Logs"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
