import { useState } from "react";
import { format, subDays } from "date-fns";
import { 
  useGetAnalyticsBreakdowns, 
  useGetRecentHumanActivity 
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
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Globe2, 
  Laptop, 
  MapPin, 
  Smartphone, 
  Monitor, 
  Tablet, 
  Link as LinkIcon 
} from "lucide-react";

export default function Analytics() {
  const [dateRange, setDateRange] = useState("30");
  
  const to = new Date();
  const from = subDays(to, parseInt(dateRange));
  const params = { from: from.toISOString(), to: to.toISOString() };

  const { data: breakdowns, isLoading: isBreakdownsLoading } = useGetAnalyticsBreakdowns(params);
  const { data: activity, isLoading: isActivityLoading } = useGetRecentHumanActivity({});

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Human Analytics</h1>
          <p className="text-muted-foreground">Deep dive into real visitor demographics and behavior.</p>
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

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Countries */}
        <BreakdownCard 
          title="Top Countries" 
          icon={Globe2} 
          data={breakdowns?.country} 
          isLoading={isBreakdownsLoading} 
        />
        
        {/* Cities */}
        <BreakdownCard 
          title="Top Cities" 
          icon={MapPin} 
          data={breakdowns?.city} 
          isLoading={isBreakdownsLoading} 
        />
        
        {/* Referrers */}
        <BreakdownCard 
          title="Top Referrers" 
          icon={LinkIcon} 
          data={breakdowns?.referrer} 
          isLoading={isBreakdownsLoading} 
        />
        
        {/* Devices */}
        <BreakdownCard 
          title="Devices" 
          icon={Smartphone} 
          data={breakdowns?.device} 
          isLoading={isBreakdownsLoading} 
          iconMap={{
            'mobile': Smartphone,
            'desktop': Monitor,
            'tablet': Tablet
          }}
        />
        
        {/* Browsers */}
        <BreakdownCard 
          title="Browsers" 
          icon={Laptop} 
          data={breakdowns?.browser} 
          isLoading={isBreakdownsLoading} 
        />
        
        {/* OS */}
        <BreakdownCard 
          title="Operating Systems" 
          icon={Monitor} 
          data={breakdowns?.os} 
          isLoading={isBreakdownsLoading} 
        />
      </div>

      {/* Activity Feed */}
      <Card className="shadow-sm border-border/60">
        <CardHeader>
          <CardTitle>Recent Human Activity</CardTitle>
          <CardDescription>A live feed of real visitors clicking your links.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-border/50">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Link</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Device / Browser</TableHead>
                  <TableHead>Referrer</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isActivityLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    </TableRow>
                  ))
                ) : activity?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground h-32">
                      No recent activity found.
                    </TableCell>
                  </TableRow>
                ) : (
                  activity?.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="text-muted-foreground whitespace-nowrap">
                        {format(new Date(row.clickedAt), "MMM d, HH:mm:ss")}
                      </TableCell>
                      <TableCell className="font-medium">
                        {row.linkTitle || row.shortCode}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {row.country && <span className="text-lg leading-none" title={row.country}>{getCountryFlag(row.country)}</span>}
                          <span>{row.city ? `${row.city}, ` : ''}{row.country || 'Unknown'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <DeviceIcon type={row.deviceType} className="h-4 w-4 text-muted-foreground" />
                          <span>{row.browser || 'Unknown'} on {row.os || 'Unknown'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {row.referrer ? new URL(row.referrer).hostname : 'Direct'}
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
  );
}

function BreakdownCard({ title, icon: Icon, data, isLoading, iconMap }: any) {
  return (
    <Card className="shadow-sm border-border/60 flex flex-col">
      <CardHeader className="flex flex-row items-center gap-2 pb-2">
        <Icon className="h-5 w-5 text-muted-foreground" />
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1">
        {isLoading ? (
          <div className="space-y-4 mt-2">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-8" />
                </div>
                <Skeleton className="h-2 w-full" />
              </div>
            ))}
          </div>
        ) : data && data.length > 0 ? (
          <div className="space-y-4 mt-2">
            {data.slice(0, 6).map((item: any, i: number) => {
              const ItemIcon = iconMap?.[item.label.toLowerCase()] || null;
              return (
                <div key={i} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 overflow-hidden">
                      {ItemIcon && <ItemIcon className="h-3.5 w-3.5 text-muted-foreground" />}
                      <span className="truncate font-medium">{item.label || "Unknown"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground text-xs">
                      <span>{item.count.toLocaleString()}</span>
                      <span className="w-8 text-right">{Math.round(item.percentage)}%</span>
                    </div>
                  </div>
                  <Progress value={item.percentage} className="h-1.5" />
                </div>
              );
            })}
          </div>
        ) : (
          <div className="h-full min-h-[200px] flex items-center justify-center text-sm text-muted-foreground border-2 border-dashed border-border rounded-lg mt-2">
            No data available
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DeviceIcon({ type, className }: { type: string, className?: string }) {
  switch (type.toLowerCase()) {
    case 'mobile': return <Smartphone className={className} />;
    case 'tablet': return <Tablet className={className} />;
    case 'desktop': return <Monitor className={className} />;
    default: return <Laptop className={className} />;
  }
}

// Simple country to emoji mapping (can be expanded)
function getCountryFlag(countryCode: string) {
  if (!countryCode || countryCode.length !== 2) return "🏳️";
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}