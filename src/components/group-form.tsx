'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2 } from 'lucide-react'
import data from '@emoji-mart/data'
import Picker from '@emoji-mart/react'
import { CurrencySelect } from '@/components/ui/currency-select'
import { Label } from '@/components/ui/label'

interface GroupFormData {
    name: string
    emoji: string
    currency: string
}

interface GroupFormProps {
    defaultValues?: GroupFormData
    onSubmit: (data: GroupFormData) => Promise<void>
    submitLabel: string
    loadingLabel: string
    onCancel?: () => void
    isDialog?: boolean // To adjust styling for dialog vs page
}

export function GroupForm({
    defaultValues = {
        name: '',
        emoji: '👥',
        currency: 'INR'
    },
    onSubmit,
    submitLabel,
    loadingLabel,
    onCancel,
    isDialog = false
}: GroupFormProps) {
    const [formData, setFormData] = useState<GroupFormData>(defaultValues)
    const [showEmojiPicker, setShowEmojiPicker] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
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

    const handleSubmitForm = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        try {
            await onSubmit(formData)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmitForm}>
            <div className={isDialog ? "space-y-4 pt-4" : ""}>
                <div className="flex items-center gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        className="text-2xl h-12 w-12 p-0 shrink-0"
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        ref={buttonRef}
                    >
                        {formData.emoji}
                    </Button>
                    <Input
                        placeholder="Enter group name"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
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
                                setFormData(prev => ({ ...prev, emoji: emoji.native }))
                                setShowEmojiPicker(false)
                            }}
                            theme="light"
                        />
                    </div>
                )}
                <div className="space-y-2 mt-4">
                    <Label htmlFor="currency">Currency</Label>
                    <CurrencySelect
                        value={formData.currency}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value }))}
                    />
                </div>
            </div>
            <div className={`flex justify-end gap-2 mt-4`}>
                {onCancel && (
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={onCancel}
                        disabled={isLoading}
                    >
                        Cancel
                    </Button>
                )}
                <Button type="submit" disabled={isLoading || !formData.name.trim()}>
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {loadingLabel}
                        </>
                    ) : (
                        submitLabel
                    )}
                </Button>
            </div>
        </form>
    )
} 