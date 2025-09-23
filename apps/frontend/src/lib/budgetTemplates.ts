import { DEFAULT_CURRENCY } from "@/config/currencies";

export interface BudgetCategoryTemplate {
  nameEn: string;
  nameEs: string;
  percentage: {
    default: number;
  };
  icon: string;
  descriptionEn: string;
  descriptionEs: string;
}

export interface UserProfile {
  monthlyIncome: number;
  currency: string;
  livingSituation: 'single' | 'couple' | 'family';
  housingType: 'rent' | 'own' | 'family';
  location: 'city' | 'suburban' | 'rural';
  lifestyle: string[];
  savingsGoal: number;
  savingsGoalPercentage: number;
  periodType: 'calendar_month' | 'specific_day';
  specificDay?: number;
}

export interface SuggestedBudget {
  categoryName: string;
  amount: number;
  percentage: number;
  icon: string;
  description: string;
}

// Helper function to get category name based on language
export function getCategoryName(category: BudgetCategoryTemplate, language: 'english' | 'spanish'): string {
  return language === 'spanish' ? category.nameEs : category.nameEn;
}

// Helper function to get category description based on language
export function getCategoryDescription(category: BudgetCategoryTemplate, language: 'english' | 'spanish'): string {
  return language === 'spanish' ? category.descriptionEs : category.descriptionEn;
}

// Helper function to get lifestyle option label based on language
export function getLifestyleLabel(option: typeof LIFESTYLE_OPTIONS[0], language: 'english' | 'spanish'): string {
  return language === 'spanish' ? option.labelEs : option.labelEn;
}

// Helper function to get lifestyle option description based on language
export function getLifestyleDescription(option: typeof LIFESTYLE_OPTIONS[0], language: 'english' | 'spanish'): string {
  return language === 'spanish' ? option.descriptionEs : option.descriptionEn;
}

export const DEFAULT_BUDGET_CATEGORIES: BudgetCategoryTemplate[] = [
  {
    nameEn: 'Supermarket',
    nameEs: 'Supermercado',
    percentage: { default: 20 },
    icon: '🛒',
    descriptionEn: 'Groceries, food, household items',
    descriptionEs: 'Comestibles, comida, artículos para el hogar'
  },
  {
    nameEn: 'Transportation',
    nameEs: 'Transporte',
    percentage: { default: 10 },
    icon: '🚗',
    descriptionEn: 'Car payments, gas, public transit, maintenance',
    descriptionEs: 'Pagos de auto, gasolina, transporte público, mantenimiento'
  },
  {
    nameEn: 'Education',
    nameEs: 'Estudios',
    percentage: { default: 15 },
    icon: '📚',
    descriptionEn: 'Courses, books, school fees, learning materials',
    descriptionEs: 'Cursos, libros, cuotas escolares, materiales de estudio'
  },
  {
    nameEn: 'Home Purchases',
    nameEs: 'Casa',
    percentage: { default: 10 },
    icon: '🏠',
    descriptionEn: 'Home improvements, furniture, appliances',
    descriptionEs: 'Mejoras del hogar, muebles, electrodomésticos'
  },
  {
    nameEn: 'Fun',
    nameEs: 'Diversión',
    percentage: { default: 10 },
    icon: '🎉',
    descriptionEn: 'Entertainment, hobbies, leisure activities',
    descriptionEs: 'Entretenimiento, pasatiempos, actividades de ocio'
  },
  {
    nameEn: 'Restaurants',
    nameEs: 'Restaurantes',
    percentage: { default: 10 },
    icon: '🍽️',
    descriptionEn: 'Dining out, food delivery, cafes',
    descriptionEs: 'Comer fuera, entrega de comida, cafeterías'
  },
  {
    nameEn: 'Utilities',
    nameEs: 'Servicios',
    percentage: { default: 10 },
    icon: '⚡',
    descriptionEn: 'Electricity, water, gas, internet, phone',
    descriptionEs: 'Electricidad, agua, gas, internet, teléfono'
  },
  {
    nameEn: 'Health',
    nameEs: 'Salud y Bienestar',
    percentage: { default: 10 },
    icon: '🏥',
    descriptionEn: 'Healthcare, insurance, medications, wellness',
    descriptionEs: 'Atención médica, seguros, medicamentos, bienestar'
  },
  {
    nameEn: 'Subscriptions',
    nameEs: 'Subscripciones',
    percentage: { default: 5 },
    icon: '📱',
    descriptionEn: 'Streaming services, apps, memberships',
    descriptionEs: 'Servicios de streaming, aplicaciones, membresías'
  }
];

