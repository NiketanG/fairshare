import { toast } from "sonner";
import { supabase } from "./supabase";
import { calculateBalances } from "./utils";
import { Member, MemberWithProfile } from "../types";

export async function getGroupById(groupId: string) {
	try {
		const { data, error: groupError } = await supabase
			.from("groups")
			.select("*")
			.eq("id", groupId)
			.single();

		if (groupError) throw groupError;

		return data;
	} catch (err) {
		console.error("Error loading group:", err);
		toast.error("Failed to load group");
		throw err;
	}
}

export async function fetchGroups() {
	try {
		const {
			data: { user },
			error: userError,
		} = await supabase.auth.getUser();
		if (userError) throw userError;

		if (!user) {
			return;
		}

		const { data: groupItems, error: groupError } = await supabase
			.from("group_members")
			.select("group_id")
			.eq("user_id", user.id)
			.or(`email.eq.${user.email}`);

		if (groupItems && groupItems.length > 0) {
			// select from groups where "id" is in groupItems
			const { data: memberGroups, error: memberGroupError } =
				await supabase
					.from("groups")
					.select(
						"*, group_members(id), created_by_user:created_by(full_name)"
					)
					.in(
						"id",
						groupItems.map((item) => item.group_id)
					);

			return memberGroups;
		}
	} catch (error) {
		console.error("Error in groups fetch:", error);
		toast.error(
			error instanceof Error ? error.message : "Failed to fetch groups"
		);
	}
}

export async function fetchExpenses(groupId: string, members: Member[]) {
	try {
		const { data: expenseData, error: expenseError } = await supabase
			.from("expenses")
			.select(
				`
	*,
	paid_by_member:paid_by(*),
	splits (
	  member_id,
	  amount
	)
  `
			)
			.eq("group_id", groupId)
			.order("created_at", { ascending: false });

		if (expenseError) throw expenseError;

		// Calculate balances
		const calculatedBalances = calculateBalances(expenseData, members);

		return {
			expenses: expenseData,
			balances: calculatedBalances,
		};
	} catch (error) {
		console.error("Error loading expenses:", error);
		toast.error("Failed to load expenses");
	}
}

export async function fetchMembers(groupId: string) {
	try {
		const { data: memberData, error: memberError } = await supabase
			.from("group_members")
			.select(
				`
		  *,
		  profile:profiles(*)
		`
			)
			.eq("group_id", groupId);

		if (memberError) throw memberError;

		const memberDetails = memberData?.map((gm) => ({
			...gm.profile,
			profile: gm.profile,
			...gm,
		})) as MemberWithProfile[];

		return memberDetails;
	} catch (err) {
		throw err instanceof Error;
		console.error("Error fetching members:", err);
	}
}
