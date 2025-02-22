'use client'

import { ExpenseForm, MemberSplit } from '@/components/expense-form'
import { useGroupMembers } from '@/hooks/use-group-members'
import { supabase } from '@/lib/supabase'
import { Database } from '@/types/database'
import { Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { use, useEffect, useState } from 'react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from '@/components/ui/button'
import { useGroup } from '../../../../../../hooks/use-group'
import { getCurrencySymbol } from '../../../../../../components/ui/currency-select'

type Split = Database['public']['Tables']['splits']['Row']
type Expense = Database['public']['Tables']['expenses']['Row'] & {
  splits?: Split[]
}

export default function ExpensePage({ params }: { params: Promise<{ id: string, expenseId: string }> }) {
  const { id, expenseId } = use(params)
  const [expense, setExpense] = useState<Expense | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { members, loading: loadingMembers } = useGroupMembers(id)
  const router = useRouter()
  const { group } = useGroup(id)


  // Load expense data
  useEffect(() => {
    async function loadExpense() {
      try {
        const { data, error } = await supabase
          .from('expenses')
          .select(`
            *,
            splits (
              member_id,
              amount,
              split_type,
              percentage
            )
          `)
          .eq('id', expenseId)
          .single()

        if (error) throw error
        setExpense(data)
      } catch (error) {
        console.error('Error loading expense:', error)
        toast.error('Failed to load expense')
      }
    }

    loadExpense()
  }, [expenseId])

  const handleSubmit = async (data: {
    description: string
    amount: number
    paidBy: string
    splitType: string
    memberSplits: MemberSplit[]
  }) => {
    try {
      setIsLoading(true)

      // Update expense
      const { error: expenseError } = await supabase
        .from('expenses')
        .update({
          description: data.description.trim(),
          amount: data.amount,
          paid_by: data.paidBy
        })
        .eq('id', expenseId)

      if (expenseError) throw expenseError

      // Delete existing splits
      const { error: deleteError } = await supabase
        .from('splits')
        .delete()
        .eq('expense_id', expenseId)

      if (deleteError) throw deleteError

      // Create new splits
      const splits = data.memberSplits.map(split => ({
        expense_id: expenseId,
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

      toast.success('Expense updated successfully!')
      router.push(`/dashboard/groups/${id}`)
      router.refresh()
    } catch (error) {
      console.error('Error updating expense:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update expense')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    try {
      setIsLoading(true)

      // Delete splits first (due to foreign key constraint)
      const { error: deleteSplitsError } = await supabase
        .from('splits')
        .delete()
        .eq('expense_id', expenseId)

      if (deleteSplitsError) throw deleteSplitsError

      // Then delete the expense
      const { error: deleteExpenseError } = await supabase
        .from('expenses')
        .delete()
        .eq('id', expenseId)

      if (deleteExpenseError) throw deleteExpenseError

      toast.success('Expense deleted successfully!')
      router.push(`/dashboard/groups/${id}`)
      router.refresh()
    } catch (error) {
      console.error('Error deleting expense:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to delete expense')
    } finally {
      setIsLoading(false)
    }
  }

  if (loadingMembers || !expense) {
    return <div>Loading...</div>
  }

  const initialData = {
    description: expense.description,
    amount: expense.amount.toString(),
    paidBy: expense.paid_by,
    splitType: expense.splits?.[0]?.split_type || 'equal',
    memberSplits: members.map(member => {
      const split = expense.splits?.find(s => s.member_id === member.id)
      return {
        memberId: member.id,
        amount: split?.amount || 0,
        shares: split?.percentage ? (split.percentage / 100) : 1,
        included: split ? split.amount > 0 : true
      }
    })
  }

  return (
    <div className="container max-w-lg mx-auto py-8">
      <div className="flex justify-end mb-4">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" className="text-destructive">
              <Trash2 className="w-4 h-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Expense</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this expense? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      <ExpenseForm
        groupCurrency={getCurrencySymbol(group?.currency ?? 'INR')}
        members={members}
        isLoading={isLoading}
        initialData={initialData}
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
        title="Edit Expense"
        description="Update expense details and splits"
      />
    </div>
  )
} 