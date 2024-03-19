import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { ApprovalStatus, Project, ProjectApproval, ProjectStatus } from 'resource-manager-database';
import { ProjectDto } from '../dtos/project.dto';
import { ProjectModel } from '../models/project.model';
import { ProjectNotFoundException } from '../../error-module/errors/projects/project-not-found.exception';
import { ProjectHasApprovalException } from '../../error-module/errors/projects/project-has-approval.exception';
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

			return this.projectMapper.toProjectDto(
				project.id,
				project.title,
				project.description,
				ProjectStatus.ACTIVE,
				project.pi
			);
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

			return this.projectMapper.toProjectDto(
				project.id,
				project.title,
				project.description,
				ProjectStatus.INACTIVE,
				project.pi
			);
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
			throw new ProjectNotFoundException();
		}

		if (project.status !== ProjectStatus.NEW) {
			throw new ProjectHasApprovalException();
		}

		return project;
	}
}
