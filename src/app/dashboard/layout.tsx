'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Database } from '@/types/database'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'

type Profile = Database['public']['Tables']['profiles']['Row']

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadProfile() {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError) throw userError
        
        if (!user) {
          console.log('No user found')
          return
        }

        console.log('User found:', { id: user.id, metadata: user.user_metadata })

        // Try to get existing profile
        const { data: profile, error: fetchError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        console.log('Profile fetch result:', { profile, error: fetchError })

        if (fetchError) {
          if (fetchError.code === 'PGRST116') { // Record not found
            console.log('Creating new profile for user:', user.id)
            
            const newProfileData = {
              id: user.id,
              full_name: user.user_metadata.full_name,
              avatar_url: user.user_metadata.avatar_url,
            }
            
            console.log('Attempting to insert profile:', newProfileData)
            
            const { data: newProfile, error: insertError } = await supabase
              .from('profiles')
              .insert([newProfileData])
              .select()
              .single()

            console.log('Profile insert result:', { newProfile, error: insertError })

            if (insertError) {
              console.error('Failed to insert profile:', insertError)
              throw insertError
            }
            
            setProfile(newProfile)
            toast.success('Profile created successfully')
          } else {
            console.error('Error fetching profile:', fetchError)
            throw fetchError
          }
        } else {
          console.log('Existing profile found:', profile)
          setProfile(profile)
        }
      } catch (error) {
        console.error('Error in profile management:', error)
        toast.error(error instanceof Error ? error.message : 'Failed to load user profile')
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">FairShare</h1>
            <div className="flex items-center space-x-4">
              {loading ? (
                <Skeleton className="h-10 w-10 rounded-full" />
              ) : (
                <Avatar>
                  <AvatarImage src={profile?.avatar_url || undefined} />
                  <AvatarFallback>
                    {profile?.full_name?.[0]?.toUpperCase() || '?'}
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          </div>
        </div>
      </header>
      <main>{children}</main>
    </div>
  )
}
