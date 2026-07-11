import { useState } from "react";
import { format, subDays } from "date-fns";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  Legend
} from "recharts";
import { Activity, MousePointerClick, Users, Bot, Globe, ShieldAlert, ArrowUpRight, TrendingUp } from "lucide-react";
import { 
  useGetAnalyticsOverview, 
  useGetAnalyticsTrend, 
  useGetTopLinks 
} from "@workspace/api-client-react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const [dateRange, setDateRange] = useState("30"); // days
  const [granularity, setGranularity] = useState<"hourly" | "daily" | "weekly" | "monthly">("daily");

  const to = new Date();
  const from = subDays(to, parseInt(dateRange));
  
  // Format dates for API (ISO format but maybe just send as string or the generated hook takes strings/dates?)
  // Generated schemas: from?: string, to?: string
  const params = { 
    from: from.toISOString(), 
    to: to.toISOString() 
  };
  
  const trendParams = { ...params, granularity };

  const { data: overview, isLoading: isOverviewLoading } = useGetAnalyticsOverview(params);
  const { data: trend, isLoading: isTrendLoading } = useGetAnalyticsTrend(trendParams);
  const { data: topLinks, isLoading: isTopLinksLoading } = useGetTopLinks(params);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
          <p className="text-muted-foreground">Here's what's happening with your links.</p>
        </div>
        
        <div className="flex items-center gap-2 bg-card border border-border p-1 rounded-md shadow-sm">
          <Select value={dateRange} onValueChange={(val) => {
            setDateRange(val);
            if (val === "1" || val === "7") setGranularity("hourly");
            else setGranularity("daily");
          }}>
            <SelectTrigger className="w-[140px] border-none shadow-none h-8 focus:ring-0">
              <SelectValue placeholder="Select range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Last 24 hours</SelectItem>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Human Clicks" 
          value={overview?.humanClicks} 
          icon={MousePointerClick} 
          isLoading={isOverviewLoading}
          trend={+12.5} 
        />
        <StatCard 
          title="Unique Visitors" 
          value={overview?.uniqueVisitors} 
          icon={Users} 
          isLoading={isOverviewLoading} 
        />
        <StatCard 
          title="Bot Requests" 
          value={overview?.botRequests} 
          icon={Bot} 
          isLoading={isOverviewLoading} 
        />
        <StatCard 
          title="Total Links" 
          value={overview?.totalLinks} 
          icon={Globe} 
          isLoading={isOverviewLoading} 
        />
      </div>

      <div className="grid gap-4 md:grid-cols-7">
        <Card className="col-span-7 lg:col-span-5 shadow-sm border-border/60">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="space-y-1">
              <CardTitle>Traffic Overview</CardTitle>
              <CardDescription>Human vs Bot traffic over time</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={granularity} onValueChange={(v: any) => setGranularity(v)}>
                <SelectTrigger className="h-8 text-xs w-[110px]">
                  <SelectValue placeholder="Granularity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hourly">Hourly</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {isTrendLoading ? (
              <Skeleton className="h-[350px] w-full mt-4" />
            ) : trend && trend.length > 0 ? (
              <div className="h-[350px] mt-4 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trend} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" opacity={0.5} />
                    <XAxis 
                      dataKey="bucket" 
                      tickFormatter={(val) => {
                        const date = new Date(val);
                        return granularity === "hourly" ? format(date, "HH:mm") : format(date, "MMM d");
                      }}
                      stroke="var(--color-muted-foreground)"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      dy={10}
                    />
                    <YAxis 
                      stroke="var(--color-muted-foreground)"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value}
                    />
                    <RechartsTooltip 
                      contentStyle={{ borderRadius: '8px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-card)', color: 'var(--color-foreground)' }}
                      labelFormatter={(label) => format(new Date(label), granularity === "hourly" ? "MMM d, HH:mm" : "MMM d, yyyy")}
                    />
                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                    <Line 
                      type="monotone" 
                      name="Human Clicks"
                      dataKey="humanClicks" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={3}
                      dot={false}
                      activeDot={{ r: 6, fill: "hsl(var(--primary))" }}
                    />
                    <Line 
                      type="monotone" 
                      name="Bot Requests"
                      dataKey="botRequests" 
                      stroke="hsl(var(--muted-foreground))" 
                      strokeWidth={2}
                      strokeDasharray="4 4"
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[350px] mt-4 w-full flex items-center justify-center border-2 border-dashed border-border rounded-lg text-muted-foreground">
                <div className="flex flex-col items-center gap-2">
                  <Activity className="h-8 w-8 text-muted" />
                  <p>No traffic data for this period</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-7 lg:col-span-2 shadow-sm border-border/60">
          <CardHeader>
            <CardTitle>Top Performing Links</CardTitle>
            <CardDescription>Links with most human clicks</CardDescription>
          </CardHeader>
          <CardContent>
            {isTopLinksLoading ? (
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-md" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : topLinks && topLinks.length > 0 ? (
              <div className="space-y-6">
                {topLinks.map((link) => (
                  <div key={link.id} className="flex items-center justify-between group">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="h-9 w-9 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <ArrowUpRight className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate block">
                          {link.title || link.shortCode}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {link.shortUrl.replace(/^https?:\/\//, '')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold">{link.humanClicks.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">clicks</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm border-2 border-dashed border-border rounded-lg">
                No top links found
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, isLoading, trend }: any) {
  return (
    <Card className="shadow-sm border-border/60 overflow-hidden relative group">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className="h-8 w-8 rounded-md bg-primary/10 text-primary flex items-center justify-center">
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-24 mb-1" />
        ) : (
          <div className="text-3xl font-bold tracking-tight">{value !== undefined ? value.toLocaleString() : "0"}</div>
        )}
        {trend !== undefined && !isLoading && (
          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
            <span className={trend > 0 ? "text-emerald-500 flex items-center" : "text-destructive flex items-center"}>
              {trend > 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : null}
              {Math.abs(trend)}%
            </span>
            from last period
          </p>
        )}
      </CardContent>
    </Card>
  );
}