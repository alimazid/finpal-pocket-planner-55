import { useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { format, eachDayOfInterval, parseISO } from "date-fns";

interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  description: string;
  category: string | null;
  date: string;
  type: 'expense' | 'income';
  currency: string;
  created_at: string;
  updated_at: string;
}

interface BudgetPeriod {
  startDate: Date;
  endDate: Date;
  isCurrentPeriod: boolean;
}

interface ExpensesGraphProps {
  transactions: Transaction[];
  currentPeriod: BudgetPeriod;
}

export function ExpensesGraph({ transactions, currentPeriod }: ExpensesGraphProps) {
  const graphData = useMemo(() => {
    // Filter transactions to current period and expenses only
    const periodTransactions = transactions.filter(transaction => {
      const transactionDate = parseISO(transaction.date);
      return transactionDate >= currentPeriod.startDate && 
             transactionDate <= currentPeriod.endDate &&
             transaction.type === 'expense';
    });

    // Get all days in the period
    const allDays = eachDayOfInterval({
      start: currentPeriod.startDate,
      end: currentPeriod.endDate
    });

    // Create cumulative data for each day
    let cumulativeTotal = 0;
    const dataPoints = allDays.map(day => {
      // Find transactions for this day
      const dayTransactions = periodTransactions.filter(transaction => {
        const transactionDate = parseISO(transaction.date);
        return format(transactionDate, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd');
      });

      // Add to cumulative total
      const dayTotal = dayTransactions.reduce((sum, transaction) => sum + transaction.amount, 0);
      cumulativeTotal += dayTotal;

      return {
        date: format(day, 'yyyy-MM-dd'),
        day: format(day, 'd'),
        total: cumulativeTotal
      };
    });

    return dataPoints;
  }, [transactions, currentPeriod]);

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="h-32 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={graphData}>
              <XAxis 
                dataKey="day" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                tickFormatter={(value) => `$${value.toFixed(0)}`}
              />
              <Line 
                type="monotone" 
                dataKey="total" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 3, fill: 'hsl(var(--primary))' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}