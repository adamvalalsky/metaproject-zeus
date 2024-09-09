import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserManager } from 'oidc-client-ts';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { UserInfoDto } from '../dto/user-info.dto';

@Injectable()
export class OidcService {
	private readonly userManager: UserManager;

	constructor(
		private readonly configService: ConfigService,
		private readonly httpService: HttpService
	) {
		const identityIssuer = this.configService.get<string>('IDENTITY_ISSUER')!;
		this.userManager = new UserManager({
			authority: identityIssuer,
			client_id: this.configService.get<string>('IDENTITY_CLIENT_ID')!,
			client_secret: this.configService.get<string>('IDENTITY_CLIENT_SECRET')!,
			redirect_uri: this.configService.get<string>('IDENTITY_CALLBACK_URL')!,
			response_type: 'code',
			scope: 'openid profile email',
			metadata: {
				issuer: identityIssuer,
				jwks_uri: `${identityIssuer}/.well-known/openid-configuration`,
				authorization_endpoint: `${identityIssuer}/authorize`,
				token_endpoint: `${identityIssuer}/token`,
				userinfo_endpoint: `${identityIssuer}/userinfo`,
				end_session_endpoint: `${identityIssuer}/endsession`,
				check_session_iframe: `${identityIssuer}/checksession`,
				revocation_endpoint: `${identityIssuer}/revoke`,
				introspection_endpoint: `${identityIssuer}/introspect`
			}
		});
	}

	async getUserInfo(token: string): Promise<UserInfoDto> {
		const endpoint = await this.userManager.metadataService.getUserInfoEndpoint();

		const response$ = this.httpService.post(
			endpoint,
			{},
			{
				headers: {
					Authorization: `Bearer ${token}`
				}
			}
		);
		const info = await lastValueFrom(response$);
		return info.data;
	}
}
