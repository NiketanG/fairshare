'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useGroupMembers } from '@/hooks/use-group-members'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { use, useEffect, useState } from 'react'
import { toast } from 'sonner'


export default function NewExpensePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [paidBy, setPaidBy] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { members, loading: loadingMembers, error: membersError } = useGroupMembers(id)
  const router = useRouter()

  // Show error if members fetch failed
  useEffect(() => {
    if (membersError) {
      toast.error('Failed to load members')
    }
  }, [membersError])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const amountNum = parseFloat(amount)
      if (isNaN(amountNum)) throw new Error('Invalid amount')

      const { data: expense, error: expenseError } = await supabase
        .from('expenses')
        .insert([{
          group_id: id,
          description: description.trim(),
          amount: amountNum,
          paid_by: paidBy
        }])
        .select()
        .single()

      if (expenseError) throw expenseError

      // Create equal splits for all members
      const splitAmount = amountNum / members.length
      const splits = members.map(member => ({
        expense_id: expense.id,
        member_id: member.id, // Changed from user_id to member_id
        amount: splitAmount,
        split_type: 'equal' // Added split_type as required by schema
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

  return (
    <div className="container max-w-lg mx-auto py-8">
      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => router.back()}
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div>
                <CardTitle>Add New Expense</CardTitle>
                <CardDescription>Add a new expense to split with the group</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                placeholder="What was this expense for?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                placeholder="0.00"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="paidBy">Paid By</Label>
              <Select
                value={paidBy}
                onValueChange={setPaidBy}
                disabled={loadingMembers}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Who paid for this?" />
                </SelectTrigger>
                <SelectContent>
                  {members.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.back()}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !description || !amount || !paidBy}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Expense'
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
