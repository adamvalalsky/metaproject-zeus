import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Allocation, AllocationStatus, AllocationUser } from 'resource-manager-database';
import { AllocationRequestDto } from '../dtos/allocation-request.dto';
import { ProjectPermissionService } from '../../project-module/services/project-permission.service';
import { ProjectPermissionEnum } from '../../project-module/enums/project-permission.enum';
import { Sorting } from '../../config-module/decorators/get-sorting';
import { Pagination } from '../../config-module/decorators/get-pagination';
import { AllocationNotFoundError } from '../../error-module/errors/allocations/allocation-not-found.error';
import { AllocationStatusDto } from '../dtos/input/allocation-status.dto';

@Injectable()
export class AllocationService {
	constructor(
		private readonly dataSource: DataSource,
		private readonly projectPermissionService: ProjectPermissionService
	) {}

	async request(projectId: number, userId: number, allocation: AllocationRequestDto, isStepUp: boolean) {
		await this.dataSource.transaction(async (manager) => {
			await this.projectPermissionService.validateUserPermissions(
				manager,
				projectId,
				userId,
				ProjectPermissionEnum.REQUEST_ALLOCATION,
				isStepUp
			);

			// create allocation
			const result = await manager
				.createQueryBuilder()
				.insert()
				.into(Allocation)
				.values({
					projectId,
					...allocation,
					status: AllocationStatus.NEW
				})
				.returning('id')
				.execute();

			// add user to allocation
			await manager
				.createQueryBuilder()
				.insert()
				.into(AllocationUser)
				.values({
					userId,
					allocationId: result.identifiers[0]['id'],
					status: AllocationStatus.NEW
				})
				.execute();
		});
	}

	async getDetail(userId: number, allocationId: number, isStepUp: boolean): Promise<Allocation> {
		const allocation = await this.dataSource.getRepository(Allocation).findOne({
			select: {
				id: true,
				project: {
					id: true,
					title: true
				},
				resource: {
					id: true,
					name: true,
					resourceType: {
						name: true
					}
				},
				justification: true,
				startDate: true,
				endDate: true,
				status: true,
				description: true,
				quantity: true,
				isLocked: true,
				time: {
					updatedAt: true
				},
				allocationUsers: {
					userId: true,
					user: {
						id: true,
						name: true,
						email: true
					}
				}
			},
			where: {
				id: allocationId
			},
			relations: ['resource', 'resource.resourceType', 'project', 'allocationUsers', 'allocationUsers.user']
		});

		const projectId = allocation?.project?.id;
		if (!allocation || !projectId) {
			throw new AllocationNotFoundError();
		}

		const userPermissions = await this.projectPermissionService.getUserPermissions(projectId, userId, isStepUp);
		const userHasAccess = allocation.allocationUsers.some((au) => au.userId === userId);

		if (!userPermissions.has(ProjectPermissionEnum.VIEW_ALL_ALLOCATIONS) && !userHasAccess) {
			throw new AllocationNotFoundError();
		}

		return allocation;
	}

	async list(projectId: number, userId: number, pagination: Pagination, sorting: Sorting | null, isStepUp: boolean) {
		const userPermissions = await this.projectPermissionService.getUserPermissions(projectId, userId, isStepUp);

		const allocationBuilder = this.dataSource
			.createQueryBuilder()
			.select('a')
			.from(Allocation, 'a')
			.innerJoinAndSelect('a.allocationUsers', 'allUsers')
			.innerJoinAndSelect('allUsers.user', 'u')
			.leftJoinAndSelect('a.resource', 'r')
			.leftJoinAndSelect('r.resourceType', 'rt')
			.where('a.projectId = :projectId', { projectId })
			.offset(pagination.offset)
			.limit(pagination.limit);

		if (!userPermissions.has(ProjectPermissionEnum.VIEW_ALL_ALLOCATIONS)) {
			const existsInAllocationQuery = this.dataSource
				.createQueryBuilder()
				.select('au')
				.from(AllocationUser, 'au')
				.where('au.allocationId = a.id')
				.andWhere('au.userId = :userId')
				.getQuery();

			allocationBuilder.andWhere(`EXISTS (${existsInAllocationQuery})`, {
				userId
			});
		}

		if (sorting) {
			switch (sorting.columnAccessor) {
				case 'name':
					allocationBuilder.orderBy('r.name', sorting.direction);
					break;
				case 'type':
					allocationBuilder.orderBy('rt.name', sorting.direction);
					break;
				case 'endDate':
					allocationBuilder.orderBy('a.endDate', sorting.direction);
					break;
				case 'status':
					allocationBuilder.orderBy('a.status', sorting.direction);
					break;
			}
		}

		return allocationBuilder.getManyAndCount();
	}

	async setStatus(allocationId: number, data: AllocationStatusDto) {
		const date = new Date();
		date.setFullYear(date.getFullYear() + 1);

		const newDate = data.status === 'denied' ? undefined : date;

		await this.dataSource.getRepository(Allocation).update(
			{
				id: allocationId
			},
			{
				status: data.status as AllocationStatus,
				startDate: data.startDate,
				endDate: data.endDate ? data.endDate : newDate,
				description: data.description
			}
		);
	}

	async getAll(status: 'new' | null, pagination: Pagination, sorting: Sorting) {
		const allocationQuery = this.dataSource
			.createQueryBuilder(Allocation, 'allocation')
			.innerJoinAndSelect('allocation.project', 'project')
			.innerJoinAndSelect('project.pi', 'pi')
			.innerJoinAndSelect('allocation.resource', 'resource')
			.innerJoinAndSelect('resource.resourceType', 'resourceType')
			.offset(pagination.offset)
			.limit(pagination.limit);

		if (status) {
			allocationQuery.where('allocation.status = :status', { status: AllocationStatus.NEW });
		}

		switch (sorting.columnAccessor) {
			case 'project':
				allocationQuery.orderBy('project.title', sorting.direction);
				break;
			case 'id':
				allocationQuery.orderBy('allocation.id', sorting.direction);
				break;
			case 'pi':
				allocationQuery.orderBy('pi.name', sorting.direction);
				break;
			case 'status':
				allocationQuery.orderBy('allocation.status', sorting.direction);
				break;
			case 'resource':
				allocationQuery.orderBy('resource.name', sorting.direction);
				break;
			case 'endDate':
				allocationQuery.orderBy('allocation.endDate', sorting.direction);
				break;
			default:
				allocationQuery.orderBy('allocation.createdAt', sorting.direction);
				break;
		}

		return allocationQuery.getManyAndCount();
	}
}
