'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useGroupMembers } from '@/hooks/use-group-members'
import { supabase } from '@/lib/supabase'
import { getInitials } from '@/lib/utils'
import { Database } from '@/types/database'
import { ArrowLeft, Plus, UserPlus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { use, useEffect, useState } from 'react'
import { toast } from 'sonner'

type Group = Database['public']['Tables']['groups']['Row']
type Expense = Database['public']['Tables']['expenses']['Row']


export default function GroupPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [group, setGroup] = useState<Group | null>(null)
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const { members, loading: membersLoading, error: membersError } = useGroupMembers(id)
  const router = useRouter()

  useEffect(() => {
    async function loadGroupData() {
      try {
        // Load group details
        const { data: groupData, error: groupError } = await supabase
          .from('groups')
          .select('*')
          .eq('id', id)
          .single()

        if (groupError) throw groupError
        setGroup(groupData)

        const { data: expenseData, error: expenseError } = await supabase
          .from('expenses')
          .select('*, paid_by_member:paid_by(*)')
          .eq('group_id', id)
          .order('created_at', { ascending: false })

        if (expenseError) throw expenseError
        setExpenses(expenseData)
      } catch (error) {
        console.error('Error loading group data:', error)
        toast.error('Failed to load group data')
      } finally {
        setLoading(false)
      }
    }

    loadGroupData()
  }, [id])

  // Show error if members fetch failed
  useEffect(() => {
    if (membersError) {
      toast.error('Failed to load members')
    }
  }, [membersError])

  // Update loading state to consider both group and members loading
  if (loading || membersLoading) {
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
        </div>
      </div>

      <Tabs defaultValue="expenses" className="space-y-4">
        <TabsList>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
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
          {expenses.length > 0 ? (
            <div className="space-y-4">
              {expenses.map((expense) => (
                <Card key={expense.id} className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{expense.description}</h3>
                      <p className="text-sm text-muted-foreground">
                        Paid by {(expense as Expense)?.paid_by_member?.full_name} • {new Date(expense.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <p className="font-medium">${expense.amount.toFixed(2)}</p>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-6 text-center">
              <p className="text-muted-foreground mb-4">No expenses yet</p>
              <Button onClick={handleAddExpense}>
                <Plus className="w-4 h-4 mr-2" />
                Add First Expense
              </Button>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="members" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Members</h2>
            <Button onClick={handleAddMember}>
              <UserPlus className="w-4 h-4 mr-2" />
              Add Member
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {members.map((member) => (
              <Card key={member.id} className="p-4">
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
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="summary" className="space-y-4">
          <h2 className="text-xl font-semibold">Summary</h2>
          <Card className="p-6">
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Total Expenses</h3>
                <p className="text-2xl font-bold">
                  ${expenses.reduce((sum, exp) => sum + exp.amount, 0).toFixed(2)}
                </p>
              </div>
              <div>
                <h3 className="font-medium mb-2">Member Count</h3>
                <p className="text-2xl font-bold">{members.length}</p>
              </div>
              <div>
                <h3 className="font-medium mb-2">Created On</h3>
                <p className="text-muted-foreground">
                  {new Date(group.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
