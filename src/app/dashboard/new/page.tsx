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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError) throw userError
      if (!user) throw new Error('User not found')

      // First, ensure user has a member record
      const { data: member, error: memberError } = await supabase
        .from('members')
        .select()
        .eq('user_id', user.id)
        .single()

      if (memberError) {
        // Create member if doesn't exist, including full_name
        const { data: newMember, error: createMemberError } = await supabase
          .from('members')
          .insert([{ 
            user_id: user.id,
            full_name: user.user_metadata.full_name || user.email?.split('@')[0] || 'Anonymous'
          }])
          .select()
          .single()

        if (createMemberError) throw createMemberError
        if (!newMember) throw new Error('Failed to create member')
      }

      // Create the group
      const { data: group, error: groupError } = await supabase
        .from('groups')
        .insert([{
          name: name.trim(),
          emoji,
          created_by: user.id
        }])
        .select()
        .single()

      if (groupError) throw groupError

      // Add member to group using the member record
      const { error: groupMemberError } = await supabase
        .from('group_members')
        .insert([{
          group_id: group.id,
          member_id: member?.id || (await supabase.from('members').select('id').eq('user_id', user.id).single()).data?.id
        }])

      if (groupMemberError) throw groupMemberError

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
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Create New Group</CardTitle>
            <CardDescription>Create a new group to track shared expenses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                className="text-2xl h-12 w-12 p-0 shrink-0"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                ref={buttonRef}
              >
                {emoji}
              </Button>
              <Input
                placeholder="Enter group name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                minLength={1}
                maxLength={50}
                className="flex-1"
              />
            </div>
            {showEmojiPicker && (
              <div className="absolute z-50 mt-2" ref={pickerRef}>
                <Picker
                  data={data}
                  onEmojiSelect={(emoji: any) => {
                    setEmoji(emoji.native)
                    setShowEmojiPicker(false)
                  }}
                  theme="light"
                />
              </div>
            )}
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
            <Button type="submit" disabled={isLoading || !name.trim()}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Group'
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
