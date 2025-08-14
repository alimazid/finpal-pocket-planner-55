import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Calendar } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";

interface BudgetPeriod {
  startDate: Date;
  endDate: Date;
  isCurrentPeriod: boolean;
}

interface AddBudgetCardProps {
  onAddBudget: (category: string, amount: number, periodStart?: string, periodEnd?: string) => void;
  currentPeriod?: BudgetPeriod;
}

export function AddBudgetCard({ onAddBudget, currentPeriod }: AddBudgetCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [customPeriod, setCustomPeriod] = useState(false);
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (category.trim() && amount && parseFloat(amount) > 0) {
      if (customPeriod && periodStart && periodEnd) {
        onAddBudget(category.trim(), parseFloat(amount), periodStart, periodEnd);
      } else {
        onAddBudget(category.trim(), parseFloat(amount));
      }
      setCategory("");
      setAmount("");
      setCustomPeriod(false);
      setPeriodStart("");
      setPeriodEnd("");
      setIsOpen(false);
    }
  };

  const handleCancel = () => {
    setCategory("");
    setAmount("");
    setCustomPeriod(false);
    setPeriodStart("");
    setPeriodEnd("");
    setIsOpen(false);
  };

  const getCurrentPeriodDisplay = () => {
    if (!currentPeriod) return "";
    return `${format(currentPeriod.startDate, 'MMM dd')} - ${format(currentPeriod.endDate, 'MMM dd, yyyy')}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Card className="bg-gradient-card shadow-soft hover:shadow-medium transition-all duration-200 cursor-pointer border-2 border-dashed border-muted-foreground/30 hover:border-primary/50">
          <CardContent className="flex items-center justify-center p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Plus className="h-5 w-5 text-primary" />
              </div>
              <span className="text-lg font-medium text-muted-foreground">Add Budget</span>
            </div>
          </CardContent>
        </Card>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Budget</DialogTitle>
          <DialogDescription>
            Create a new budget category to track your expenses for the selected period.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="category">Budget Name</Label>
            <Input
              id="category"
              placeholder="e.g., Groceries, Gas, Entertainment"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="amount">Budget Amount ($)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="e.g., 500"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              step="0.01"
              min="0"
              required
            />
          </div>

          {/* Period Selection */}
          <div className="space-y-3">
            <Label>Budget Period</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="current-period"
                  name="period"
                  checked={!customPeriod}
                  onChange={() => setCustomPeriod(false)}
                  className="text-primary"
                />
                <Label htmlFor="current-period" className="font-normal">
                  Current Period: {getCurrentPeriodDisplay()}
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="custom-period"
                  name="period"
                  checked={customPeriod}
                  onChange={() => setCustomPeriod(true)}
                  className="text-primary"
                />
                <Label htmlFor="custom-period" className="font-normal">
                  Custom Period
                </Label>
              </div>
            </div>

            {customPeriod && (
              <div className="grid grid-cols-2 gap-4 ml-6">
                <div className="space-y-2">
                  <Label htmlFor="period-start" className="text-sm">Start Date</Label>
                  <Input
                    id="period-start"
                    type="date"
                    value={periodStart}
                    onChange={(e) => setPeriodStart(e.target.value)}
                    required={customPeriod}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="period-end" className="text-sm">End Date</Label>
                  <Input
                    id="period-end"
                    type="date"
                    value={periodEnd}
                    onChange={(e) => setPeriodEnd(e.target.value)}
                    required={customPeriod}
                    min={periodStart}
                  />
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="submit">Add Budget</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}