export function calculateSuggestedBudgets(profile: UserProfile, language: 'english' | 'spanish' = 'english'): SuggestedBudget[] {
  const adjustedCategories = adjustCategoriesForProfile(profile);

  // Calculate available income after savings goal
  const availableIncome = profile.monthlyIncome - profile.savingsGoal;

  // Calculate total default percentage to scale properly
  const totalDefaultPercentage = adjustedCategories.reduce((sum, cat) => sum + cat.percentage.default, 0);

  return adjustedCategories.map(category => {
    // Scale percentage based on available income instead of total income
    const scaledPercentage = (category.percentage.default / totalDefaultPercentage) * 100;
    const amount = Math.round((availableIncome * scaledPercentage) / 100);

    return {
      categoryName: getCategoryName(category, language),
      amount,
      percentage: Math.round(scaledPercentage),
      icon: category.icon,
      description: getCategoryDescription(category, language)
    };
  });
}

function adjustCategoriesForProfile(profile: UserProfile): BudgetCategoryTemplate[] {
  const categories = [...DEFAULT_BUDGET_CATEGORIES];

  // Adjust based on housing situation
  if (profile.housingType === 'family') {
    // Living with family - reduce housing costs
    adjustCategory(categories, 'Home Purchases', { default: 5 });
    // Redistribute to education and entertainment
    adjustCategory(categories, 'Education', { default: 20 });
    adjustCategory(categories, 'Fun', { default: 15 });
  } else if (profile.housingType === 'own') {
    // Homeowners typically have higher housing costs
    adjustCategory(categories, 'Home Purchases', { default: 15 });
    adjustCategory(categories, 'Utilities', { default: 15 });
  }

  // Adjust based on living situation
  if (profile.livingSituation === 'family') {
    // Families typically spend more on food and healthcare
    adjustCategory(categories, 'Supermarket', { default: 25 });
    adjustCategory(categories, 'Health', { default: 15 });
    adjustCategory(categories, 'Fun', { default: 5 });
  } else if (profile.livingSituation === 'couple') {
    // Couples often share costs
    adjustCategory(categories, 'Restaurants', { default: 15 });
    adjustCategory(categories, 'Fun', { default: 12 });
  }

  // Adjust based on location
  if (profile.location === 'city') {
    // City living - higher transportation and dining
    adjustCategory(categories, 'Transportation', { default: 15 });
    adjustCategory(categories, 'Restaurants', { default: 15 });
  } else if (profile.location === 'rural') {
    // Rural living - higher transportation and utilities
    adjustCategory(categories, 'Transportation', { default: 15 });
    adjustCategory(categories, 'Utilities', { default: 15 });
  }

  // Adjust based on lifestyle preferences
  if (profile.lifestyle.includes('foodie')) {
    adjustCategory(categories, 'Restaurants', { default: 20 });
    adjustCategory(categories, 'Supermarket', { default: 25 });
  }

  if (profile.lifestyle.includes('traveler')) {
    adjustCategory(categories, 'Fun', { default: 20 });
    adjustCategory(categories, 'Transportation', { default: 15 });
  }

  if (profile.lifestyle.includes('tech')) {
    adjustCategory(categories, 'Subscriptions', { default: 10 });
    adjustCategory(categories, 'Education', { default: 20 });
  }

  if (profile.lifestyle.includes('minimalist')) {
    adjustCategory(categories, 'Supermarket', { default: 15 });
    adjustCategory(categories, 'Fun', { default: 5 });
    adjustCategory(categories, 'Education', { default: 25 });
  }

  if (profile.lifestyle.includes('fitness')) {
    adjustCategory(categories, 'Health', { default: 20 });
    adjustCategory(categories, 'Subscriptions', { default: 8 });
  }

  // Ensure total doesn't exceed 100%
  const totalPercentage = categories.reduce((sum, cat) => sum + cat.percentage.default, 0);
  if (totalPercentage > 100) {
    // Proportionally reduce all categories
    const scaleFactor = 100 / totalPercentage;
    categories.forEach(cat => {
      cat.percentage.default = Math.round(cat.percentage.default * scaleFactor);
    });
  }

  return categories;
}

