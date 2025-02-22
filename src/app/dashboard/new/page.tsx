'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import data from '@emoji-mart/data'
import Picker from '@emoji-mart/react'
import { GroupForm } from '@/components/group-form'

interface Group {
  id: string;
  name: string;
  emoji: string;
  created_by: string;
}

export default function NewGroupPage() {
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('👥')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const pickerRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setShowEmojiPicker(false)
      }
    }

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowEmojiPicker(false)
      }
    }

    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscapeKey)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscapeKey)
    }
  }, [showEmojiPicker])

  const handleSubmit = async (data: GroupFormData) => {
    setIsLoading(true)

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError) throw userError
      if (!user) throw new Error('User not found')

      const { data: group, error: groupError } = await supabase
        .from('groups')
        .insert([{
          name: data.name.trim(),
          emoji: data.emoji,
          currency: data.currency,
          created_by: user.id
        }])
        .select()
        .single()

      if (groupError) throw groupError

      // Add creator as member
      const { error: addMemberError } = await supabase
        .from('group_members')
        .insert([{
          group_id: group.id,
          full_name: user.user_metadata.full_name || user.email?.split('@')[0] || 'Anonymous',
          email: user.email,
          user_id: user.id
        }])

      if (addMemberError) throw addMemberError

      toast.success('Group created successfully!')
      router.push(`/dashboard/groups/${group.id}`)
    } catch (error) {
      console.error('Error creating group:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create group')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen p-8 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-800">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Create New Group</CardTitle>
          <CardDescription>Create a new group to track shared expenses</CardDescription>
        </CardHeader>
        <CardContent>
          <GroupForm
            onSubmit={handleSubmit}
            submitLabel="Create Group"
            loadingLabel="Creating..."
            onCancel={() => router.back()}
          />
        </CardContent>
      </Card>
    </div>
  )
}
