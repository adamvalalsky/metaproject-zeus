class AllocationUserDto {
	id: number;
	name: string;
	email: string;
}

export class AllocationDetailDto {
	/**
	 * Allocation id
	 */
	id: number;

	/**
	 * Allocation status
	 */
	status: string;

	/**
	 * Allocation start date
	 */
	startDate: string;

	/**
	 * Allocation end date
	 */
	endDate: string;

	project: {
		id: number;
		title: string;
	};

	/**
	 * Allocation resource
	 */
	resource: {
		/**
		 * Allocation resource id
		 */
		id: number;
		/**
		 * Allocation resource name
		 */
		name: string;

		/**
		 * Allocation resource type
		 */
		type: string;
	};

	/**
	 * Allocation justification
	 */
	justification: string;

	/**
	 * Allocation description
	 */
	description: string;

	/**
	 * Allocation quantity
	 */
	quantity: number | null;

	/**
	 * Allocation is locked
	 */
	isLocked: boolean;

	updatedAt: string;

	allocationUsers: AllocationUserDto[];
}
