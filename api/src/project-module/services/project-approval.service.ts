import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { ApprovalStatus, Project, ProjectApproval, ProjectStatus } from 'resource-manager-database';
import { ProjectDto } from '../dtos/project.dto';
import { ProjectModel } from '../models/project.model';
import { ProjectNotFoundApiException } from '../../error-module/errors/projects/project-not-found.api-exception';
import { ProjectHasApprovalApiException } from '../../error-module/errors/projects/project-has-approval.api-exception';
import { ProjectMapper } from './project.mapper';

@Injectable()
export class ProjectApprovalService {
	constructor(
		private readonly dataSource: DataSource,
		private readonly projectModel: ProjectModel,
		private readonly projectMapper: ProjectMapper
	) {}

	public async approveProject(userId: number, projectId: number): Promise<ProjectDto> {
		return this.dataSource.transaction(async (manager) => {
			const project = await this.getProject(manager, projectId);

			// update project status
			await this.projectModel.updateProject(manager, projectId, { status: ProjectStatus.ACTIVE });

			// create record about project approval
			await manager
				.createQueryBuilder()
				.insert()
				.into(ProjectApproval)
				.values({ project: project, reviewerId: userId, status: ApprovalStatus.APPROVED })
				.execute();

			project.status = ProjectStatus.ACTIVE;
			return this.projectMapper.toProjectDto(project);
		});
	}

	public async rejectProject(userId: number, projectId: number, reason: string): Promise<ProjectDto> {
		return this.dataSource.transaction(async (manager) => {
			const project = await this.getProject(manager, projectId);

			// update project status
			await this.projectModel.updateProject(manager, projectId, { status: ProjectStatus.INACTIVE });

			// create record about project rejection
			await manager
				.createQueryBuilder()
				.insert()
				.into(ProjectApproval)
				.values({ project: project, reviewerId: userId, status: ApprovalStatus.REJECTED, description: reason })
				.execute();

			project.status = ProjectStatus.INACTIVE;
			return this.projectMapper.toProjectDto(project);
		});
	}

	private async getProject(manager: EntityManager, projectId: number): Promise<Project> {
		const projectRepository = manager.getRepository(Project);

		// get project and lock it
		const project = await projectRepository
			.createQueryBuilder('project')
			.innerJoinAndSelect('project.pi', 'pi')
			.where('project.id = :projectId', { projectId })
			.setLock('pessimistic_write')
			.getOne();

		if (!project) {
			throw new ProjectNotFoundApiException();
		}

		if (project.status !== ProjectStatus.NEW) {
			throw new ProjectHasApprovalApiException();
		}

		return project;
	}
}