'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SegmentedButton } from "@/components/ui/segmented-button"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import { ArrowLeft, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Database } from '@/types/database'
import { useUser } from '../hooks/use-user'

type Member = Database['public']['Tables']['members']['Row']
type SplitType = 'equal' | 'custom' | 'shares'

export type MemberSplit = {
  memberId: string
  amount?: number
  shares?: number
  included: boolean
}

interface ExpenseFormProps {
  members: Member[]
  isLoading: boolean
  isEditing?: boolean
  initialData?: {
    description: string
    amount: string
    paidBy: string
    splitType: SplitType
    memberSplits: MemberSplit[]
  }
  onSubmit: (data: {
    description: string
    amount: number
    paidBy: string
    splitType: SplitType
    memberSplits: MemberSplit[]
  }) => Promise<void>
  onCancel: () => void
  title: string
  description?: string
  groupCurrency: string
}

const SPLIT_OPTIONS: Array<{ value: SplitType; label: string }> = [
  { value: 'equal', label: 'Equal Split' },
  { value: 'custom', label: 'Exact Amounts' },
  { value: 'shares', label: 'By Shares' },
]

export function ExpenseForm({
  members,
  isLoading,
  isEditing = true,
  initialData,
  onSubmit,
  onCancel,
  title,
  description,
  groupCurrency
}: ExpenseFormProps) {

  const { user } = useUser()



  const [formData, setFormData] = useState({
    description: initialData?.description || '',
    amount: initialData?.amount || '',
    paidBy: initialData?.paidBy || user?.id || '',
    splitType: initialData?.splitType || 'equal' as SplitType,
    memberSplits: initialData?.memberSplits || members.map(member => ({
      memberId: member.id,
      amount: 0,
      shares: 1,
      included: true
    }))
  })


  // Calculate splits based on type and amount changes
  useEffect(() => {
    if (!formData.amount || members.length === 0) return

    const totalAmount = parseFloat(formData.amount)
    if (isNaN(totalAmount)) return

    const currentSplits = [...formData.memberSplits]

    if (formData.splitType === 'equal') {
      const includedMembers = currentSplits.filter(split => split.included)
      const includedCount = includedMembers.length
      if (includedCount === 0) return

      const splitAmount = Number((totalAmount / includedCount).toFixed(2))

      // Calculate the rounding difference
      const totalSplitAmount = splitAmount * (includedCount - 1)
      const lastPersonAmount = Number((totalAmount - totalSplitAmount).toFixed(2))

      const newSplits = currentSplits.map((split, index) => ({
        ...split,
        amount: split.included
          ? (index === currentSplits.length - 1 ? lastPersonAmount : splitAmount)
          : 0
      }))

      setFormData(prev => ({ ...prev, memberSplits: newSplits }))
    } else if (formData.splitType === 'shares') {
      const totalShares = currentSplits.reduce((sum, split) => sum + (split.shares || 1), 0)
      const newSplits = currentSplits.map(split => ({
        ...split,
        amount: Number((totalAmount * ((split.shares || 1) / totalShares)).toFixed(2))
      }))
      setFormData(prev => ({ ...prev, memberSplits: newSplits }))
    }
  }, [formData.amount, formData.splitType, members.length])

  const handleIncludedChange = (memberId: string, checked: boolean) => {
    setFormData(prev => {
      const updated = prev.memberSplits.map(split =>
        split.memberId === memberId
          ? { ...split, included: checked }
          : split
      )

      if (prev.splitType === 'equal') {
        const totalAmount = parseFloat(prev.amount)
        if (!isNaN(totalAmount)) {
          const includedCount = updated.filter(split => split.included).length
          if (includedCount > 0) {
            const splitAmount = totalAmount / includedCount
            return {
              ...prev,
              memberSplits: updated.map(split => ({
                ...split,
                amount: split.included ? Number(splitAmount.toFixed(2)) : 0
              }))
            }
          }
        }
      }

      return { ...prev, memberSplits: updated }
    })
  }

  const handleSplitChange = (memberId: string, value: string, field: 'amount' | 'shares') => {
    const numValue = parseFloat(value)
    if (isNaN(numValue) || numValue < 0) {
      toast.error('Invalid value')
      return
    }

    setFormData(prev => {
      const updated = prev.memberSplits.map(split =>
        split.memberId === memberId
          ? {
            ...split,
            [field]: typeof numValue === 'number' ? numValue : (field === 'shares' ? 1 : 0),
            included: true
          }
          : split
      )

      if (field === 'shares') {
        const totalAmount = parseFloat(prev.amount)
        if (!isNaN(totalAmount)) {
          const totalShares = updated.reduce((sum, split) => sum + (split.shares || 0), 0)
          return {
            ...prev,
            memberSplits: updated.map(split => ({
              ...split,
              amount: split.shares && split.shares > 0 ? Number((totalAmount * ((split.shares || 1) / totalShares)).toFixed(2)) : 0
            }))
          }
        }
      }

      return { ...prev, memberSplits: updated }
    })
  }

  const validateSplits = () => {
    const totalAmount = parseFloat(formData.amount)
    if (isNaN(totalAmount)) return false

    const splitSum = formData.memberSplits.reduce((sum, split) => sum + (split.amount || 0), 0)
    return Math.abs(splitSum - totalAmount) < 0.001
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const amountNum = parseFloat(formData.amount)
    if (isNaN(amountNum)) {
      toast.error('Invalid amount')
      return
    }

    if (!validateSplits()) {
      const totalSplit = formData.memberSplits.reduce((sum, split) => sum + (split.amount || 0), 0)
      toast.error(
        `Split amounts (${totalSplit.toFixed(2)}) don't equal expense amount (${amountNum.toFixed(2)})`
      )
      return
    }

    await onSubmit({
      ...formData,
      amount: amountNum
    })
  }

  return (
    <Card>
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onCancel}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <CardTitle>{title}</CardTitle>
              {description && <CardDescription>{description}</CardDescription>}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              placeholder="What was this expense for?"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              required
              disabled={!isEditing || isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              placeholder="0.0"
              min="0.1"
              step="0.1"
              value={formData.amount}
              onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
              required
              disabled={!isEditing || isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="paidBy">Paid By</Label>
            <Select
              value={formData.paidBy}
              onValueChange={(value) => setFormData(prev => ({ ...prev, paidBy: value }))}
              disabled={!isEditing || isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Who paid for this?" />
              </SelectTrigger>
              <SelectContent>
                {members.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.user_id === user?.id ? 'You' : member.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Split Type</Label>
            <SegmentedButton
              items={SPLIT_OPTIONS}
              value={formData.splitType}
              onValueChange={(value) => setFormData(prev => ({ ...prev, splitType: value as SplitType }))}
            />
          </div>
          <div className="space-y-4">
            <Label>Split Details</Label>
            {members.map((member) => (
              <div key={member.id} className="flex items-center gap-4">
                {formData.splitType === 'equal' ? (
                  <>
                    <div className="flex items-center gap-2 w-1/3">
                      <Checkbox
                        id={`include-${member.id}`}
                        checked={formData.memberSplits.find(s => s.memberId === member.id)?.included}
                        onCheckedChange={(checked) =>
                          handleIncludedChange(member.id, checked as boolean)
                        }
                        disabled={!isEditing || isLoading}
                      />
                      <Label
                        htmlFor={`include-${member.id}`}
                        className={cn("cursor-pointer", !isEditing && "cursor-default")}
                      >
                        {member.full_name}
                      </Label>
                    </div>
                    <span className={cn(
                      "text-muted-foreground",
                      !formData.memberSplits.find(s => s.memberId === member.id)?.included && "text-muted-foreground/50"
                    )}>
                      {groupCurrency} {formData.memberSplits.find(s => s.memberId === member.id)?.amount?.toFixed(2) || '0.00'}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="w-1/3">{member.full_name}</span>
                    {formData.splitType === 'custom' ? (
                      <Input
                        type="number"
                        step="0.1"
                        value={formData.memberSplits.find(s => s.memberId === member.id)?.amount || ''}
                        onChange={(e) => handleSplitChange(member.id, e.target.value, 'amount')}
                        placeholder="0.0"
                        disabled={!isEditing || isLoading}
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min={0}
                          step={1}
                          value={formData.memberSplits.find(s => s.memberId === member.id)?.shares || 0}
                          onChange={(e) => handleSplitChange(member.id, e.target.value, 'shares')}
                          placeholder="1"
                          disabled={!isEditing || isLoading}
                        />
                        <span className="text-muted-foreground whitespace-nowrap">
                          = {groupCurrency}{formData.memberSplits.find(s => s.memberId === member.id)?.amount?.toFixed(2) || '0.00'}
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
          {formData.splitType !== 'equal' && (
            <div className="text-sm text-muted-foreground">
              Total: {groupCurrency}{formData.memberSplits.reduce((sum, split) => sum + (split.amount || 0), 0).toFixed(2)}
              {formData.amount && !validateSplits() && (
                <span className="text-destructive ml-2">
                  Must equal expense amount (${formData.amount})
                </span>
              )}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isLoading || !formData.description || !formData.amount || !formData.paidBy}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isEditing ? 'Saving...' : 'Adding...'}
              </>
            ) : (
              isEditing ? 'Save Changes' : 'Add Expense'
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
} 