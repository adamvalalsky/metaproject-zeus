import { ConflictException, Injectable } from '@nestjs/common';
import { DataSource, QueryFailedError } from 'typeorm';
import { Project, ProjectStatus } from 'resource-manager-database/dist/models/project/project';
import { User } from 'resource-manager-database/dist/models/user/user';
import { RequestProjectDto } from '../dtos/request-project.dto';
import { ProjectDto } from '../dtos/project.dto';
import { ProjectMapper } from './project.mapper';

@Injectable()
export class ProjectService {
	constructor(
		private readonly dataSource: DataSource,
		private readonly projectMapper: ProjectMapper
	) {}

	async requestProject(requestProjectDto: RequestProjectDto, piId: number): Promise<ProjectDto> {
		return this.dataSource.transaction(async (manager) => {
			const userRepository = manager.getRepository(User);

			const user = await userRepository.findOneByOrFail({
				id: piId
			});

			const status = ProjectStatus.NEW;
			try {
				const result = await manager
					.createQueryBuilder()
					.insert()
					.into(Project)
					.values({
						title: requestProjectDto.title,
						description: requestProjectDto.description,
						status,
						pi: user
					})
					.execute();

				return this.projectMapper.toProjectDto(
					result.identifiers[0]['id'],
					requestProjectDto.title,
					requestProjectDto.description,
					status,
					user
				);
			} catch (e) {
				if (
					e instanceof QueryFailedError &&
					e.message.includes('duplicate key value violates unique constraint')
				) {
					// TODO edit when error module is created
					throw new ConflictException('Project request exists');
				}

				throw e;
			}
		});
	}
}
