import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Balance, Expense, Member } from "../types";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function getInitials(name: string) {
	return name
		.split(" ")
		.map((word) => word[0])
		.join("")
		.toUpperCase()
		.slice(0, 2);
}

export function calculateBalances(
	expenses: Expense[],
	members: Member[]
): Balance[] {
	// Track how much each person has paid and owes
	const netAmounts = new Map<string, number>();

	// Initialize all members with 0
	members.forEach((member) => {
		netAmounts.set(member.id, 0);
	});

	// Calculate net amounts (positive means they're owed money, negative means they owe)
	expenses.forEach((expense) => {
		const paidBy = expense.paid_by;
		const paidAmount = expense.amount;

		// Add the amount to what the payer has paid
		netAmounts.set(paidBy, (netAmounts.get(paidBy) || 0) + paidAmount);

		// Subtract the split amounts from each member
		expense.splits?.forEach((split) => {
			netAmounts.set(
				split.member_id,
				(netAmounts.get(split.member_id) || 0) - split.amount
			);
		});
	});

	// Convert net amounts to a list of balances
	const balances: Balance[] = [];
	const entries = Array.from(netAmounts.entries());

	// Sort by amount to handle largest debts first
	entries.sort((a, b) => a[1] - b[1]);

	let i = 0; // index for people who owe money (negative balance)
	let j = entries.length - 1; // index for people who are owed money (positive balance)

	while (i < j) {
		const [debtorId, debtorBalance] = entries[i];
		const [creditorId, creditorBalance] = entries[j];

		if (Math.abs(debtorBalance) < 0.01 || creditorBalance < 0.01) {
			// Skip if either balance is effectively zero
			if (Math.abs(debtorBalance) < 0.01) i++;
			if (creditorBalance < 0.01) j--;
			continue;
		}

		// Calculate the amount that can be settled
		const amount = Math.min(Math.abs(debtorBalance), creditorBalance);

		if (amount > 0.01) {
			balances.push({
				from: debtorId,
				to: creditorId,
				amount: Number(amount.toFixed(2)),
			});
		}

		// Update the balances
		entries[i][1] += amount;
		entries[j][1] -= amount;

		// Move indices if balances are settled
		if (Math.abs(entries[i][1]) < 0.01) i++;
		if (entries[j][1] < 0.01) j--;
	}

	return balances;
}
