import { HttpStatus } from '@nestjs/common';
import { ApiException } from '../../api-exception';

const CODE = 15000;
const HTTP_MESSAGE = 'Allocation not found.';
const HTTP_STATUS = HttpStatus.NOT_FOUND;

export class AllocationNotFoundError extends ApiException {
	override code = CODE;
	override httpMessage = HTTP_MESSAGE;
	override httpStatus = HTTP_STATUS;

	constructor() {
		super(CODE, HTTP_MESSAGE, HTTP_STATUS);
	}
}
