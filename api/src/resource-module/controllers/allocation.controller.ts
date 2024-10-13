import { Body, Controller, Get, HttpCode, Param, Post } from '@nestjs/common';
import { RoleEnum } from '../../permission-module/models/role.enum';
import { RequestUser } from '../../auth-module/decorators/user.decorator';
import { UserDto } from '../../users-module/dtos/user.dto';
import { AllocationRequestDto } from '../dtos/allocation-request.dto';
import { AllocationService } from '../services/allocation.service';
import { GetPagination, Pagination } from '../../config-module/decorators/get-pagination';
import { GetSorting, Sorting } from '../../config-module/decorators/get-sorting';
import { AllocationMapper } from '../mappers/allocation.mapper';
import { MinRoleCheck } from '../../permission-module/decorators/min-role.decorator';

@Controller('/allocation')
export class AllocationController {
	constructor(
		private readonly allocationService: AllocationService,
		private readonly allocationMapper: AllocationMapper
	) {}

	@Post('/request/:projectId')
	@MinRoleCheck(RoleEnum.USER)
	@HttpCode(201)
	async requestAllocation(
		@Param('projectId') projectId: number,
		@RequestUser() user: UserDto,
		@Body() allocation: AllocationRequestDto
	) {
		await this.allocationService.request(projectId, user.id, allocation);
	}

	@Get('/list/:projectId')
	@MinRoleCheck(RoleEnum.USER)
	async allocationList(
		@Param('projectId') projectId: number,
		@RequestUser() user: UserDto,
		@GetPagination() pagination: Pagination,
		@GetSorting() sorting: Sorting | null
	) {
		const [allocations, count] = await this.allocationService.list(projectId, user.id, pagination, sorting);

		return {
			metadata: {
				page: pagination.page,
				recordsPerPage: allocations.length,
				totalRecords: count
			},
			allocations: allocations.map((allocation) => this.allocationMapper.toAllocationDto(allocation))
		};
	}
}
