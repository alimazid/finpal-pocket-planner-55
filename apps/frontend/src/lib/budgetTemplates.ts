import { DEFAULT_CURRENCY } from "@/config/currencies";

export interface BudgetCategoryTemplate {
  name: string;
  percentage: {
    min: number;
    max: number;
    default: number;
  };
  icon: string;
  description: string;
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

export const DEFAULT_BUDGET_CATEGORIES: BudgetCategoryTemplate[] = [
  {
    name: 'Housing',
    percentage: { min: 25, max: 35, default: 30 },
    icon: '🏠',
    description: 'Rent, mortgage, property taxes, home insurance'
  },
  {
    name: 'Food & Dining',
    percentage: { min: 10, max: 18, default: 12 },
    icon: '🍽️',
    description: 'Groceries, restaurants, meal delivery'
  },
  {
    name: 'Transportation',
    percentage: { min: 10, max: 20, default: 15 },
    icon: '🚗',
    description: 'Car payments, gas, public transit, maintenance'
  },
  {
    name: 'Utilities',
    percentage: { min: 5, max: 10, default: 7 },
    icon: '⚡',
    description: 'Electricity, water, gas, internet, phone'
  },
  {
    name: 'Entertainment',
    percentage: { min: 5, max: 12, default: 7 },
    icon: '🎬',
    description: 'Movies, games, subscriptions, hobbies'
  },
  {
    name: 'Shopping',
    percentage: { min: 5, max: 12, default: 7 },
    icon: '🛍️',
    description: 'Clothing, personal items, household goods'
  },
  {
    name: 'Healthcare',
    percentage: { min: 3, max: 8, default: 5 },
    icon: '🏥',
    description: 'Insurance, doctor visits, medications'
  },
  {
    name: 'Personal Care',
    percentage: { min: 2, max: 5, default: 3 },
    icon: '💅',
    description: 'Haircuts, spa, beauty products, gym'
  },
  {
    name: 'Miscellaneous',
    percentage: { min: 3, max: 8, default: 5 },
    icon: '📋',
    description: 'Gifts, donations, unexpected expenses'
  }
];

export function calculateSuggestedBudgets(profile: UserProfile): SuggestedBudget[] {
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
      categoryName: category.name,
      amount,
      percentage: Math.round(scaledPercentage),
      icon: category.icon,
      description: category.description
    };
  });
}

function adjustCategoriesForProfile(profile: UserProfile): BudgetCategoryTemplate[] {
  const categories = [...DEFAULT_BUDGET_CATEGORIES];

  // Adjust based on housing situation
  if (profile.housingType === 'family') {
    // Living with family - reduce housing costs
    adjustCategory(categories, 'Housing', { default: 15 });
    // Redistribute to savings and entertainment
    adjustCategory(categories, 'Savings', { default: 20 });
    adjustCategory(categories, 'Entertainment', { default: 10 });
  } else if (profile.housingType === 'own') {
    // Homeowners typically have higher housing costs
    adjustCategory(categories, 'Housing', { default: 33 });
    adjustCategory(categories, 'Savings', { default: 12 });
  }

  // Adjust based on living situation
  if (profile.livingSituation === 'family') {
    // Families typically spend more on food and healthcare
    adjustCategory(categories, 'Food & Dining', { default: 15 });
    adjustCategory(categories, 'Healthcare', { default: 7 });
    adjustCategory(categories, 'Entertainment', { default: 5 });
  } else if (profile.livingSituation === 'couple') {
    // Couples often share costs
    adjustCategory(categories, 'Food & Dining', { default: 13 });
    adjustCategory(categories, 'Entertainment', { default: 8 });
  }

  // Adjust based on location
  if (profile.location === 'city') {
    // City living - higher transportation, lower personal transport
    adjustCategory(categories, 'Transportation', { default: 18 });
    adjustCategory(categories, 'Entertainment', { default: 9 });
  } else if (profile.location === 'rural') {
    // Rural living - higher transportation costs for personal vehicles
    adjustCategory(categories, 'Transportation', { default: 17 });
    adjustCategory(categories, 'Utilities', { default: 8 });
  }

  // Adjust based on lifestyle preferences
  if (profile.lifestyle.includes('foodie')) {
    adjustCategory(categories, 'Food & Dining', { default: 16 });
    adjustCategory(categories, 'Savings', { default: 12 });
  }

  if (profile.lifestyle.includes('traveler')) {
    adjustCategory(categories, 'Entertainment', { default: 12 });
    adjustCategory(categories, 'Savings', { default: 12 });
  }

  if (profile.lifestyle.includes('tech')) {
    adjustCategory(categories, 'Shopping', { default: 10 });
    adjustCategory(categories, 'Entertainment', { default: 9 });
  }

  if (profile.lifestyle.includes('minimalist')) {
    adjustCategory(categories, 'Shopping', { default: 4 });
    adjustCategory(categories, 'Entertainment', { default: 5 });
    adjustCategory(categories, 'Savings', { default: 20 });
  }

  if (profile.lifestyle.includes('fitness')) {
    adjustCategory(categories, 'Personal Care', { default: 5 });
    adjustCategory(categories, 'Healthcare', { default: 6 });
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
  const category = categories.find(cat => cat.name === categoryName);
  if (category) {
    category.percentage.default = Math.max(
      category.percentage.min,
      Math.min(category.percentage.max, adjustment.default)
    );
  }
}

export const LIFESTYLE_OPTIONS = [
  { value: 'foodie', label: 'Food Lover', emoji: '🍕', description: 'Love dining out and trying new cuisines' },
  { value: 'traveler', label: 'Travel Enthusiast', emoji: '✈️', description: 'Enjoy exploring new places and experiences' },
  { value: 'tech', label: 'Tech Enthusiast', emoji: '📱', description: 'Love gadgets and latest technology' },
  { value: 'fitness', label: 'Health & Fitness', emoji: '💪', description: 'Prioritize gym, sports, and wellness' },
  { value: 'minimalist', label: 'Minimalist', emoji: '🧘', description: 'Prefer simplicity and essential purchases' },
  { value: 'social', label: 'Social Butterfly', emoji: '🎉', description: 'Enjoy entertainment and social activities' },
  { value: 'homebody', label: 'Homebody', emoji: '🏡', description: 'Prefer staying in and home comforts' },
  { value: 'learner', label: 'Lifelong Learner', emoji: '📚', description: 'Invest in courses, books, and education' }
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