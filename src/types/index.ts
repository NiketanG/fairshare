import { Database } from "./database";

type Split = Database["public"]["Tables"]["splits"]["Row"];

export type Group = Database["public"]["Tables"]["groups"]["Row"];
export type Expense = Database["public"]["Tables"]["expenses"]["Row"] & {
	splits?: Array<Split>;
	paid_by_member?: MemberWithProfile;
};
export type Member = Database["public"]["Tables"]["group_members"]["Row"];
export type Balance = {
	from: string;
	to: string;
	amount: number;
};

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export type MemberWithProfile = Member &
	Profile & {
		profile?: Profile;
	};
