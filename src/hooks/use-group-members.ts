import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Database } from '@/types/database'

type Member = Database['public']['Tables']['members']['Row']
type Profile = Database['public']['Tables']['profiles']['Row']

interface MemberWithProfile extends Member {
  profile?: Profile
}

interface UseGroupMembersReturn {
  members: MemberWithProfile[]
  loading: boolean
  error: Error | null
  refresh: () => Promise<void>
}

export function useGroupMembers(groupId: string): UseGroupMembersReturn {
  const [members, setMembers] = useState<MemberWithProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  async function fetchMembers() {
    try {
      setLoading(true)
      setError(null)

      const { data: memberData, error: memberError } = await supabase
        .from('group_members')
        .select(`
          *,
          member:members!inner(
            *,
            profile:profiles(*)
          )
        `)
        .eq('group_id', groupId)

      if (memberError) throw memberError

      const memberDetails = memberData?.map(gm => ({
        ...gm.member,
        profile: gm.member.profile
      })) as MemberWithProfile[]

      setMembers(memberDetails)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch members'))
      console.error('Error fetching members:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMembers()
  }, [groupId])

  return {
    members,
    loading,
    error,
    refresh: fetchMembers
  }
}
