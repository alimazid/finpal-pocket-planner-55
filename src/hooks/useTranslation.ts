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
  budgetDetails: {
    english: 'Budget Details',
    spanish: 'Detalle de Presupuestos'
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
  currency: {
    english: 'Currency',
    spanish: 'Moneda'
  },
  email: {
    english: 'Email',
    spanish: 'Correo Electrónico'
  },
  password: {
    english: 'Password',
    spanish: 'Contraseña'
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
    spanish: 'Presupuesto total'
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
  remaining: {
    english: 'remaining',
    spanish: 'restante'
  },
  overBudget: {
    english: 'over budget',
    spanish: 'sobre presupuesto'
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
  },
  pickADate: {
    english: 'Pick a date',
    spanish: 'Seleccionar fecha'
  },
  whatDidYouSpendOn: {
    english: 'What did you spend on?',
    spanish: '¿En qué gastaste?'
  },
  selectCategoryOptional: {
    english: 'Select a category (optional)',
    spanish: 'Seleccionar una categoría (opcional)'
  },
  noBudgetsAvailable: {
    english: 'No budgets available - will be uncategorized',
    spanish: 'No hay presupuestos disponibles - será sin categorizar'
  },
  
  // Budget Period Navigation
  previous: {
    english: 'Previous',
    spanish: 'Anterior'
  },
  next: {
    english: 'Next',
    spanish: 'Siguiente'
  },
  current: {
    english: 'Current',
    spanish: 'Actual'
  },
  dayRemaining: {
    english: 'day remaining',
    spanish: 'día restante'
  },
  daysRemaining: {
    english: 'days remaining',
    spanish: 'días restantes'
  },
  periodEndsToday: {
    english: 'Period ends today',
    spanish: 'El período termina hoy'
  },
  
  // Accordion transactions
  showing: {
    english: 'Showing',
    spanish: 'Mostrando'
  },
  of: {
    english: 'of',
    spanish: 'de'
  },
  and: {
    english: 'and',
    spanish: 'y'
  },
  
  // Budget editing
  editBudget: {
    english: 'Edit Budget',
    spanish: 'Editar Presupuesto'
  },
  updateBudgetDetails: {
    english: 'Update the budget details for this category.',
    spanish: 'Actualiza los detalles del presupuesto para esta categoría.'
  },
  updateBudget: {
    english: 'Update Budget',
    spanish: 'Actualizar Presupuesto'
  },
  deleteBudget: {
    english: 'Delete Budget',
    spanish: 'Eliminar Presupuesto'
  },
  deleteBudgetConfirm: {
    english: 'Are you sure you want to delete the budget for',
    spanish: '¿Estás seguro de que quieres eliminar el presupuesto para'
  },

  // Authentication
  signIn: {
    english: 'Sign In',
    spanish: 'Iniciar Sesión'
  },
  signUp: {
    english: 'Sign Up',
    spanish: 'Registrarse'
  },
  signInError: {
    english: 'Sign In Error',
    spanish: 'Error de Inicio de Sesión'
  },
  signUpError: {
    english: 'Sign Up Error',
    spanish: 'Error de Registro'
  },
  signOut: {
    english: 'Sign Out',
    spanish: 'Cerrar Sesión'
  },
  enterYourEmail: {
    english: 'Enter your email',
    spanish: 'Ingresa tu correo electrónico'
  },
  enterYourPassword: {
    english: 'Enter your password',
    spanish: 'Ingresa tu contraseña'
  },
  createPassword: {
    english: 'Create a password (min 6 characters)',
    spanish: 'Crear una contraseña (mín. 6 caracteres)'
  },
  createAccount: {
    english: 'Create Account',
    spanish: 'Crear Cuenta'
  },
  checkYourEmail: {
    english: 'Check your email',
    spanish: 'Revisa tu correo electrónico'
  },
  emailConfirmationSent: {
    english: "We've sent you a confirmation link to complete your registration.",
    spanish: 'Te hemos enviado un enlace de confirmación para completar tu registro.'
  },
  signInToAccount: {
    english: 'Sign in to your account or create a new one',
    spanish: 'Inicia sesión en tu cuenta o crea una nueva'
  },

  // Loading and status
  loading: {
    english: 'Loading...',
    spanish: 'Cargando...'
  },
  saving: {
    english: 'Save',
    spanish: 'Guardar'
  },
  savingEllipsis: {
    english: 'Saving...',
    spanish: 'Guardando...'
  },

  // General status messages
  error: {
    english: 'Error',
    spanish: 'Error'
  },
  success: {
    english: 'Success',
    spanish: 'Éxito'
  },
  unexpectedError: {
    english: 'An unexpected error occurred',
    spanish: 'Ocurrió un error inesperado'
  },

  // Toast notifications - Success messages
  expenseAdded: {
    english: 'Expense Added',
    spanish: 'Gasto Agregado'
  },
  budgetCreated: {
    english: 'Budget Created',
    spanish: 'Presupuesto Creado'
  },
  budgetDeleted: {
    english: 'Budget Deleted',
    spanish: 'Presupuesto Eliminado'
  },
  transactionDeleted: {
    english: 'Transaction Deleted',
    spanish: 'Transacción Eliminada'
  },
  transactionUpdated: {
    english: 'Transaction Updated',
    spanish: 'Transacción Actualizada'
  },
  categoryUpdated: {
    english: 'Category Updated',
    spanish: 'Categoría Actualizada'
  },
  allTransactionsCleared: {
    english: 'All Transactions Cleared',
    spanish: 'Todas las Transacciones Eliminadas'
  },
  allBudgetsCleared: {
    english: 'All Budgets Cleared',
    spanish: 'Todos los Presupuestos Eliminados'
  },
  signedOut: {
    english: 'Signed out',
    spanish: 'Sesión cerrada'
  },
  signedOutSuccess: {
    english: "You've been successfully signed out",
    spanish: 'Has cerrado sesión exitosamente'
  },
  welcomeBack: {
    english: 'Welcome back!',
    spanish: '¡Bienvenido de vuelta!'
  },
  signedInSuccessfully: {
    english: "You've successfully signed in.",
    spanish: 'Has iniciado sesión exitosamente.'
  },
  exchangeRateSynced: {
    english: 'Exchange Rate Synced',
    spanish: 'Tipo de Cambio Sincronizado'
  },

  // Toast notifications - Error messages
  failedToAddExpense: {
    english: 'Failed to add expense',
    spanish: 'Error al agregar gasto'
  },
  failedToCreateBudget: {
    english: 'Failed to create budget',
    spanish: 'Error al crear presupuesto'
  },
  budgetExistsForPeriod: {
    english: 'A budget for this category already exists for this period',
    spanish: 'Ya existe un presupuesto para esta categoría en este período'
  },
  failedToClearTransactions: {
    english: 'Failed to clear transactions',
    spanish: 'Error al eliminar transacciones'
  },
  failedToClearBudgets: {
    english: 'Failed to clear budgets',
    spanish: 'Error al eliminar presupuestos'
  },
  failedToSaveLanguagePreference: {
    english: 'Failed to save language preference',
    spanish: 'Error al guardar preferencia de idioma'
  },
  failedToSignOut: {
    english: 'Failed to sign out',
    spanish: 'Error al cerrar sesión'
  },
  syncFailed: {
    english: 'Sync Failed',
    spanish: 'Error de Sincronización'
  },
  failedToSyncExchangeRate: {
    english: 'Failed to sync exchange rate',
    spanish: 'Error al sincronizar tipo de cambio'
  },
  failedToFetchExchangeRate: {
    english: 'Failed to fetch exchange rate',
    spanish: 'Error al obtener tipo de cambio'
  },

  // Period Selection Modal
  periodSelection: {
    english: 'Period Selection',
    spanish: 'Selección de Período'
  },
  periodSelectionDescription: {
    english: 'Choose how you want your budget periods to be calculated.',
    spanish: 'Elige cómo quieres que se calculen tus períodos de presupuesto.'
  },
  calendarMonth: {
    english: 'Calendar Month',
    spanish: 'Mes Calendario'
  },
  specificDay: {
    english: 'Specific Day',
    spanish: 'Día Específico'
  },
  invalidDay: {
    english: 'Invalid Day',
    spanish: 'Día Inválido'
  },
  invalidDayDescription: {
    english: 'Please enter a day between 1 and 31.',
    spanish: 'Por favor ingresa un día entre 1 y 31.'
  },
  calendarMonthDescription: {
    english: 'Budget periods will follow standard calendar months (1st to last day of each month).',
    spanish: 'Los períodos de presupuesto seguirán los meses calendario estándar (del 1 al último día de cada mes).'
  },
  specificDayDescription: {
    english: 'Budget periods will start on a specific day of each month.',
    spanish: 'Los períodos de presupuesto comenzarán en un día específico de cada mes.'
  },
  startOnDay: {
    english: 'Start on day:',
    spanish: 'Comenzar el día:'
  },
  ofEachMonth: {
    english: 'of each month',
    spanish: 'de cada mes'
  },
  budgetPeriod: {
    english: 'Budget Period',
    spanish: 'Período del Presupuesto'
  },
  thisBudgetWillBeCreatedFor: {
    english: 'This budget will be created for:',
    spanish: 'Este presupuesto será creado para:'
  },

  // Form placeholders and labels
  selectCurrency: {
    english: 'Select currency',
    spanish: 'Seleccionar moneda'
  },
  selectALanguage: {
    english: 'Select a language',
    spanish: 'Seleccionar un idioma'
  },
  dragToReorder: {
    english: 'Drag to reorder',
    spanish: 'Arrastra para reordenar'
  },

  // Budget-specific messages
  budgetCreatedFor: {
    english: 'Budget for',
    spanish: 'Presupuesto para'
  },
  hasBeenAdded: {
    english: 'has been added',
    spanish: 'ha sido agregado'
  },
  spentOn: {
    english: 'spent on',
    spanish: 'gastado en'
  },
  amountUpdatedTo: {
    english: 'Amount updated to',
    spanish: 'Cantidad actualizada a'
  },
  categoryUpdatedTo: {
    english: 'Category updated to',
    spanish: 'Categoría actualizada a'
  },
  transactionRemoved: {
    english: 'has been removed',
    spanish: 'ha sido removida'
  },
  relatedTransactionsRemoved: {
    english: 'related transaction',
    spanish: 'transacción relacionada'
  },
  relatedTransactionsRemovedPlural: {
    english: 'related transactions',
    spanish: 'transacciones relacionadas'
  },
  removed: {
    english: 'removed',
    spanish: 'eliminadas'
  },
  transactionsRemoved: {
    english: 'have been removed',
    spanish: 'han sido eliminadas'
  },
  budgetsRemoved: {
    english: 'have been removed',
    spanish: 'han sido eliminados'
  },
  updatedToCurrentRate: {
    english: 'Updated to current rate:',
    spanish: 'Actualizado a la tasa actual:'
  },

  // Create missing from last period feature
  createMissingFromLastPeriod: {
    english: 'Create missing from last period',
    spanish: 'Crear faltantes del período anterior'
  },
  missingBudgetCategories: {
    english: 'missing categories',
    spanish: 'categorías faltantes'
  },
  missingBudgetCategory: {
    english: 'missing category',
    spanish: 'categoría faltante'
  },
  confirmCreateMissing: {
    english: 'Create budgets for these missing categories:',
    spanish: 'Crear presupuestos para estas categorías faltantes:'
  },
  missingBudgetsCreated: {
    english: 'Missing Budgets Created',
    spanish: 'Presupuestos Faltantes Creados'
  },
  createdXMissingBudgets: {
    english: 'Created',
    spanish: 'Se crearon'
  },
  noMissingBudgets: {
    english: 'All categories from last period already exist',
    spanish: 'Todas las categorías del período anterior ya existen'
  },
  fromPreviousPeriod: {
    english: 'from previous period',
    spanish: 'del período anterior'
  },
  createMissingBudgetsDescription: {
    english: 'Add budget categories that exist in the previous period but are missing in the current period.',
    spanish: 'Agregar categorías de presupuesto que existen en el período anterior pero faltan en el período actual.'
  },
  total: {
    english: 'Total',
    spanish: 'Total'
  },
  createMissingBudgets: {
    english: 'Create Missing Budgets',
    spanish: 'Crear Presupuestos Faltantes'
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