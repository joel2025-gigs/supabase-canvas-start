import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon, TrendingDown } from "lucide-react";

interface DepartmentStatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  target?: number;
  showProgress?: boolean;
  icon: LucideIcon;
  iconBgColor?: string;
  valueColor?: string;
  isBelowTarget?: boolean;
}

export const DepartmentStatsCard = ({
  title,
  value,
  subtitle,
  target,
  showProgress = false,
  icon: Icon,
  iconBgColor = "bg-primary/10",
  valueColor = "text-primary",
  isBelowTarget = false,
}: DepartmentStatsCardProps) => {
  const progressPercent = target && typeof value === 'number' 
    ? Math.min((value / target) * 100, 100) 
    : 0;

  return (
    <Card className="border-2 border-border/50">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            <div className="flex items-center gap-2">
              <p className={cn("text-2xl font-bold", valueColor)}>{value}</p>
              {isBelowTarget && (
                <TrendingDown className="h-5 w-5 text-destructive" />
              )}
            </div>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
            {showProgress && target && (
              <div className="mt-2 space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Target: {target}%</span>
                  <span className={isBelowTarget ? "text-destructive" : "text-success"}>
                    {isBelowTarget ? "Below Target" : "On Target"}
                  </span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div 
                    className={cn(
                      "h-full rounded-full transition-all",
                      isBelowTarget ? "bg-warning" : "bg-success"
                    )}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            )}
          </div>
          <div className={cn("p-3 rounded-full", iconBgColor)}>
            <Icon className={cn("h-5 w-5", valueColor)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
