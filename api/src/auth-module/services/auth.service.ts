import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { User } from 'resource-manager-database';
import { InvalidUserApiException } from '../../error-module/errors/users/invalid-user.api-exception';

@Injectable()
export class AuthService {
	constructor(private readonly dataSource: DataSource) {}

	async signIn(profile: any): Promise<void> {
		const email = profile.emails?.[0].value;

		if (!email) {
			throw new InvalidUserApiException();
		}

		await this.dataSource.getRepository(User).upsert(
			{
				source: 'perun',
				externalId: profile.id,
				username: email,
				name: profile.displayName,
				// TODO 1 for now, will be provided from OAuth later
				roleId: 1
			},
			['source', 'externalId']
		);
	}
}
