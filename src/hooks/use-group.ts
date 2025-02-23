"use client";

import { supabase } from "@/lib/supabase";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { getGroupById } from "../lib/api";
import { Expense, Group } from "../types";

export function useGroup(id: string) {
	const {
		data: group,
		isLoading: loading,
		error,
		refetch,
	} = useQuery({
		queryKey: ["groups", id],
		queryFn: () => getGroupById(id),
	});

	const updateGroup = async (updates: Partial<Group>) => {
		try {
			const { error } = await supabase
				.from("groups")
				.update(updates)
				.eq("id", id);

			if (error) throw error;

			// setGroup(prev => prev ? { ...prev, ...updates } : null)
			refetch();
			toast.success("Group updated successfully");
		} catch (err) {
			console.error("Error updating group:", err);
			toast.error("Failed to update group");
			throw err;
		}
	};

	return {
		group,
		loading,
		updateGroup,
		error,
	};
}

export async function getExpenseByExpenseId(expenseId: string) {
	try {
		const { data, error } = await supabase
			.from("expenses")
			.select(
				`
			*,
			splits (
			  member_id,
			  amount,
			  split_type,
			  percentage
			)
		  `
			)
			.eq("id", expenseId)
			.single();

		if (error) throw error;
		return data as Expense;
	} catch (error) {
		toast.error("Failed to load expense");
		throw error;
	}
}
