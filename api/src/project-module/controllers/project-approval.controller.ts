import { Body, Controller, ForbiddenException, Post } from '@nestjs/common';
import { User } from 'resource-manager-database';
import {
	ApiBody,
	ApiForbiddenResponse,
	ApiNotFoundResponse,
	ApiOkResponse,
	ApiOperation,
	ApiTags
} from '@nestjs/swagger';
import { ProjectApprovalService } from '../services/project-approval.service';
import { ProjectApproveDto } from '../dtos/project-approve.dto';
import { ProjectDto } from '../dtos/project.dto';
import { ProjectRejectDto } from '../dtos/project-reject.dto';
import { RequestUser } from '../../auth-module/decorators/user.decorator';
import { PermissionsCheck } from '../../permission-module/decorators/permissions.decorator';
import { PermissionEnum } from '../../permission-module/models/permission.enum';
import { ProjectNotFoundException } from '../../error-module/errors/projects/project-not-found.exception';
import { ProjectHasApprovalException } from '../../error-module/errors/projects/project-has-approval.exception';

@ApiTags('Project')
@Controller('/project/approval')
export class ProjectApprovalController {
	constructor(private readonly projectApprovalService: ProjectApprovalService) {}

	@Post('/approve')
	@PermissionsCheck([PermissionEnum.PROJECT_APPROVAL])
	@ApiOperation({
		summary: 'Approve a project',
		description: 'Approve a project request.'
	})
	@ApiOkResponse({
		description: 'The project was successfully approved.',
		type: ProjectDto
	})
	@ApiForbiddenResponse({
		description: 'User does not have permission to approve projects.',
		type: ForbiddenException
	})
	@ApiForbiddenResponse({
		description: 'Project is already rejected or approved.',
		type: ProjectHasApprovalException
	})
	@ApiNotFoundResponse({
		description: 'Project does not exist.',
		type: ProjectNotFoundException
	})
	@ApiBody({
		type: ProjectApproveDto,
		description: 'The project to approve'
	})
	public async approveProject(
		@RequestUser() user: User,
		@Body() projectApprovalDto: ProjectApproveDto
	): Promise<ProjectDto> {
		return this.projectApprovalService.approveProject(user.id, projectApprovalDto.projectId);
	}

	@Post('/reject')
	@PermissionsCheck([PermissionEnum.PROJECT_APPROVAL])
	@ApiOperation({
		summary: 'Reject a project',
		description: 'Reject a project request.'
	})
	@ApiOkResponse({
		description: 'The project was successfully rejected.',
		type: ProjectDto
	})
	@ApiForbiddenResponse({
		description: 'User does not have permission to reject projects.',
		type: ForbiddenException
	})
	@ApiForbiddenResponse({
		description: 'Project is already rejected or approved.',
		type: ProjectHasApprovalException
	})
	@ApiNotFoundResponse({
		description: 'Project does not exist.',
		type: ProjectNotFoundException
	})
	@ApiBody({
		type: ProjectApproveDto,
		description: 'The project to reject'
	})
	public async rejectProject(
		@RequestUser() user: User,
		@Body() projectRejectDto: ProjectRejectDto
	): Promise<ProjectDto> {
		return this.projectApprovalService.rejectProject(user.id, projectRejectDto.projectId, projectRejectDto.reason);
	}
}
