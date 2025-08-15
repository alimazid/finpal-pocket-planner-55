import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RecalculateRequest {
  userId: string
  periodType: 'calendar_month' | 'specific_day'
  specificDay: number
}

interface Budget {
  id: string
  category: string
  amount: number
  currency: string
  sort_order: number
  created_at: string
  period_start: string
  period_end: string
  user_id: string
}

function calculatePeriodDates(
  createdAt: string,
  periodType: 'calendar_month' | 'specific_day',
  specificDay: number
): { periodStart: string; periodEnd: string } {
  const createdDate = new Date(createdAt)
  const year = createdDate.getFullYear()
  const month = createdDate.getMonth()
  
  if (periodType === 'calendar_month') {
    // Standard calendar month
    const startDate = new Date(year, month, 1)
    const endDate = new Date(year, month + 1, 0) // Last day of month
    
    return {
      periodStart: startDate.toISOString().split('T')[0],
      periodEnd: endDate.toISOString().split('T')[0]
    }
  } else {
    // Specific day periods
    let startDate = new Date(year, month, specificDay)
    
    // If the created date is before the cutoff day, budget belongs to previous period
    if (createdDate.getDate() < specificDay) {
      startDate = new Date(year, month - 1, specificDay)
    }
    
    const endDate = new Date(startDate)
    endDate.setMonth(endDate.getMonth() + 1)
    endDate.setDate(endDate.getDate() - 1)
    
    return {
      periodStart: startDate.toISOString().split('T')[0],
      periodEnd: endDate.toISOString().split('T')[0]
    }
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { userId, periodType, specificDay }: RecalculateRequest = await req.json()

    console.log(`Recalculating budgets for user ${userId} with period type: ${periodType}, specific day: ${specificDay}`)

    // Get all budgets for the user
    const { data: budgets, error: budgetsError } = await supabase
      .from('budgets')
      .select('id, category, amount, currency, sort_order, created_at, period_start, period_end, user_id')
      .eq('user_id', userId)

    if (budgetsError) {
      console.error('Error fetching budgets:', budgetsError)
      throw budgetsError
    }

    if (!budgets || budgets.length === 0) {
      console.log('No budgets found for user')
      return new Response(
        JSON.stringify({ message: 'No budgets found for user', updated: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Found ${budgets.length} budgets to update`)

    // Update each budget with new period dates
    const updatePromises = budgets.map(async (budget: Budget) => {
      const { periodStart, periodEnd } = calculatePeriodDates(
        budget.created_at,
        periodType,
        specificDay
      )

      console.log(`Updating budget ${budget.id} (${budget.category}) from ${budget.period_start}-${budget.period_end} to ${periodStart}-${periodEnd}`)

      const { error: updateError } = await supabase
        .from('budgets')
        .update({
          period_start: periodStart,
          period_end: periodEnd
        })
        .eq('id', budget.id)

      if (updateError) {
        console.error(`Error updating budget ${budget.id}:`, updateError)
        throw updateError
      }

      // Recalculate spent amount for the new period
      const { data: transactions, error: transactionsError } = await supabase
        .from('transactions')
        .select('amount, currency')
        .eq('user_id', budget.user_id)
        .eq('category', budget.category)
        .eq('type', 'expense')
        .gte('date', periodStart)
        .lte('date', periodEnd)

      if (transactionsError) {
        console.error(`Error fetching transactions for budget ${budget.id}:`, transactionsError)
        throw transactionsError
      }

      // Calculate total spent with currency conversion using the database function
      let totalSpent = 0
      for (const transaction of transactions || []) {
        if (transaction.currency === budget.currency) {
          totalSpent += transaction.amount
        } else {
          // Use the database function to get exchange rate
          const { data: exchangeRateResult, error: exchangeError } = await supabase
            .rpc('get_exchange_rate', {
              p_from_currency: transaction.currency,
              p_to_currency: budget.currency
            })

          if (exchangeError) {
            console.error(`Error getting exchange rate from ${transaction.currency} to ${budget.currency}:`, exchangeError)
            // Fallback to 1:1 if exchange rate fails
            totalSpent += transaction.amount
          } else {
            const convertedAmount = transaction.amount * (exchangeRateResult || 1)
            totalSpent += convertedAmount
          }
        }
      }

      // Update the spent amount
      const { error: spentUpdateError } = await supabase
        .from('budgets')
        .update({ spent: totalSpent })
        .eq('id', budget.id)

      if (spentUpdateError) {
        console.error(`Error updating spent amount for budget ${budget.id}:`, spentUpdateError)
        throw spentUpdateError
      }

      console.log(`Updated budget ${budget.id} spent amount to ${totalSpent}`)

      return budget.id
    })

    // Execute all updates
    const updatedBudgetIds = await Promise.all(updatePromises)

    console.log(`Successfully updated ${updatedBudgetIds.length} budgets`)

    return new Response(
      JSON.stringify({ 
        message: 'Budgets recalculated successfully',
        updated: updatedBudgetIds.length,
        budgetIds: updatedBudgetIds
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in recalculate-user-budgets function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})