'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { PlusIcon } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Database } from '@/types/database'
import { toast } from 'sonner'

type Group = Database['public']['Tables']['groups']['Row']

export default function DashboardPage() {
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function fetchGroups() {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError) throw userError

        if (!user) {
          console.log('No user found for groups fetch')
          return
        }

        console.log('Fetching groups for user:', user.id)

        // Get all groups where user is creator
        const { data: createdGroups, error: createdError } = await supabase
          .from('groups')
          .select('*')
          .eq('created_by', user.id)

        if (createdError) {
          console.error('Error fetching created groups:', createdError)
          throw createdError
        }

        console.log('Created groups:', createdGroups)
        setGroups(createdGroups || [])

        // Later we can add groups where user is a member
      } catch (error) {
        console.error('Error in groups fetch:', error)
        toast.error(error instanceof Error ? error.message : 'Failed to fetch groups')
      } finally {
        setLoading(false)
      }
    }

    fetchGroups()
  }, [])

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My Groups</h1>
        <div className="space-x-4">
          <Button variant="outline" onClick={handleSignOut}>
            Sign Out
          </Button>
          <Button onClick={() => router.push('/dashboard/new')}>
            <PlusIcon className="w-4 h-4 mr-2" />
            New Group
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-muted rounded w-3/4"></div>
                <div className="h-4 bg-muted rounded w-1/2 mt-2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-4 bg-muted rounded w-1/4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : groups.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map((group) => (
            <Card 
              key={group.id} 
              className="hover:shadow-lg transition-shadow cursor-pointer" 
              onClick={() => router.push(`/dashboard/groups/${group.id}`)}
            >
              <CardHeader>
                <CardTitle className="flex items-center">
                  {group.emoji && <span className="mr-2">{group.emoji}</span>}
                  {group.name}
                </CardTitle>
                <CardDescription>Created {new Date(group.created_at).toLocaleDateString()}</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Add group summary here */}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="text-center py-12">
          <CardHeader>
            <CardTitle>No Groups Yet</CardTitle>
            <CardDescription>Create your first group to start splitting expenses</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/dashboard/new')}>
              <PlusIcon className="w-4 h-4 mr-2" />
              Create First Group
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
