import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";


interface ExpenseFormProps {
  onAddExpense: (expense: {
    amount: number;
    description: string;
    category: string | null;
    date: string;
  }) => void;
  availableCategories: string[];
  showCard?: boolean;
}

export function ExpenseForm({ onAddExpense, availableCategories, showCard = true }: ExpenseFormProps) {
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount && description) {
      onAddExpense({
        amount: parseFloat(amount),
        description,
        category: category || null,
        date: new Date().toISOString().split('T')[0]
      });
      setAmount("");
      setDescription("");
      setCategory("");
    }
  };

  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="amount">Amount</Label>
        <Input
          id="amount"
          type="number"
          step="0.01"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="mt-1"
          required
        />
      </div>
      <div>
        <Label htmlFor="description">Description</Label>
        <Input
          id="description"
          placeholder="What did you spend on?"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="mt-1"
          required
        />
      </div>
      <div>
        <Label htmlFor="category">Category (Optional)</Label>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="mt-1">
            <SelectValue placeholder={availableCategories.length > 0 ? "Select a category (optional)" : "No budgets available - will be uncategorized"} />
          </SelectTrigger>
          <SelectContent className="bg-background border shadow-lg z-50">
            {availableCategories.map((cat) => (
              <SelectItem key={cat} value={cat} className="hover:bg-muted">
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" className="w-full bg-gradient-primary hover:opacity-90 transition-opacity">
        Add Expense
      </Button>
    </form>
  );

  if (!showCard) {
    return formContent;
  }

  return (
    <Card className="bg-gradient-card shadow-soft">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5 text-primary" />
          Add Expense
        </CardTitle>
        <CardDescription>
          Track your spending by adding new expenses
        </CardDescription>
      </CardHeader>
      <CardContent>
        {formContent}
      </CardContent>
    </Card>
  );
}