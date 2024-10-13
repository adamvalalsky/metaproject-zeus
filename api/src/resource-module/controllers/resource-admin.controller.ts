import { Body, Controller, HttpCode, Param, Post } from '@nestjs/common';
import { RolesCheck } from '../../permission-module/decorators/roles.decorator';
import { RoleEnum } from '../../permission-module/models/role.enum';
import { ResourceInputDto } from '../dtos/input/resource-input.dto';
import { ResourceService } from '../services/resource.service';

@RolesCheck([RoleEnum.ADMIN])
@Controller('/resource')
export class ResourceAdminController {
	constructor(private readonly resourceService: ResourceService) {}

	@Post('/')
	@HttpCode(201)
	async createResource(@Body() resourceInputDto: ResourceInputDto) {
		await this.resourceService.createResource(resourceInputDto);
	}

	@Post('/:id')
	@HttpCode(204)
	async updateResource(@Param('id') id: number, @Body() resourceInputDto: ResourceInputDto) {
		await this.resourceService.updateResource(id, resourceInputDto);
	}
}