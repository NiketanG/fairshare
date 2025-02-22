'use client'

import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "./button"

export interface SegmentedButtonItem {
  value: string
  label: string
}

interface SegmentedButtonProps {
  items: SegmentedButtonItem[]
  value: string
  onValueChange: (value: string) => void
  className?: string
}

export function SegmentedButton({
  items,
  value,
  onValueChange,
  className
}: SegmentedButtonProps) {
  return (
    <div className={cn("flex w-full rounded-lg border p-1", className)}>
      {items.map((item) => (
        <Button
          key={item.value}
          type="button"
          variant={value === item.value ? 'default' : 'ghost'}
          className={cn(
            "flex-1 rounded-md",
            value === item.value ? '' : 'hover:bg-muted'
          )}
          onClick={() => onValueChange(item.value)}
        >
          {item.label}
        </Button>
      ))}
    </div>
  )
} 