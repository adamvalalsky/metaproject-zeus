import { Injectable } from '@nestjs/common';
import { User } from 'resource-manager-database';
import { UserDto } from '../dtos/user.dto';

@Injectable()
export class UserMapper {
	toUserDto(user: User): UserDto {
		return {
			id: user.id,
			source: user.source,
			externalId: user.externalId,
			username: user.username
		};
	}
}