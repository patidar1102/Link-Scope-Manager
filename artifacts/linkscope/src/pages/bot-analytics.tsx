import { useState } from "react";
import { format, subDays } from "date-fns";
import { 
  useGetAnalyticsBreakdowns, 
  useGetRecentBotActivity 
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Bot, Info, ShieldAlert, Cpu } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

export default function BotAnalytics() {
  const [dateRange, setDateRange] = useState("30");
  
  const to = new Date();
  const from = subDays(to, parseInt(dateRange));
  const params = { from: from.toISOString(), to: to.toISOString() };

  const { data: breakdowns, isLoading: isBreakdownsLoading } = useGetAnalyticsBreakdowns(params);
  const { data: activity, isLoading: isActivityLoading } = useGetRecentBotActivity({});

  const botClassifications = breakdowns?.botClassification || [];
  
  // Calculate total bot requests for percentages
  const totalBots = botClassifications.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <Bot className="h-8 w-8 text-primary" />
            Bot & Crawler Activity
          </h1>
          <p className="text-muted-foreground mt-1 max-w-2xl">
            This traffic is excluded from your main metrics. These are automated scripts, 
            social media preview generators, and scrapers fetching your links.
          </p>
        </div>
        
        <div className="bg-card border border-border p-1 rounded-md shadow-sm">
          <Select value={dateRange} onValueChange={setDateRange}>
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

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="col-span-1 shadow-sm border-border/60 flex flex-col bg-gradient-to-br from-card to-muted/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-amber-500" />
              Bot Classifications
            </CardTitle>
            <CardDescription>What kind of bots are scanning you</CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            {isBreakdownsLoading ? (
               <div className="space-y-4">
                 {[1, 2, 3, 4].map(i => (
                   <div key={i} className="space-y-2">
                     <div className="flex justify-between">
                       <Skeleton className="h-4 w-32" />
                       <Skeleton className="h-4 w-12" />
                     </div>
                     <Skeleton className="h-2 w-full" />
                   </div>
                 ))}
               </div>
            ) : botClassifications.length > 0 ? (
              <div className="space-y-5">
                {botClassifications.map((item, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="font-medium flex items-center gap-2">
                        <Cpu className="h-3.5 w-3.5 text-muted-foreground" />
                        {item.label}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-muted-foreground">{item.count.toLocaleString()}</span>
                        <Badge variant="outline" className="font-mono text-xs w-12 justify-center py-0 px-1">
                          {Math.round(item.percentage)}%
                        </Badge>
                      </div>
                    </div>
                    <Progress value={item.percentage} className="h-1.5" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full min-h-[200px] flex items-center justify-center text-sm text-muted-foreground border-2 border-dashed border-border/50 rounded-lg">
                No bot activity detected.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-1 md:col-span-2 shadow-sm border-border/60">
          <CardHeader>
            <CardTitle>Recent Crawler Activity</CardTitle>
            <CardDescription>Raw feed of automated requests hitting your links.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border border-border/50 bg-card">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Link</TableHead>
                    <TableHead>Classification</TableHead>
                    <TableHead>User Agent</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isActivityLoading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-32 rounded-full" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                      </TableRow>
                    ))
                  ) : activity?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground h-48">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Bot className="h-8 w-8 text-muted" />
                          <span>No recent bot activity.</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    activity?.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="text-muted-foreground whitespace-nowrap text-sm">
                          {format(new Date(row.requestedAt), "MMM d, HH:mm:ss")}
                        </TableCell>
                        <TableCell className="font-medium text-sm">
                          {row.linkTitle || row.shortCode}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="bg-muted text-muted-foreground hover:bg-muted font-normal">
                            {row.classification}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[200px] sm:max-w-[300px]">
                          <div className="truncate text-xs font-mono text-muted-foreground" title={row.userAgent || "Unknown"}>
                            {row.userAgent || "Unknown"}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}