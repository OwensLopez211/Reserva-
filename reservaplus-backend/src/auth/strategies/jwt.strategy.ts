import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { passportJwtSecret } from 'jwks-rsa';
import { UsersService } from '../../users/users.service';

export interface JwtPayload {
  iss: string;
  sub: string;
  aud: string[];
  iat: number;
  exp: number;
  azp: string;
  scope: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
  // Auth0 custom claims
  'https://reservaplus.com/organizationId'?: string;
  'https://reservaplus.com/role'?: string;
}

export interface UserContext {
  id: string;
  auth0UserId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  organizationId?: string;
  role?: string;
  isActive: boolean;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    const auth0Domain = configService.get<string>('auth.auth0Domain');
    const auth0Audience = configService.get<string>('auth.auth0Audience');

    super({
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `https://${auth0Domain}/.well-known/jwks.json`,
      }),
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      audience: auth0Audience,
      issuer: `https://${auth0Domain}/`,
      algorithms: ['RS256'],
    });
  }

  async validate(payload: JwtPayload): Promise<UserContext> {
    // Verificar que el token tenga la información mínima requerida
    if (!payload.sub || !payload.email) {
      throw new UnauthorizedException('Invalid token payload');
    }

    try {
      // Buscar o crear usuario en nuestra base de datos
      let user = await this.usersService.findByAuth0Id(payload.sub);

      if (!user) {
        // Si el usuario no existe, crearlo automáticamente
        user = await this.usersService.createFromAuth0(payload);
      } else {
        // Actualizar información del usuario si cambió
        user = await this.usersService.updateFromAuth0(user.id, payload);
      }

      // Verificar que el usuario esté activo
      if (!user.isActive) {
        throw new UnauthorizedException('User account is inactive');
      }

      // Obtener organización y rol actual del usuario
      const organizationContext = await this.usersService.getUserOrganizationContext(
        user.id,
        payload['https://reservaplus.com/organizationId'],
      );

      // Construir contexto del usuario
      const userContext: UserContext = {
        id: user.id,
        auth0UserId: user.auth0UserId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        organizationId: organizationContext?.organizationId,
        role: organizationContext?.role,
        isActive: user.isActive,
      };

      return userContext;
    } catch (error) {
      console.error('Error during authentication:', error);
      throw new UnauthorizedException('Authentication failed');
    }
  }
}
