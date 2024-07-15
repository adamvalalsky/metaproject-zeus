export class PublicationDto {
	/**
	 * Title of the publication.
	 */
	title: string;

	/**
	 * Authors of the publication. Multiple authors are separated by comma.
	 */
	authors: string;

	/**
	 * Year of the publication.
	 */
	year: number;

	/**
	 * Journal where the publication was published.
	 */
	journal: string;

	/**
	 * Unique identifier of the publication. Either DOI, ISSN or ISBN.
	 */
	uniqueId: string;
}
