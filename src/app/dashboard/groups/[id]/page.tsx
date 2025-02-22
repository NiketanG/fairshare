'use client'

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { getCurrencySymbol } from '@/components/ui/currency-select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MemberWithProfile, useGroupMembers } from '@/hooks/use-group-members'
import { useUser } from '@/hooks/use-user'
import { supabase } from '@/lib/supabase'
import { getInitials } from '@/lib/utils'
import { Database } from '@/types/database'
import { ArrowLeft, Pencil, Plus, Trash2, UserPlus } from 'lucide-react'
import { useRouter, useSearchParams, useRouter as useNavigationRouter } from 'next/navigation'
import { use, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { GroupForm } from '../../../../components/group-form'
import { useGroup } from '@/hooks/use-group'
type Group = Database['public']['Tables']['groups']['Row']
type Expense = Database['public']['Tables']['expenses']['Row'] & {
  splits?: Array<Database['public']['Tables']['splits']['Row']>
  paid_by_member?: MemberWithProfile
}
type Member = Database['public']['Tables']['group_members']['Row']
type Balance = {
  from: string
  to: string
  amount: number
}
type GroupFormData = {
  name: string
  emoji: string
  currency: string
}

export default function GroupPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { group, loading: groupLoading, updateGroup } = useGroup(id)
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const { members, loading: membersLoading, error: membersError } = useGroupMembers(id)
  const { user } = useUser()
  const router = useRouter()
  const navigationRouter = useNavigationRouter()
  const searchParams = useSearchParams()
  const defaultTab = searchParams.get('tab') || 'expenses'
  const [balances, setBalances] = useState<Balance[]>([])

  useEffect(() => {
    async function loadExpenses() {
      try {
        const { data: expenseData, error: expenseError } = await supabase
          .from('expenses')
          .select(`
            *,
            paid_by_member:paid_by(*),
            splits (
              member_id,
              amount
            )
          `)
          .eq('group_id', id)
          .order('created_at', { ascending: false })

        if (expenseError) throw expenseError
        setExpenses(expenseData)

        // Calculate balances
        const calculatedBalances = calculateBalances(expenseData, members)
        setBalances(calculatedBalances)
      } catch (error) {
        console.error('Error loading expenses:', error)
        toast.error('Failed to load expenses')
      } finally {
        setLoading(false)
      }
    }

    loadExpenses()
  }, [id, members])

  // Show error if members fetch failed
  useEffect(() => {
    if (membersError) {
      toast.error('Failed to load members')
    }
  }, [membersError])

  // Update loading state to consider both group and members loading
  if (loading || groupLoading || membersLoading) {
    return (
      <div className="container mx-auto py-8 animate-pulse">
        <div className="h-8 bg-muted rounded w-1/4 mb-8"></div>
        <div className="h-[400px] bg-muted rounded"></div>
      </div>
    )
  }

  if (!group) {
    return (
      <div className="container mx-auto py-8">
        <Card className="p-6 text-center">
          <h2 className="text-lg font-semibold mb-2">Group not found</h2>
          <p className="text-muted-foreground mb-4">This group may have been deleted or you don't have access to it.</p>
          <Button onClick={() => router.push('/dashboard')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </Card>
      </div>
    )
  }

  const handleAddExpense = () => {
    router.push(`/dashboard/groups/${id}/expenses/new`)
  }

  const handleAddMember = () => {
    router.push(`/dashboard/groups/${id}/members/new`)
  }

  const handleDeleteMember = async (memberId: string) => {
    try {
      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('id', memberId)

      if (error) throw error

      toast.success('Member removed successfully')
      router.refresh()
    } catch (error) {
      console.error('Error removing member:', error)
      toast.error('Failed to remove member')
    }
  }

  const handleEditGroup = async (data: GroupFormData) => {
    try {
      await updateGroup({
        name: data.name,
        emoji: data.emoji,
        currency: data.currency
      })
    } catch (error) {
      // Error is already handled by updateGroup
    }
  }

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams)
    params.set('tab', value)
    navigationRouter.push(`/dashboard/groups/${id}?${params.toString()}`)
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => router.push('/dashboard')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <span>{group.emoji}</span>
            {group.name}
          </h1>
          {group.created_by === user?.id && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="ml-2">
                  <Pencil className="w-4 h-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Edit Group</AlertDialogTitle>
                </AlertDialogHeader>
                <GroupForm
                  defaultValues={{
                    name: group.name,
                    emoji: group.emoji,
                    currency: group.currency
                  }}
                  onSubmit={async (data) => {
                    await handleEditGroup(data)
                    const closeButton = document.querySelector('[data-close-dialog]') as HTMLButtonElement
                    closeButton?.click()
                  }}
                  submitLabel="Save Changes"
                  loadingLabel="Saving..."
                  isDialog={true}
                />
                <AlertDialogFooter>
                  <AlertDialogCancel>Close</AlertDialogCancel>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      <Tabs
        defaultValue={defaultTab}
        className="space-y-4"
        onValueChange={handleTabChange}
      >
        <TabsList>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="balances">Balances</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="summary">Summary</TabsTrigger>
        </TabsList>

        <TabsContent value="expenses" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Expenses</h2>
            <Button onClick={handleAddExpense}>
              <Plus className="w-4 h-4 mr-2" />
              Add Expense
            </Button>
          </div>
          <div className="space-y-4">
            {expenses.map((expense) => (
              <Card
                key={expense.id}
                className="p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => router.push(`/dashboard/groups/${id}/expenses/${expense.id}`)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{expense.description}</p>
                    <p className="text-sm text-muted-foreground">
                      Paid by {expense.paid_by_member?.full_name} • {new Date(expense.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <p className="font-medium">{getCurrencySymbol(group.currency)} {expense.amount.toFixed(2)}</p>
                </div>
              </Card>
            ))}
            {expenses.length === 0 && (
              <Card className="p-6 text-center">
                <p className="text-muted-foreground mb-4">No expenses yet</p>
                <Button onClick={handleAddExpense}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Expense
                </Button>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="members" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Members ({members.length})</h2>
            <Button onClick={handleAddMember}>
              <UserPlus className="w-4 h-4 mr-2" />
              Add Member
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {members.map((member) => (
              <Card key={member.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {member.profile?.avatar_url ? (
                      <img
                        src={member.profile.avatar_url}
                        alt={member.full_name}
                        className="w-10 h-10 rounded-full"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-medium">
                        {getInitials(member.full_name)}
                      </div>
                    )}
                    <div>
                      <p className="font-medium">{member.full_name}</p>
                      {(member.profile?.email || member.email) && (
                        <p className="text-sm text-muted-foreground">
                          {member.profile?.email || member.email}
                        </p>
                      )}
                    </div>
                  </div>
                  {group.created_by === user?.id && member.user_id !== user?.id && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remove Member</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to remove {member.full_name} from the group?
                            This will also remove their expense history.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteMember(member.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Remove
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>


        <TabsContent value="payments" className="space-y-4">
          <h2 className="text-xl font-semibold">Payments</h2>
          <Card className="p-6">
            <div>
              <div className="space-y-2">
                {members.map(member => {
                  const totalPaid = expenses
                    .filter(exp => exp.paid_by === member.id)
                    .reduce((sum, exp) => sum + exp.amount, 0)

                  if (totalPaid === 0) return null

                  return (
                    <div key={member.id} className="flex items-center justify-between text-sm">
                      <span className="font-medium">{member.full_name}</span>
                      <span className="text-muted-foreground">
                        paid {getCurrencySymbol(group.currency)} {totalPaid.toFixed(2)}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="balances" className="space-y-4">
          <h2 className="text-xl font-semibold">Balances</h2>
          <Card className="p-6">
            <div>
              <div className="space-y-2">
                {balances.length > 0 ? (
                  balances.map((balance, index) => {
                    const fromMember = members.find(m => m.id === balance.from)
                    const toMember = members.find(m => m.id === balance.to)
                    return (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <span>
                          <span className="font-medium">{fromMember?.full_name}</span>
                          <span className="text-muted-foreground"> owes </span>
                          <span className="font-medium">{toMember?.full_name}</span>
                        </span>
                        <span className="font-medium">
                          {getCurrencySymbol(group.currency)} {balance.amount.toFixed(2)}
                        </span>
                      </div>
                    )
                  })
                ) : (
                  <p className="text-muted-foreground">All settled up!</p>
                )}
              </div>
            </div>
          </Card>
        </TabsContent>
        <TabsContent value="summary" className="space-y-4">
          <h2 className="text-xl font-semibold">Summary</h2>
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex justify-between">
                <div className="w-1/2">
                  <h3 className="font-medium mb-2">Total Expenses</h3>
                  <p className="text-2xl font-bold">
                    {getCurrencySymbol(group.currency)} {expenses.reduce((sum, exp) => sum + exp.amount, 0).toFixed(2)}
                  </p>
                </div>
                <div className="w-1/2">
                  <h3 className="font-medium mb-2">Member Count</h3>
                  <p className="text-2xl font-bold">{members.length}</p>
                </div>
              </div>

              <div>
                <h3 className="font-medium">Created On</h3>
                <p className="text-muted-foreground">
                  {new Date(group.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div >
  )
}

function calculateBalances(expenses: Expense[], members: Member[]): Balance[] {
  // Track how much each person has paid and owes
  const netAmounts = new Map<string, number>()

  // Initialize all members with 0
  members.forEach(member => {
    netAmounts.set(member.id, 0)
  })

  // Calculate net amounts (positive means they're owed money, negative means they owe)
  expenses.forEach(expense => {
    const paidBy = expense.paid_by
    const paidAmount = expense.amount

    // Add the amount to what the payer has paid
    netAmounts.set(paidBy, (netAmounts.get(paidBy) || 0) + paidAmount)

    // Subtract the split amounts from each member
    expense.splits?.forEach(split => {
      netAmounts.set(split.member_id, (netAmounts.get(split.member_id) || 0) - split.amount)
    })
  })

  // Convert net amounts to a list of balances
  const balances: Balance[] = []
  const entries = Array.from(netAmounts.entries())

  // Sort by amount to handle largest debts first
  entries.sort((a, b) => a[1] - b[1])

  let i = 0 // index for people who owe money (negative balance)
  let j = entries.length - 1 // index for people who are owed money (positive balance)

  while (i < j) {
    const [debtorId, debtorBalance] = entries[i]
    const [creditorId, creditorBalance] = entries[j]

    if (Math.abs(debtorBalance) < 0.01 || creditorBalance < 0.01) {
      // Skip if either balance is effectively zero
      if (Math.abs(debtorBalance) < 0.01) i++
      if (creditorBalance < 0.01) j--
      continue
    }

    // Calculate the amount that can be settled
    const amount = Math.min(Math.abs(debtorBalance), creditorBalance)

    if (amount > 0.01) {
      balances.push({
        from: debtorId,
        to: creditorId,
        amount: Number(amount.toFixed(2))
      })
    }

    // Update the balances
    entries[i][1] += amount
    entries[j][1] -= amount

    // Move indices if balances are settled
    if (Math.abs(entries[i][1]) < 0.01) i++
    if (entries[j][1] < 0.01) j--
  }

  return balances
}
