import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BarChart3, Plus, Check, X, Trash2, Edit } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/utils";
import { useState, useEffect, useRef } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Budget {
  id: string;
  user_id: string;
  category: string;
  amount: number;
  spent: number;
  currency: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

interface BudgetPeriod {
  startDate: Date;
  endDate: Date;
  isCurrentPeriod: boolean;
}

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

interface BudgetSummaryProps {
  budgets: Budget[];
  transactions?: Transaction[];
  language: 'english' | 'spanish';
  onAddBudget?: (category: string, amount: number) => void;
  onDeleteBudget?: (id: string) => void;
  onDeleteTransaction?: (id: string) => void;
  onUpdateTransaction?: (id: string, amount: number) => void;
  onUpdateTransactionCategory?: (id: string, category: string | null) => void;
  onUpdateBudgetCategory?: (id: string, category: string) => void;
  onUpdateBudgetAmount?: (id: string, amount: number) => void;
  onUpdateBudgetOrder?: (budgets: Budget[]) => void;
  availableCategories?: string[];
  currentPeriod?: BudgetPeriod;
  onPeriodChange?: (period: BudgetPeriod) => void;
  cutoffDay?: number;
}

export function BudgetSummary({ 
  budgets, 
  transactions = [],
  language, 
  onAddBudget, 
  onDeleteBudget,
  onDeleteTransaction,
  onUpdateTransaction,
  onUpdateTransactionCategory,
  onUpdateBudgetCategory,
  onUpdateBudgetAmount,
  onUpdateBudgetOrder,
  availableCategories = [],
  currentPeriod,
  onPeriodChange,
  cutoffDay = 1 
}: BudgetSummaryProps) {
  const { t } = useTranslation(language);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [expandedBudgetId, setExpandedBudgetId] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [editCategory, setEditCategory] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [optimisticBudgets, setOptimisticBudgets] = useState<Budget[] | null>(null);

  // Clear optimistic state when budgets prop updates (after database sync)
  useEffect(() => {
    if (optimisticBudgets && budgets.length > 0) {
      setOptimisticBudgets(null);
    }
  }, [budgets]);

  // Drag and drop sensors with mobile support
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 0, // Remove delay for instant response on mobile
        tolerance: 3, // Reduce tolerance for more precise touch
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Sort budgets by sort_order (use optimistic state during drag operations)
  const sortedBudgets = (optimisticBudgets || [...budgets]).sort((a, b) => a.sort_order - b.sort_order);

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const baseBudgets = optimisticBudgets || [...budgets];
      const sortedBaseBudgets = baseBudgets.sort((a, b) => a.sort_order - b.sort_order);
      
      const oldIndex = sortedBaseBudgets.findIndex((budget) => budget.id === active.id);
      const newIndex = sortedBaseBudgets.findIndex((budget) => budget.id === over?.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const reorderedBudgets = arrayMove(sortedBaseBudgets, oldIndex, newIndex);
        
        // Update sort_order for all budgets
        const budgetsWithNewOrder = reorderedBudgets.map((budget, index) => ({
          ...budget,
          sort_order: index + 1
        }));
        
        // Immediately update optimistic state for smooth UI
        setOptimisticBudgets(budgetsWithNewOrder);
        
        // Use requestAnimationFrame to defer database update and prevent blocking
        requestAnimationFrame(() => {
          if (onUpdateBudgetOrder) {
            onUpdateBudgetOrder(budgetsWithNewOrder);
          }
        });
      }
    }
  };

  // Create default current period if not provided
  const getCurrentPeriod = (): BudgetPeriod => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    
    let startDate = new Date(year, month, cutoffDay);
    if (now.getDate() < cutoffDay) {
      startDate = new Date(year, month - 1, cutoffDay);
    }
    
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);
    endDate.setDate(endDate.getDate() - 1);
    
    return {
      startDate,
      endDate,
      isCurrentPeriod: true
    };
  };

  const activePeriod = currentPeriod || getCurrentPeriod();
  // Unified color logic for consistent theming across progress bar, spent amount, and remaining amount
  const getBudgetStatus = (spent: number, amount: number) => {
    const spentNum = Number(spent) || 0;
    const amountNum = Number(amount) || 1;
    const percentage = (spentNum / amountNum) * 100;
    
    if (percentage >= 100) {
      return {
        type: 'over-budget' as const,
        hslColor: 'hsl(0 84% 60%)', // red for over-budget
        textClasses: 'text-red-600 dark:text-red-400'
      };
    } else if (percentage >= 90) {
      return {
        type: 'critical' as const,
        hslColor: 'hsl(0 84% 60%)', // red for critical
        textClasses: 'text-red-600 dark:text-red-400'
      };
    } else if (percentage >= 75) {
      return {
        type: 'warning' as const,
        hslColor: 'hsl(24 95% 53%)', // orange for warning
        textClasses: 'text-orange-600 dark:text-orange-400'
      };
    } else {
      return {
        type: 'healthy' as const,
        hslColor: 'hsl(142 76% 36%)', // green color matching the text for healthy budgets
        textClasses: 'text-green-600 dark:text-green-400'
      };
    }
  };


  const getSpentPercentage = (spent: number, amount: number) => {
    const spentNum = Number(spent) || 0;
    const amountNum = Number(amount) || 1;
    return Math.min((spentNum / amountNum) * 100, 100);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (category.trim() && amount && parseFloat(amount) > 0 && onAddBudget) {
      onAddBudget(category.trim(), parseFloat(amount));
      setCategory("");
      setAmount("");
      setIsAddDialogOpen(false);
    }
  };

  const handleCancel = () => {
    setCategory("");
    setAmount("");
    setIsAddDialogOpen(false);
  };

  const handleEditBudget = (budget: Budget) => {
    setEditingBudget(budget);
    setEditCategory(budget.category);
    setEditAmount(budget.amount.toString());
    setEditDialogOpen(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingBudget && editCategory.trim() && editAmount && parseFloat(editAmount) > 0) {
      // Update category if changed
      if (editCategory.trim() !== editingBudget.category && onUpdateBudgetCategory) {
        onUpdateBudgetCategory(editingBudget.id, editCategory.trim());
      }
      
      // Update amount if changed
      const newAmount = parseFloat(editAmount);
      if (newAmount !== editingBudget.amount && onUpdateBudgetAmount) {
        onUpdateBudgetAmount(editingBudget.id, newAmount);
      }
      
      handleEditCancel();
    }
  };

  const handleEditCancel = () => {
    setEditingBudget(null);
    setEditCategory("");
    setEditAmount("");
    setEditDialogOpen(false);
  };

  const totalSpent = budgets.reduce((sum, budget) => sum + budget.spent, 0);
  const totalBudget = budgets.reduce((sum, budget) => sum + budget.amount, 0);
  const totalPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
  const primaryCurrency = budgets.length > 0 ? budgets[0].currency : 'USD';
  const totalBudgetStatus = getBudgetStatus(totalSpent, totalBudget);

  // Transaction Accordion Component
  const TransactionAccordion = ({ 
    transactions, 
    category, 
    language, 
    onDeleteTransaction, 
    onUpdateTransaction, 
    onUpdateTransactionCategory, 
    availableCategories 
  }: {
    transactions: Transaction[];
    category: string;
    language: 'english' | 'spanish';
    onDeleteTransaction?: (id: string) => void;
    onUpdateTransaction?: (id: string, amount: number) => void;
    onUpdateTransactionCategory?: (id: string, category: string | null) => void;
    availableCategories: string[];
  }) => {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editAmount, setEditAmount] = useState("");
    
    const formatDate = (dateString: string) => {
      const [year, month, day] = dateString.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
      });
    };

    const handleEdit = (transaction: Transaction) => {
      setEditingId(transaction.id);
      setEditAmount(transaction.amount.toString());
    };

    const handleSave = () => {
      if (editingId && onUpdateTransaction) {
        const newAmount = parseFloat(editAmount);
        if (newAmount > 0) {
          onUpdateTransaction(editingId, newAmount);
        }
      }
      setEditingId(null);
    };

    if (transactions.length === 0) {
      return (
        <Card className="bg-muted/30">
          <CardContent className="p-4 text-center text-muted-foreground">
            <p className="text-sm">{t('noTransactions')}</p>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className="bg-muted/30">
        <CardContent className="p-4">
          <div className="space-y-3">
            {transactions.slice(0, 10).map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-b-0">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-foreground truncate">{transaction.description}</p>
                    <div className="flex items-center gap-2 ml-4">
                      {editingId === transaction.id ? (
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            value={editAmount}
                            onChange={(e) => setEditAmount(e.target.value)}
                            className="w-20 h-6 text-xs"
                            step="0.01"
                            min="0"
                          />
                          <Button size="sm" variant="outline" onClick={handleSave} className="h-6 w-6 p-0">
                            <Check className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setEditingId(null)} className="h-6 w-6 p-0">
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <span 
                            className="text-sm font-medium cursor-pointer hover:text-primary"
                            onClick={() => handleEdit(transaction)}
                          >
                            {formatCurrency(transaction.amount, transaction.currency)}
                          </span>
                          {onDeleteTransaction && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>{t('deleteTransaction')}</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    {t('deleteTransactionConfirm')} "{transaction.description}" ({formatCurrency(transaction.amount, transaction.currency)})? {t('actionCannotBeUndoneSimple')}
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => onDeleteTransaction(transaction.id)} 
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    {t('delete')}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDate(transaction.date)}
                  </p>
                </div>
              </div>
            ))}
            {transactions.length > 10 && (
              <p className="text-xs text-muted-foreground text-center pt-2">
                {t('showing')} 10 {t('of')} {transactions.length} {t('transactions')}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  // Sortable Budget Card Component
  const SortableBudgetCard = ({ budget }: { budget: Budget }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: budget.id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
      userSelect: 'none' as const,
      WebkitUserSelect: 'none' as const,
      touchAction: isDragging ? 'none' : 'auto',
    };

    const categoryTransactions = transactions.filter(
      t => t.category === budget.category && t.type === 'expense'
    );

    return (
      <div 
        ref={setNodeRef} 
        style={style} 
        {...attributes}
        className="select-none touch-manipulation"
      >
        <BudgetDisplayCard
          title={budget.category}
          spent={budget.spent}
          amount={budget.amount}
          currency={budget.currency}
          budgetId={budget.id}
          budget={budget}
          isClickable={true}
          categoryTransactions={categoryTransactions}
          dragListeners={listeners}
        />
      </div>
    );
  };

  // Reusable Budget Card Component
  const BudgetDisplayCard = ({ 
    title, 
    spent, 
    amount, 
    currency, 
    className = "",
    budgetId,
    budget,
    isClickable = false,
    categoryTransactions = [],
    dragListeners
  }: {
    title: string;
    spent: number;
    amount: number;
    currency: string;
    className?: string;
    budgetId?: string;
    budget?: Budget;
    isClickable?: boolean;
    categoryTransactions?: Transaction[];
    dragListeners?: any;
  }) => {
    const percentage = getSpentPercentage(spent, amount);
    const budgetStatus = getBudgetStatus(spent, amount);
    const isOverBudget = spent > amount;
    const isExpanded = budgetId && expandedBudgetId === budgetId;

    const handleCardClick = () => {
      if (!isClickable || !budgetId) return;
      
      if (expandedBudgetId === budgetId) {
        setExpandedBudgetId(null); // Collapse if already expanded
      } else {
        setExpandedBudgetId(budgetId); // Expand this one (closes others)
      }
    };

    return (
      <div>
        <Card 
          className={`bg-gradient-card shadow-soft hover:shadow-medium transition-all duration-200 ${
            isClickable ? 'cursor-pointer hover:bg-gradient-card/80' : ''
          } ${isExpanded ? 'ring-2 ring-primary/20 shadow-lg' : ''} ${className}`}
          onClick={handleCardClick}
        >
          <CardContent className="p-4">
            <div className="space-y-3">
              {/* Category Header */}
              <div className="space-y-3">
                {/* Top row: Category name and edit button */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {dragListeners && (
                      <div
                        {...dragListeners}
                        className="flex items-center justify-center w-8 h-full cursor-grab hover:cursor-grabbing active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors hover:bg-muted/20 rounded px-1 select-none touch-manipulation flex-shrink-0"
                        title="Drag to reorder"
                        style={{ touchAction: 'none' }}
                      >
                        <div className="flex flex-col gap-1">
                          <div className="w-1 h-1 bg-current rounded-full"></div>
                          <div className="w-1 h-1 bg-current rounded-full"></div>
                          <div className="w-1 h-1 bg-current rounded-full"></div>
                          <div className="w-1 h-1 bg-current rounded-full"></div>
                          <div className="w-1 h-1 bg-current rounded-full"></div>
                          <div className="w-1 h-1 bg-current rounded-full"></div>
                        </div>
                      </div>
                    )}
                    <span className="font-medium text-foreground truncate">
                      {title}
                    </span>
                    {isClickable && (
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        ({categoryTransactions.length})
                      </span>
                    )}
                  </div>
                  {budget && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-muted-foreground hover:text-foreground flex-shrink-0 ml-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditBudget(budget);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                {/* Amount and progress info row */}
                <div className="space-y-2">
                  {/* Remaining/Over budget info - now on top and larger */}
                  <div className="flex items-center justify-between">
                    <div className={`text-lg font-semibold ${budgetStatus.textClasses}`}>
                      {isOverBudget ? 
                        `${formatCurrency(spent - amount, currency)} ${t('overBudget')}` :
                        `${formatCurrency(amount - spent, currency)} ${t('remaining')}`
                      }
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">
                        {percentage.toFixed(0)}% {t('used')}
                      </div>
                    </div>
                  </div>
                  
                  {/* Spent/Total amounts - now on bottom and smaller */}
                  <div className="text-sm">
                    <span className={budgetStatus.textClasses}>
                      {formatCurrency(spent, currency)}
                    </span>
                    <span className="text-muted-foreground"> / {formatCurrency(amount, currency)}</span>
                  </div>
                </div>
              </div>
              
              {/* Progress Bar */}
              <Progress 
                value={percentage} 
                className="h-3"
                style={{ 
                  '--progress-background': budgetStatus.hslColor
                } as React.CSSProperties}
              />
              
            </div>
          </CardContent>
        </Card>

        {/* Animated Accordion Container */}
        <div className={`grid transition-all duration-300 ease-in-out ${
          isExpanded && isClickable ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}>
          <div className="overflow-hidden">
            <div className="mt-2 pl-4">
              <TransactionAccordion 
                transactions={categoryTransactions}
                category={title}
                language={language}
                onDeleteTransaction={onDeleteTransaction}
                onUpdateTransaction={onUpdateTransaction}
                onUpdateTransactionCategory={onUpdateTransactionCategory}
                availableCategories={availableCategories}
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (budgets.length === 0) {
    return (
      <>
        <div className="flex items-center gap-2 mb-6">
          <BarChart3 className="h-6 w-6 text-primary" />
          <h2 className="text-xl font-semibold text-foreground">{t('budgetSummary')}</h2>
        </div>

        
        <Card className="bg-gradient-card shadow-soft mb-4">
          <CardContent className="p-6">
            <div className="text-center py-6 text-muted-foreground">
              <p>{t('noBudgetsCreated')}</p>
              <p className="text-sm">{t('createFirstBudget')}</p>
            </div>
          </CardContent>
        </Card>
        
        {/* Add Budget Card - matches Add Transaction style */}
        {onAddBudget && (
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <div className="flex items-center justify-center p-4 rounded-lg border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 cursor-pointer transition-all duration-200 bg-gradient-card hover:bg-muted/30 min-h-[80px]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Plus className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-base font-medium text-muted-foreground">{t('addBudget')}</span>
                </div>
              </div>
            </DialogTrigger>
            
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>{t('addNewBudget')}</DialogTitle>
                <DialogDescription>
                  {t('createBudgetCategory')}
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="category">{t('budgetName')}</Label>
                  <Input
                    id="category"
                    placeholder={t('budgetNamePlaceholder')}
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="amount">{t('budgetAmount')} ($)</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder={t('budgetAmountPlaceholder')}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    step="0.01"
                    min="0"
                    required
                  />
                </div>
                
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={handleCancel}>
                    {t('cancel')}
                  </Button>
                  <Button type="submit">{t('addBudget')}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </>
    );
  }

  return (
    <>
      {/* Independent Title */}
      <div className="flex items-center gap-2 mb-6">
        <BarChart3 className="h-6 w-6 text-primary" />
        <h2 className="text-xl font-semibold text-foreground">{t('budgetSummary')}</h2>
      </div>


      {/* All Budget Cards */}
      <div className="space-y-4">
        {/* Total Budget */}
        <BudgetDisplayCard
          title={t('totalBudgetProgress')}
          spent={totalSpent}
          amount={totalBudget}
          currency={primaryCurrency}
        />

        {/* Individual Budget Cards */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={sortedBudgets.map(budget => budget.id)}
            strategy={verticalListSortingStrategy}
          >
            {sortedBudgets.map((budget) => (
              <SortableBudgetCard key={budget.id} budget={budget} />
            ))}
          </SortableContext>
        </DndContext>
      </div>
      
      {/* Add Budget Card - always available when there are budgets */}
      {onAddBudget && (
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <div className="flex items-center justify-center p-4 rounded-lg border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 cursor-pointer transition-all duration-200 bg-gradient-card hover:bg-muted/30 min-h-[80px] mt-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Plus className="h-5 w-5 text-primary" />
                </div>
                <span className="text-base font-medium text-muted-foreground">{t('addBudget')}</span>
              </div>
            </div>
          </DialogTrigger>
          
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{t('addNewBudget')}</DialogTitle>
              <DialogDescription>
                {t('createBudgetCategory')}
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="category-existing">{t('budgetName')}</Label>
                <Input
                  id="category-existing"
                  placeholder={t('budgetNamePlaceholder')}
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="amount-existing">{t('budgetAmount')} ($)</Label>
                <Input
                  id="amount-existing"
                  type="number"
                  placeholder={t('budgetAmountPlaceholder')}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  step="0.01"
                  min="0"
                  required
                />
              </div>
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleCancel}>
                  {t('cancel')}
                </Button>
                <Button type="submit">{t('addBudget')}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Budget Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t('editBudget')}</DialogTitle>
            <DialogDescription>
              {t('updateBudgetDetails')}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-category">{t('budgetName')}</Label>
              <Input
                id="edit-category"
                placeholder={t('budgetNamePlaceholder')}
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-amount">{t('budgetAmount')} ($)</Label>
              <Input
                id="edit-amount"
                type="number"
                placeholder={t('budgetAmountPlaceholder')}
                value={editAmount}
                onChange={(e) => setEditAmount(e.target.value)}
                step="0.01"
                min="0"
                required
              />
            </div>
            
            <DialogFooter className="flex justify-between">
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={handleEditCancel}>
                  {t('cancel')}
                </Button>
                <Button type="submit">{t('updateBudget')}</Button>
              </div>
              {editingBudget && onDeleteBudget && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" type="button">
                      <Trash2 className="h-4 w-4 mr-2" />
                      {t('deleteBudget')}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{t('deleteBudget')}</AlertDialogTitle>
                      <AlertDialogDescription>
                        {t('deleteBudgetConfirm')} "{editingBudget.category}"? {t('actionCannotBeUndoneSimple')}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={() => {
                          onDeleteBudget(editingBudget.id);
                          handleEditCancel();
                        }} 
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {t('delete')}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}