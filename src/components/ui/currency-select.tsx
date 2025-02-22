'use client'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select"

const CURRENCIES = [
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
    { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
    { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
    { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
    { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
] as const

export type CurrencyCode = typeof CURRENCIES[number]['code']

interface CurrencySelectProps {
    value: string
    onValueChange: (value: string) => void
    disabled?: boolean
}

export function CurrencySelect({ value, onValueChange, disabled }: CurrencySelectProps) {
    return (
        <Select value={value} onValueChange={onValueChange} disabled={disabled}>
            <SelectTrigger>
                <SelectValue placeholder="Select currency" />
            </SelectTrigger>
            <SelectContent>
                {CURRENCIES.map((currency) => (
                    <SelectItem key={currency.code} value={currency.code}>
                        {currency.symbol} {currency.code} - {currency.name}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    )
}

export function getCurrencySymbol(code: string) {
    return CURRENCIES.find(c => c.code === code)?.symbol || '$'
} 