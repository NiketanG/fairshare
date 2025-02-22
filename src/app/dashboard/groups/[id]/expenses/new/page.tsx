'use client'

import { ExpenseForm, MemberSplit } from '@/components/expense-form'
import { useGroupMembers } from '@/hooks/use-group-members'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { use, useState } from 'react'
import { toast } from 'sonner'
import { useGroup } from '../../../../../../hooks/use-group'
import { getCurrencySymbol } from '../../../../../../components/ui/currency-select'

export default function NewExpensePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [isLoading, setIsLoading] = useState(false)
  const { members, loading: loadingMembers } = useGroupMembers(id)
  const router = useRouter()
  const { group } = useGroup(id)
  const handleSubmit = async (data: {
    description: string
    amount: number
    paidBy: string
    splitType: string
    memberSplits: MemberSplit[]
  }) => {
    try {
      setIsLoading(true)

      const { data: expense, error: expenseError } = await supabase
        .from('expenses')
        .insert([{
          group_id: id,
          description: data.description.trim(),
          amount: data.amount,
          paid_by: data.paidBy
        }])
        .select()
        .single()

      if (expenseError) throw expenseError

      const splits = data.memberSplits.map(split => ({
        expense_id: expense.id,
        member_id: split.memberId,
        amount: split.amount || 0,
        split_type: data.splitType,
        percentage: data.splitType === 'shares'
          ? ((split.shares || 1) / data.memberSplits.reduce((sum, s) => sum + (s.shares || 1), 0)) * 100
          : null
      }))

      const { error: splitsError } = await supabase
        .from('splits')
        .insert(splits)

      if (splitsError) throw splitsError

      toast.success('Expense added successfully!')
      router.push(`/dashboard/groups/${id}`)
      router.refresh()
    } catch (error) {
      console.error('Error adding expense:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to add expense')
    } finally {
      setIsLoading(false)
    }
  }

  if (loadingMembers) {
    return <div>Loading...</div>
  }

  return (
    <div className="container max-w-lg mx-auto py-8">
      <ExpenseForm
        groupCurrency={getCurrencySymbol(group?.currency ?? 'INR')}
        members={members}
        isLoading={isLoading}
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
        title="Add New Expense"
        description="Add a new expense to split with the group"
      />
    </div>
  )
}