function adjustCategory(
  categories: BudgetCategoryTemplate[],
  categoryName: string,
  adjustment: { default: number }
): void {
  const category = categories.find(cat => cat.nameEn === categoryName);
  if (category) {
    category.percentage.default = adjustment.default;
  }
}

export const LIFESTYLE_OPTIONS = [
  {
    value: 'foodie',
    labelEn: 'Food Lover',
    labelEs: 'Amante de la Comida',
    emoji: '🍕',
    descriptionEn: 'Love dining out and trying new cuisines',
    descriptionEs: 'Ama salir a cenar y probar nuevas cocinas'
  },
  {
    value: 'traveler',
    labelEn: 'Travel Enthusiast',
    labelEs: 'Entusiasta de Viajes',
    emoji: '✈️',
    descriptionEn: 'Enjoy exploring new places and experiences',
    descriptionEs: 'Disfruta explorando nuevos lugares y experiencias'
  },
  {
    value: 'tech',
    labelEn: 'Tech Enthusiast',
    labelEs: 'Entusiasta de Tecnología',
    emoji: '📱',
    descriptionEn: 'Love gadgets and latest technology',
    descriptionEs: 'Ama los gadgets y la última tecnología'
  },
  {
    value: 'fitness',
    labelEn: 'Health & Fitness',
    labelEs: 'Salud y Ejercicio',
    emoji: '💪',
    descriptionEn: 'Prioritize gym, sports, and wellness',
    descriptionEs: 'Prioriza gimnasio, deportes y bienestar'
  },
  {
    value: 'minimalist',
    labelEn: 'Minimalist',
    labelEs: 'Minimalista',
    emoji: '🧘',
    descriptionEn: 'Prefer simplicity and essential purchases',
    descriptionEs: 'Prefiere simplicidad y compras esenciales'
  },
  {
    value: 'social',
    labelEn: 'Social Butterfly',
    labelEs: 'Mariposa Social',
    emoji: '🎉',
    descriptionEn: 'Enjoy entertainment and social activities',
    descriptionEs: 'Disfruta entretenimiento y actividades sociales'
  },
  {
    value: 'homebody',
    labelEn: 'Homebody',
    labelEs: 'Casero',
    emoji: '🏡',
    descriptionEn: 'Prefer staying in and home comforts',
    descriptionEs: 'Prefiere quedarse en casa y comodidades hogareñas'
  },
  {
    value: 'learner',
    labelEn: 'Lifelong Learner',
    labelEs: 'Aprendiz de por Vida',
    emoji: '📚',
    descriptionEn: 'Invest in courses, books, and education',
    descriptionEs: 'Invierte en cursos, libros y educación'
  }
];

export function createDefaultProfile(): UserProfile {
  return {
    monthlyIncome: 0,
    currency: DEFAULT_CURRENCY,
    livingSituation: 'single',
    housingType: 'rent',
    location: 'city',
    lifestyle: [],
    savingsGoal: 0,
    savingsGoalPercentage: 15,
    periodType: 'calendar_month',
    specificDay: 1
  };
}

export function validateProfile(profile: UserProfile): string[] {
  const errors: string[] = [];

  if (!profile.monthlyIncome || profile.monthlyIncome <= 0) {
    errors.push('Monthly income is required and must be greater than 0');
  }

  if (!profile.currency) {
    errors.push('Currency is required');
  }

  return errors;
}