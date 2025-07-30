import { useState, createContext, useContext } from 'react';

type Language = 'english' | 'spanish';

interface Translations {
  [key: string]: {
    english: string;
    spanish: string;
  };
}

const translations: Translations = {
  // Dashboard
  totalExpenses: {
    english: 'Total Expenses',
    spanish: 'Gastos Totales'
  },
  totalBudget: {
    english: 'Total Budget',
    spanish: 'Presupuesto Total'
  },
  remainingBudget: {
    english: 'Remaining Budget',
    spanish: 'Presupuesto Restante'
  },
  transactions: {
    english: 'Transactions',
    spanish: 'Transacciones'
  },
  
  // Actions
  clearAllTransactions: {
    english: 'Clear All Transactions',
    spanish: 'Eliminar Todas las Transacciones'
  },
  clearAllBudgets: {
    english: 'Clear All Budgets',
    spanish: 'Eliminar Todos los Presupuestos'
  },
  selectLanguage: {
    english: 'Select Language',
    spanish: 'Seleccionar Idioma'
  },
  chooseLanguage: {
    english: 'Choose your preferred language for the application.',
    spanish: 'Elige tu idioma preferido para la aplicación.'
  },
  cancel: {
    english: 'Cancel',
    spanish: 'Cancelar'
  },
  apply: {
    english: 'Apply',
    spanish: 'Aplicar'
  },
  
  // Confirmation dialogs
  areYouSureTransactions: {
    english: 'Are you sure you want to delete all',
    spanish: '¿Estás seguro de que quieres eliminar todas las'
  },
  areYouSureBudgets: {
    english: 'Are you sure you want to delete all',
    spanish: '¿Estás seguro de que quieres eliminar todos los'
  },
  transaction: {
    english: 'transaction',
    spanish: 'transacción'
  },
  budget: {
    english: 'budget',
    spanish: 'presupuesto'
  },
  budgets: {
    english: 'budgets',
    spanish: 'presupuestos'
  },
  actionCannotBeUndone: {
    english: 'This action cannot be undone and will reset all budget spending calculations.',
    spanish: 'Esta acción no se puede deshacer y reiniciará todos los cálculos de gastos del presupuesto.'
  },
  actionCannotBeUndoneSimple: {
    english: 'This action cannot be undone.',
    spanish: 'Esta acción no se puede deshacer.'
  },
  
  // Budget section
  budgetSummary: {
    english: 'Budget Summary',
    spanish: 'Resumen del Presupuesto'
  },
  addBudget: {
    english: 'Add Budget',
    spanish: 'Agregar Presupuesto'
  },
  
  // Transactions section
  recentTransactions: {
    english: 'Recent Transactions',
    spanish: 'Transacciones Recientes'
  },
  uncategorizedTransactions: {
    english: 'Uncategorized Transactions',
    spanish: 'Transacciones Sin Categorizar'
  },
  noTransactions: {
    english: 'No transactions found',
    spanish: 'No se encontraron transacciones'
  },
  
  // Expense form
  addNewExpense: {
    english: 'Add New Expense',
    spanish: 'Agregar Nuevo Gasto'
  },
  trackSpending: {
    english: 'Track your spending by adding a new expense.',
    spanish: 'Rastrea tus gastos agregando un nuevo gasto.'
  },
  
  // Notifications
  languageUpdated: {
    english: 'Language Updated',
    spanish: 'Idioma Actualizado'
  },
  languageChangedTo: {
    english: 'Language changed to',
    spanish: 'Idioma cambiado a'
  },
  english: {
    english: 'English',
    spanish: 'Inglés'
  },
  spanish: {
    english: 'Spanish',
    spanish: 'Español'
  },
  
  // More component translations
  amount: {
    english: 'Amount',
    spanish: 'Cantidad'
  },
  description: {
    english: 'Description',
    spanish: 'Descripción'
  },
  category: {
    english: 'Category',
    spanish: 'Categoría'
  },
  date: {
    english: 'Date',
    spanish: 'Fecha'
  },
  addExpense: {
    english: 'Add Expense',
    spanish: 'Agregar Gasto'
  },
  noTransactionsFound: {
    english: 'No transactions found',
    spanish: 'No se encontraron transacciones'
  },
  edit: {
    english: 'Edit',
    spanish: 'Editar'
  },
  delete: {
    english: 'Delete',
    spanish: 'Eliminar'
  },
  save: {
    english: 'Save',
    spanish: 'Guardar'
  },
  
  // Budget Summary translations
  totalBudgetProgress: {
    english: 'Total Budget Progress',
    spanish: 'Progreso del Presupuesto Total'
  },
  ofTotalBudgetUsed: {
    english: 'of total budget used',
    spanish: 'del presupuesto total usado'
  },
  noBudgetsCreated: {
    english: 'No budgets created yet',
    spanish: 'Aún no se han creado presupuestos'
  },
  createFirstBudget: {
    english: 'Create your first budget to see progress here',
    spanish: 'Crea tu primer presupuesto para ver el progreso aquí'
  },
  used: {
    english: 'used',
    spanish: 'usado'
  },
  overBudgetBy: {
    english: 'Over budget by',
    spanish: 'Excede el presupuesto en'
  },
  
  // Transaction List translations
  noTransactionsYet: {
    english: 'No transactions yet',
    spanish: 'Aún no hay transacciones'
  },
  addFirstExpense: {
    english: 'Add your first expense to get started',
    spanish: 'Agrega tu primer gasto para comenzar'
  },
  addTransaction: {
    english: 'Add Transaction',
    spanish: 'Agregar Transacción'
  },
  noCategory: {
    english: 'No Category',
    spanish: 'Sin Categoría'
  },
  selectCategory: {
    english: 'Select category',
    spanish: 'Seleccionar categoría'
  },
  deleteTransaction: {
    english: 'Delete Transaction',
    spanish: 'Eliminar Transacción'
  },
  deleteTransactionConfirm: {
    english: 'Are you sure you want to delete this transaction for',
    spanish: '¿Estás seguro de que quieres eliminar esta transacción de'
  },
  
  // Add Budget translations
  addNewBudget: {
    english: 'Add New Budget',
    spanish: 'Agregar Nuevo Presupuesto'
  },
  createBudgetCategory: {
    english: 'Create a new budget category to track your expenses.',
    spanish: 'Crea una nueva categoría de presupuesto para rastrear tus gastos.'
  },
  budgetName: {
    english: 'Budget Name',
    spanish: 'Nombre del Presupuesto'
  },
  budgetAmount: {
    english: 'Budget Amount',
    spanish: 'Cantidad del Presupuesto'
  },
  budgetNamePlaceholder: {
    english: 'e.g., Groceries, Gas, Entertainment',
    spanish: 'ej., Comestibles, Gasolina, Entretenimiento'
  },
  budgetAmountPlaceholder: {
    english: 'e.g., 500',
    spanish: 'ej., 500'
  }
};

export const useTranslation = (currentLanguage: Language) => {
  const t = (key: string): string => {
    const translation = translations[key];
    if (!translation) {
      console.warn(`Translation key "${key}" not found`);
      return key;
    }
    return translation[currentLanguage];
  };

  return { t };
};