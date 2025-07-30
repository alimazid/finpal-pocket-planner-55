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
      <CardContent className="p-4 pb-3 relative">
        <div className="absolute top-4 right-4">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div className="pr-8 h-16 relative">
          <p className="text-xs font-medium text-muted-foreground">
            {title}
          </p>
          <p className="text-lg font-bold text-foreground whitespace-nowrap absolute top-7">
            {value}
          </p>
          {trend && (
            <span className={`text-xs absolute bottom-0 ${
              trend.isPositive ? 'text-success' : 'text-destructive'
            }`}>
              {trend.value}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}