import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class AuthGuard implements CanActivate {
	constructor(private readonly reflector: Reflector) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
			context.getHandler(),
			context.getClass()
		]);

		if (isPublic) {
			return true;
		}

		const request = context.switchToHttp().getRequest();

		// TODO this will be probably some token or something, for now we just send ID directly
		const userId = request.headers['x-user-id'];
		if (!userId) {
			throw new UnauthorizedException();
		}

		return true;
	}
}
