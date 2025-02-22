'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Database } from '@/types/database'
import { toast } from 'sonner'

type Group = Database['public']['Tables']['groups']['Row']

export function useGroup(id: string) {
  const [group, setGroup] = useState<Group | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function loadGroup() {
      try {
        setLoading(true)
        setError(null)

        const { data, error: groupError } = await supabase
          .from('groups')
          .select('*')
          .eq('id', id)
          .single()

        if (groupError) throw groupError

        setGroup(data)
      } catch (err) {
        console.error('Error loading group:', err)
        setError(err instanceof Error ? err : new Error('Failed to load group'))
        toast.error('Failed to load group')
      } finally {
        setLoading(false)
      }
    }

    loadGroup()
  }, [id])

  const updateGroup = async (updates: Partial<Group>) => {
    try {
      const { error } = await supabase
        .from('groups')
        .update(updates)
        .eq('id', id)

      if (error) throw error

      setGroup(prev => prev ? { ...prev, ...updates } : null)
      toast.success('Group updated successfully')
    } catch (err) {
      console.error('Error updating group:', err)
      toast.error('Failed to update group')
      throw err
    }
  }

  return {
    group,
    loading,
    error,
    updateGroup
  }
} 