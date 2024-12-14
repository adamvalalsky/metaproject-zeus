export class FailedProjectDto {
	/**
	 * ID of project which failed
	 */
	projectId: number;

	/**
	 * Project title
	 */
	title: string;

	/**
	 * Stage on which project failed.
	 */
	lastStage: string;

	/**
	 * Date at which failed.
	 */
	updatedAt: string;
}