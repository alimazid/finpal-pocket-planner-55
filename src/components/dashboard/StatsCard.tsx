import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  className?: string;
}

export function StatsCard({ title, value, icon: Icon, trend, className }: StatsCardProps) {
  return (
    <Card className={`bg-gradient-card shadow-soft hover:shadow-medium transition-all duration-200 ${className || ''}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between space-x-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-muted-foreground mb-1">
              {title}
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-lg font-bold text-foreground break-all">
                {value}
              </p>
              {trend && (
                <span className={`text-xs flex-shrink-0 ${
                  trend.isPositive ? 'text-success' : 'text-destructive'
                }`}>
                  {trend.value}
                </span>
              )}
            </div>
          </div>
          <div className="flex-shrink-0">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}