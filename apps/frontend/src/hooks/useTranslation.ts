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

  // New Budget Modal
  newBudget: {
    english: 'New Budget',
    spanish: 'Nuevo Presupuesto'
  },
  suggestedCategories: {
    english: 'Suggested Categories',
    spanish: 'Categorías Sugeridas'
  },
  orCreateCustomCategory: {
    english: 'Or create a custom category',
    spanish: 'O crea una categoría personalizada'
  },
  enterCustomCategory: {
    english: 'Enter custom category',
    spanish: 'Ingresa una categoría personalizada'
  },
  monthlyBudgetAmount: {
    english: 'Monthly Budget Amount',
    spanish: 'Monto del Presupuesto Mensual'
  },
  createBudget: {
    english: 'Create Budget',
    spanish: 'Crear Presupuesto'
  },
  defaultCurrency: {
    english: 'Default Currency',
    spanish: 'Moneda Predeterminada'
  },
  defaultCurrencyDescription: {
    english: 'Select your default currency',
    spanish: 'Selecciona tu moneda predeterminada'
  },
  newCategory: {
    english: 'New Category',
    spanish: 'Nueva Categoría'
  },

  // Budget Setup Options
  guidedSetup: {
    english: 'Guided Setup',
    spanish: 'Configuración Guiada'
  },
  guidedSetupDescription: {
    english: 'Let us help you create personalized budgets step by step',
    spanish: 'Te ayudamos a crear presupuestos personalizados paso a paso'
  },
  quickSetup: {
    english: 'Quick Setup',
    spanish: 'Configuración Rápida'
  },
  quickSetupDescription: {
    english: 'I know my budget amounts - let me enter them manually',
    spanish: 'Conozco mis montos - déjame ingresarlos manualmente'
  },
  chooseSetupMethod: {
    english: 'Choose how you want to set up your budgets',
    spanish: 'Elige cómo quieres configurar tus presupuestos'
  },
  enterBudgetAmounts: {
    english: 'Enter your budget amounts',
    spanish: 'Ingresa los montos de tu presupuesto'
  },
  addCategory: {
    english: 'Add Category',
    spanish: 'Agregar Categoría'
  },
  totalBudget: {
    english: 'Total Budget',
    spanish: 'Presupuesto Total'
  },
  reviewAndCreate: {
    english: 'Review & Create',
    spanish: 'Revisar y Crear'
  },
  creating: {
    english: 'Creating...',
    spanish: 'Creando...'
  },
  createBudgets: {
    english: 'Create Budgets',
    spanish: 'Crear Presupuestos'
  },

  // Budget Period Navigation
  previous: {
    english: 'Previous',
    spanish: 'Anterior'
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
  accountCreatedSuccessfully: {
    english: 'Account created successfully',
    spanish: 'Cuenta creada exitosamente'
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
  continueWithGoogle: {
    english: 'Continue with Google',
    spanish: 'Continuar con Google'
  },
  orContinueWith: {
    english: 'Or continue with',
    spanish: 'O continuar con'
  },
  orUseEmail: {
    english: 'Or use email',
    spanish: 'O usar correo electrónico'
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
  transactionUpdatedSuccess: {
    english: 'Transaction has been successfully updated',
    spanish: 'La transacción se ha actualizado exitosamente'
  },
  editTransaction: {
    english: 'Edit Transaction',
    spanish: 'Editar Transacción'
  },
  editTransactionDescription: {
    english: 'Make changes to your transaction details',
    spanish: 'Realiza cambios en los detalles de tu transacción'
  },
  enterDescription: {
    english: 'Enter description',
    spanish: 'Ingresa una descripción'
  },
  save: {
    english: 'Save',
    spanish: 'Guardar'
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
  },

  // Additional UI elements
  exportAllData: {
    english: 'Export All Data',
    spanish: 'Exportar Todos los Datos'
  },
  lightTheme: {
    english: 'Light Theme',
    spanish: 'Tema Claro'
  },
  darkTheme: {
    english: 'Dark Theme',
    spanish: 'Tema Oscuro'
  },
  theme: {
    english: 'Theme',
    spanish: 'Tema'
  },

  // Month names (full)
  january: {
    english: 'January',
    spanish: 'Enero'
  },
  february: {
    english: 'February',
    spanish: 'Febrero'
  },
  march: {
    english: 'March',
    spanish: 'Marzo'
  },
  april: {
    english: 'April',
    spanish: 'Abril'
  },
  may: {
    english: 'May',
    spanish: 'Mayo'
  },
  june: {
    english: 'June',
    spanish: 'Junio'
  },
  july: {
    english: 'July',
    spanish: 'Julio'
  },
  august: {
    english: 'August',
    spanish: 'Agosto'
  },
  september: {
    english: 'September',
    spanish: 'Septiembre'
  },
  october: {
    english: 'October',
    spanish: 'Octubre'
  },
  november: {
    english: 'November',
    spanish: 'Noviembre'
  },
  december: {
    english: 'December',
    spanish: 'Diciembre'
  },

  // Month abbreviations
  jan: {
    english: 'Jan',
    spanish: 'Ene'
  },
  feb: {
    english: 'Feb',
    spanish: 'Feb'
  },
  mar: {
    english: 'Mar',
    spanish: 'Mar'
  },
  apr: {
    english: 'Apr',
    spanish: 'Abr'
  },
  mayShort: {
    english: 'May',
    spanish: 'May'
  },
  jun: {
    english: 'Jun',
    spanish: 'Jun'
  },
  jul: {
    english: 'Jul',
    spanish: 'Jul'
  },
  aug: {
    english: 'Aug',
    spanish: 'Ago'
  },
  sep: {
    english: 'Sep',
    spanish: 'Sep'
  },
  oct: {
    english: 'Oct',
    spanish: 'Oct'
  },
  nov: {
    english: 'Nov',
    spanish: 'Nov'
  },
  dec: {
    english: 'Dec',
    spanish: 'Dic'
  },

  // Budget Wizard
  createYourFirstBudget: {
    english: 'Get Started',
    spanish: 'Comenzar'
  },
  welcomeToBudgetWizard: {
    english: 'Welcome to Budget Wizard',
    spanish: 'Bienvenido al Asistente de Presupuesto'
  },
  budgetWizardDescription: {
    english: 'Set up your monthly budgets in just a few clicks',
    spanish: 'Configura tus presupuestos mensuales en solo unos clics'
  },
  getStarted: {
    english: 'Get Started',
    spanish: 'Comenzar'
  },
  letsCreateYourBudget: {
    english: 'Let\'s create your budgets',
    spanish: 'Creemos tus presupuestos'
  },
  wizardStep: {
    english: 'Step',
    spanish: 'Paso'
  },
  wizardOf: {
    english: 'of',
    spanish: 'de'
  },

  // Step 1: Income
  monthlyIncome: {
    english: 'Monthly Income',
    spanish: 'Ingresos Mensuales'
  },
  monthlyIncomeDescription: {
    english: 'What is your total monthly income after taxes?',
    spanish: '¿Cuáles son tus ingresos mensuales totales después de impuestos?'
  },
  enterMonthlyIncome: {
    english: 'Enter your monthly income',
    spanish: 'Ingresa tus ingresos mensuales'
  },
  preferredCurrency: {
    english: 'Preferred Currency',
    spanish: 'Moneda Preferida'
  },

  // Step 2: Period Settings
  periodSettings: {
    english: 'Budget Period Settings',
    spanish: 'Configuración de Período del Presupuesto'
  },
  periodSettingsDescription: {
    english: 'Choose how you want to organize your budget periods.',
    spanish: 'Elige cómo quieres organizar tus períodos de presupuesto.'
  },
  budgetPeriodType: {
    english: 'Budget Period Type',
    spanish: 'Tipo de Período de Presupuesto'
  },
  whenDoYouGetPaid: {
    english: 'When do you typically get paid or prefer to budget?',
    spanish: '¿Cuándo sueles recibir tu pago o prefieres presupuestar?'
  },
  dayOfMonth: {
    english: 'Day',
    spanish: 'Día'
  },

  // Step 3: Living Situation & Savings
  livingSituation: {
    english: 'Living Situation & Savings Goal',
    spanish: 'Situación de Vivienda y Meta de Ahorro'
  },
  livingSituationDescription: {
    english: 'Tell us about your living situation to customize your budget.',
    spanish: 'Cuéntanos sobre tu situación de vivienda para personalizar tu presupuesto.'
  },
  relationshipStatus: {
    english: 'Relationship Status',
    spanish: 'Estado Civil'
  },
  single: {
    english: 'Single',
    spanish: 'Soltero/a'
  },
  couple: {
    english: 'Couple',
    spanish: 'Pareja'
  },
  family: {
    english: 'Family with children',
    spanish: 'Familia con hijos'
  },
  housingType: {
    english: 'Housing Type',
    spanish: 'Tipo de Vivienda'
  },
  rent: {
    english: 'Rent',
    spanish: 'Alquiler'
  },
  own: {
    english: 'Own',
    spanish: 'Propia'
  },
  familyHome: {
    english: 'Living with family',
    spanish: 'Viviendo con familia'
  },
  locationType: {
    english: 'Location Type',
    spanish: 'Tipo de Ubicación'
  },
  city: {
    english: 'City',
    spanish: 'Ciudad'
  },
  suburban: {
    english: 'Suburban',
    spanish: 'Suburbano'
  },
  rural: {
    english: 'Rural',
    spanish: 'Rural'
  },

  // Savings Goal
  setSavingsGoal: {
    english: 'Set Your Savings Goal',
    spanish: 'Establece Tu Meta de Ahorro'
  },
  savingsGoal: {
    english: 'Savings Goal',
    spanish: 'Meta de Ahorro'
  },
  savingsGoalDescription: {
    english: 'How much do you want to save each month? This will be set aside before creating your spending budgets.',
    spanish: '¿Cuánto quieres ahorrar cada mes? Esta cantidad se apartará antes de crear tus presupuestos de gastos.'
  },
  savingsAmount: {
    english: 'Savings Amount',
    spanish: 'Cantidad de Ahorro'
  },
  savingsPercentage: {
    english: 'Percentage of Income',
    spanish: 'Porcentaje de Ingresos'
  },
  availableForBudgeting: {
    english: 'Available for Budgeting',
    spanish: 'Disponible para Presupuestar'
  },
  youWillSave: {
    english: 'You\'ll save',
    spanish: 'Ahorrarás'
  },
  leavingForExpenses: {
    english: 'leaving {amount} for expenses',
    spanish: 'dejando {amount} para gastos'
  },
  enterSavingsGoal: {
    english: 'Enter your monthly savings goal',
    spanish: 'Ingresa tu meta de ahorro mensual'
  },
  recommendedSavings: {
    english: 'Recommended: 10-20% of income',
    spanish: 'Recomendado: 10-20% de ingresos'
  },

  // Step 4: Lifestyle
  lifestylePriorities: {
    english: 'Lifestyle Priorities',
    spanish: 'Prioridades de Estilo de Vida'
  },
  lifestylePrioritiesDescription: {
    english: 'What describes your lifestyle? (Select all that apply)',
    spanish: '¿Qué describe tu estilo de vida? (Selecciona todas las que apliquen)'
  },
  foodLover: {
    english: 'Food Lover',
    spanish: 'Amante de la Comida'
  },
  foodLoverDesc: {
    english: 'Love dining out and trying new cuisines',
    spanish: 'Me encanta cenar fuera y probar nuevas cocinas'
  },
  travelEnthusiast: {
    english: 'Travel Enthusiast',
    spanish: 'Entusiasta de Viajes'
  },
  travelEnthusiastDesc: {
    english: 'Enjoy exploring new places and experiences',
    spanish: 'Disfruto explorar nuevos lugares y experiencias'
  },
  techEnthusiast: {
    english: 'Tech Enthusiast',
    spanish: 'Entusiasta de la Tecnología'
  },
  techEnthusiastDesc: {
    english: 'Love gadgets and latest technology',
    spanish: 'Me encantan los gadgets y la última tecnología'
  },
  healthFitness: {
    english: 'Health & Fitness',
    spanish: 'Salud y Fitness'
  },
  healthFitnessDesc: {
    english: 'Prioritize gym, sports, and wellness',
    spanish: 'Priorizo el gimnasio, deportes y bienestar'
  },
  minimalist: {
    english: 'Minimalist',
    spanish: 'Minimalista'
  },
  minimalistDesc: {
    english: 'Prefer simplicity and essential purchases',
    spanish: 'Prefiero la simplicidad y compras esenciales'
  },
  socialButterfly: {
    english: 'Social Butterfly',
    spanish: 'Mariposa Social'
  },
  socialButterflyDesc: {
    english: 'Enjoy entertainment and social activities',
    spanish: 'Disfruto el entretenimiento y actividades sociales'
  },
  homebody: {
    english: 'Homebody',
    spanish: 'Hogareño/a'
  },
  homebodyDesc: {
    english: 'Prefer staying in and home comforts',
    spanish: 'Prefiero quedarme en casa y las comodidades del hogar'
  },
  lifelongLearner: {
    english: 'Lifelong Learner',
    spanish: 'Aprendiz de por Vida'
  },
  lifelongLearnerDesc: {
    english: 'Invest in courses, books, and education',
    spanish: 'Invierto en cursos, libros y educación'
  },

  // Step 5: Budget Suggestions
  budgetSuggestions: {
    english: 'Budget Suggestions',
    spanish: 'Sugerencias de Presupuesto'
  },
  budgetSuggestionsDescription: {
    english: 'Based on your profile, here are our suggested budget categories. You can adjust any amounts before saving.',
    spanish: 'Basado en tu perfil, aquí están nuestras categorías de presupuesto sugeridas. Puedes ajustar cualquier cantidad antes de guardar.'
  },
  suggestedBudgets: {
    english: 'Suggested Budgets',
    spanish: 'Presupuestos Sugeridos'
  },
  totalBudgeted: {
    english: 'Total Budgeted',
    spanish: 'Total Presupuestado'
  },
  ofIncome: {
    english: 'of income',
    spanish: 'de ingresos'
  },
  adjustAmounts: {
    english: 'Adjust amounts as needed',
    spanish: 'Ajusta las cantidades según sea necesario'
  },
  availableForBudgets: {
    english: 'Available for Budgets',
    spanish: 'Disponible para Presupuestos'
  },
  ofAvailable: {
    english: 'of available',
    spanish: 'de disponible'
  },
  adjustBudgetAmounts: {
    english: 'Adjust budget amounts as needed',
    spanish: 'Ajusta las cantidades del presupuesto según sea necesario'
  },

  // Step 6: Review & Save
  reviewAndSave: {
    english: 'Review & Save',
    spanish: 'Revisar y Guardar'
  },
  reviewDescription: {
    english: 'Review your budget breakdown and save to get started with your financial planning.',
    spanish: 'Revisa tu desglose de presupuesto y guarda para comenzar con tu planificación financiera.'
  },
  budgetBreakdown: {
    english: 'Budget Breakdown',
    spanish: 'Desglose del Presupuesto'
  },
  createAllBudgets: {
    english: 'Create All Budgets',
    spanish: 'Crear Todos los Presupuestos'
  },
  budgetCreatedSuccessfully: {
    english: 'Budget Created Successfully!',
    spanish: '¡Presupuesto Creado Exitosamente!'
  },
  budgetCreatedSuccessDescription: {
    english: 'Your personalized budget has been created. You can now start tracking your expenses and managing your finances.',
    spanish: 'Tu presupuesto personalizado ha sido creado. Ahora puedes comenzar a rastrear tus gastos y administrar tus finanzas.'
  },
  failedToCreateBudgets: {
    english: 'Failed to create budgets. Please try again.',
    spanish: 'Error al crear presupuestos. Por favor, inténtalo de nuevo.'
  },

  // Navigation
  back: {
    english: 'Back',
    spanish: 'Atrás'
  },
  next: {
    english: 'Next',
    spanish: 'Siguiente'
  },
  finish: {
    english: 'Finish',
    spanish: 'Finalizar'
  },
  skip: {
    english: 'Skip',
    spanish: 'Omitir'
  },

  // Validation
  pleaseEnterValidIncome: {
    english: 'Please enter a valid monthly income',
    spanish: 'Por favor ingresa un ingreso mensual válido'
  },
  pleaseSelectLivingSituation: {
    english: 'Please select your living situation',
    spanish: 'Por favor selecciona tu situación de vivienda'
  },
  incomeRequired: {
    english: 'Monthly income is required',
    spanish: 'Los ingresos mensuales son requeridos'
  },

  // Gmail Integration
  gmail: {
    english: 'Gmail',
    spanish: 'Gmail'
  },
  gmailIntegration: {
    english: 'Gmail Integration',
    spanish: 'Integración Gmail'
  },
  'gmail.connect': {
    english: 'Connect Gmail',
    spanish: 'Conectar Gmail'
  },
  'gmail.connectTooltip': {
    english: 'Connect your Gmail account to automatically create transactions from your emails',
    spanish: 'Conecta tu cuenta de Gmail para crear automáticamente transacciones desde tus correos'
  },
  'gmail.status.connected': {
    english: 'Connected',
    spanish: 'Conectado'
  },
  'gmail.status.error': {
    english: 'Error',
    spanish: 'Error'
  },
  'gmail.status.syncing': {
    english: 'Syncing',
    spanish: 'Sincronizando'
  },
  'gmail.lastSync.label': {
    english: 'Last sync',
    spanish: 'Última sincronización'
  },
  'gmail.lastSync.justNow': {
    english: 'Just now',
    spanish: 'Justo ahora'
  },
  'gmail.lastSync.minutesAgo': {
    english: '{minutes} minutes ago',
    spanish: 'Hace {minutes} minutos'
  },
  'gmail.lastSync.hoursAgo': {
    english: '{hours} hours ago',
    spanish: 'Hace {hours} horas'
  },
  'gmail.lastSync.daysAgo': {
    english: '{days} days ago',
    spanish: 'Hace {days} días'
  },
  'gmail.unprocessed': {
    english: '{count} unprocessed emails',
    spanish: '{count} correos sin procesar'
  },
  gmailConnected: {
    english: 'Gmail Connected',
    spanish: 'Gmail Conectado'
  },
  gmailConnectedDescription: {
    english: 'Your Gmail account has been successfully connected and will now monitor for transaction emails.',
    spanish: 'Tu cuenta de Gmail se ha conectado exitosamente y ahora monitoreará correos de transacciones.'
  },

  // Gmail Wizard
  gmailWizard: {
    english: 'Gmail Setup Wizard',
    spanish: 'Asistente de Configuración Gmail'
  },
  'gmailWizard.step': {
    english: 'Step',
    spanish: 'Paso'
  },
  'gmailWizard.of': {
    english: 'of',
    spanish: 'de'
  },
  'gmailWizard.getStarted': {
    english: 'Get Started',
    spanish: 'Comenzar'
  },

  // Gmail Wizard - Intro Step
  'gmailWizard.intro.title': {
    english: 'Connect Your Gmail',
    spanish: 'Conecta tu Gmail'
  },
  'gmailWizard.intro.subtitle': {
    english: 'Automate Your Financial Tracking',
    spanish: 'Automatiza tu Seguimiento Financiero'
  },
  'gmailWizard.intro.description': {
    english: 'Connect your Gmail account to automatically create transactions from bank notifications, payment receipts, and purchase confirmations.',
    spanish: 'Conecta tu cuenta de Gmail para crear automáticamente transacciones desde notificaciones bancarias, recibos de pago y confirmaciones de compra.'
  },
  'gmailWizard.intro.benefits.automatic.title': {
    english: 'Automatic Transaction Creation',
    spanish: 'Creación Automática de Transacciones'
  },
  'gmailWizard.intro.benefits.automatic.description': {
    english: 'Transactions are created automatically from your email notifications',
    spanish: 'Las transacciones se crean automáticamente desde tus notificaciones por correo'
  },
  'gmailWizard.intro.benefits.accurate.title': {
    english: 'Accurate Categorization',
    spanish: 'Categorización Precisa'
  },
  'gmailWizard.intro.benefits.accurate.description': {
    english: 'Smart algorithms categorize your transactions based on merchant information',
    spanish: 'Algoritmos inteligentes categorizan tus transacciones basándose en información del comercio'
  },
  'gmailWizard.intro.benefits.secure.title': {
    english: 'Secure & Private',
    spanish: 'Seguro y Privado'
  },
  'gmailWizard.intro.benefits.secure.description': {
    english: 'We only read transaction-related emails and never store your email content',
    spanish: 'Solo leemos correos relacionados con transacciones y nunca almacenamos el contenido de tus correos'
  },

  // Gmail Wizard - Privacy Step
  'gmailWizard.privacy.title': {
    english: 'Privacy & Security',
    spanish: 'Privacidad y Seguridad'
  },
  'gmailWizard.privacy.subtitle': {
    english: 'Your Privacy is Our Priority',
    spanish: 'Tu Privacidad es Nuestra Prioridad'
  },
  'gmailWizard.privacy.description': {
    english: 'We take your privacy seriously. Here\'s exactly what we access and how we protect your data.',
    spanish: 'Tomamos tu privacidad en serio. Aquí está exactamente lo que accedemos y cómo protegemos tus datos.'
  },
  'gmailWizard.privacy.points.readOnly.title': {
    english: 'Read-Only Access',
    spanish: 'Acceso Solo de Lectura'
  },
  'gmailWizard.privacy.points.readOnly.description': {
    english: 'We can only read your emails, never send or delete them',
    spanish: 'Solo podemos leer tus correos, nunca enviarlos o eliminarlos'
  },
  'gmailWizard.privacy.points.encrypted.title': {
    english: 'Encrypted Communication',
    spanish: 'Comunicación Encriptada'
  },
  'gmailWizard.privacy.points.encrypted.description': {
    english: 'All data is transmitted using industry-standard encryption',
    spanish: 'Todos los datos se transmiten usando encriptación de estándar industrial'
  },
  'gmailWizard.privacy.points.noStorage.title': {
    english: 'No Email Storage',
    spanish: 'Sin Almacenamiento de Correos'
  },
  'gmailWizard.privacy.points.noStorage.description': {
    english: 'We extract transaction data and don\'t store email content',
    spanish: 'Extraemos datos de transacciones y no almacenamos contenido de correos'
  },
  'gmailWizard.privacy.points.revoke.title': {
    english: 'Revoke Anytime',
    spanish: 'Revocar en Cualquier Momento'
  },
  'gmailWizard.privacy.points.revoke.description': {
    english: 'You can disconnect Gmail access at any time from your settings',
    spanish: 'Puedes desconectar el acceso a Gmail en cualquier momento desde tu configuración'
  },

  // Gmail Wizard - Connect Step
  'gmailWizard.connect.title': {
    english: 'Connect Account',
    spanish: 'Conectar Cuenta'
  },
  'gmailWizard.connect.subtitle': {
    english: 'Connect Your Gmail Account',
    spanish: 'Conecta tu Cuenta de Gmail'
  },
  'gmailWizard.connect.description': {
    english: 'Click the button below to open Gmail\'s secure authorization page where you can grant permission to access your transaction emails.',
    spanish: 'Haz clic en el botón de abajo para abrir la página de autorización segura de Gmail donde puedes otorgar permiso para acceder a tus correos de transacciones.'
  },
  'gmailWizard.connect.button': {
    english: 'Connect Gmail Account',
    spanish: 'Conectar Cuenta de Gmail'
  },
  'gmailWizard.connect.connecting': {
    english: 'Connecting...',
    spanish: 'Conectando...'
  },
  'gmailWizard.connect.steps.redirect': {
    english: 'You\'ll be redirected to Gmail\'s secure authorization page',
    spanish: 'Serás redirigido a la página de autorización segura de Gmail'
  },
  'gmailWizard.connect.steps.signIn': {
    english: 'Sign in to your Gmail account if prompted',
    spanish: 'Inicia sesión en tu cuenta de Gmail si se te solicita'
  },
  'gmailWizard.connect.steps.permissions': {
    english: 'Review and accept the requested permissions',
    spanish: 'Revisa y acepta los permisos solicitados'
  },
  'gmailWizard.connect.steps.done': {
    english: 'You\'ll be redirected back to continue setup',
    spanish: 'Serás redirigido de vuelta para continuar la configuración'
  },

  // Gmail Wizard - Success Step
  'gmailWizard.success.title': {
    english: 'Success!',
    spanish: '¡Éxito!'
  },
  'gmailWizard.success.subtitle': {
    english: 'Gmail Successfully Connected',
    spanish: 'Gmail Conectado Exitosamente'
  },
  'gmailWizard.success.description': {
    english: 'Your Gmail account is now connected and we\'ll start monitoring for transaction emails. It may take a few minutes for the first transactions to appear.',
    spanish: 'Tu cuenta de Gmail ahora está conectada y comenzaremos a monitorear correos de transacciones. Puede tomar unos minutos para que aparezcan las primeras transacciones.'
  },
  'gmailWizard.success.features.monitoring': {
    english: 'Email monitoring is now active',
    spanish: 'El monitoreo de correo ahora está activo'
  },
  'gmailWizard.success.features.automatic': {
    english: 'Automatic transaction creation enabled',
    spanish: 'Creación automática de transacciones habilitada'
  },
  'gmailWizard.success.features.notifications': {
    english: 'You\'ll receive notifications for new transactions',
    spanish: 'Recibirás notificaciones para nuevas transacciones'
  },
  'gmailWizard.success.next': {
    english: 'You can manage your Gmail integration anytime from the toolbar.',
    spanish: 'Puedes gestionar tu integración de Gmail en cualquier momento desde la barra de herramientas.'
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

  const getMonthName = (monthIndex: number): string => {
    const monthKeys = ['january', 'february', 'march', 'april', 'may', 'june',
                     'july', 'august', 'september', 'october', 'november', 'december'];
    return t(monthKeys[monthIndex]);
  };

  const getMonthAbbreviation = (monthIndex: number): string => {
    const monthKeys = ['jan', 'feb', 'mar', 'apr', 'mayShort', 'jun',
                      'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    return t(monthKeys[monthIndex]);
  };

  const formatDate = (date: Date, options: {
    includeDay?: boolean;
    includeYear?: boolean;
    useAbbreviation?: boolean;
  } = {}): string => {
    const { includeDay = true, includeYear = true, useAbbreviation = false } = options;

    const day = date.getDate();
    const monthIndex = date.getMonth();
    const year = date.getFullYear();

    const monthName = useAbbreviation ? getMonthAbbreviation(monthIndex) : getMonthName(monthIndex);

    if (!includeDay && !includeYear) {
      return monthName;
    } else if (!includeDay) {
      return `${monthName} ${year}`;
    } else if (!includeYear) {
      return `${monthName} ${day}`;
    } else {
      return currentLanguage === 'spanish'
        ? `${day} de ${monthName} de ${year}`
        : `${monthName} ${day}, ${year}`;
    }
  };

  const formatDateRange = (startDate: Date, endDate: Date): string => {
    const locale = currentLanguage === 'spanish' ? 'es-ES' : 'en-US';
    const start = startDate.toLocaleDateString(locale);
    const end = endDate.toLocaleDateString(locale);
    return `${start} - ${end}`;
  };

  return { t, getMonthName, getMonthAbbreviation, formatDate, formatDateRange };
};