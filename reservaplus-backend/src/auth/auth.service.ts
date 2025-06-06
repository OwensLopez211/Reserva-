import { Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { UserContext } from './strategies/jwt.strategy';
import { UserProfileDto, OrganizationDto, SwitchOrganizationDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private configService: ConfigService,
    private jwtService: JwtService,
    private usersService: UsersService,
  ) {}

  /**
   * Obtener perfil completo del usuario autenticado
   */
  async getProfile(userContext: UserContext): Promise<UserProfileDto> {
    const user = await this.usersService.findById(userContext.id);
    const organizations = await this.usersService.getUserOrganizations(user.id);

    // Mapear organizaciones
    const organizationDtos: OrganizationDto[] = organizations.map((org) => ({
      id: org.organizationId,
      name: '', // TODO: Obtener desde OrganizationsService
      slug: '', // TODO: Obtener desde OrganizationsService
      industryType: '', // TODO: Obtener desde OrganizationsService
      role: org.role,
      isActive: org.isActive,
    }));

    // Encontrar organización actual
    const currentOrganization = organizationDtos.find(
      (org) => org.id === userContext.organizationId,
    );

    const profile: UserProfileDto = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: this.getFullName(user.firstName, user.lastName),
      avatarUrl: user.avatarUrl,
      role: userContext.role,
      organization: currentOrganization,
      organizations: organizationDtos,
      lastLoginAt: user.lastLoginAt,
    };

    return profile;
  }

  /**
   * Cambiar de organización
   */
  async switchOrganization(
    userContext: UserContext,
    switchDto: SwitchOrganizationDto,
  ): Promise<{ accessToken: string; expiresIn: number }> {
    // Verificar que el usuario pertenece a la organización
    const organizationContext = await this.usersService.getUserOrganizationContext(
      userContext.id,
      switchDto.organizationId,
    );

    if (!organizationContext) {
      throw new UnauthorizedException('User does not belong to this organization');
    }

    // Generar nuevo token con la nueva organización
    const tokenPayload = {
      sub: userContext.auth0UserId,
      email: userContext.email,
      organizationId: switchDto.organizationId,
      role: organizationContext.role,
    };

    const accessToken = this.jwtService.sign(tokenPayload);
    const expiresIn = this.getTokenExpirationTime();

    return {
      accessToken,
      expiresIn,
    };
  }

  /**
   * Generar URL de login de Auth0
   */
  async getAuth0LoginUrl(returnTo?: string): Promise<{ loginUrl: string }> {
    const auth0Domain = this.configService.get<string>('auth.auth0Domain');
    const clientId = this.configService.get<string>('auth.auth0ClientId');
    const audience = this.configService.get<string>('auth.auth0Audience');
    const redirectUri = `${this.configService.get<string>('app.appUrl')}/auth/callback`;

    const params = new URLSearchParams();
    params.append('response_type', 'code');
    params.append('client_id', clientId || '');
    params.append('redirect_uri', redirectUri);
    params.append('scope', 'openid profile email');
    params.append('audience', audience || '');

    if (returnTo) {
      params.append('state', returnTo);
    }

    const loginUrl = `https://${auth0Domain}/authorize?${params.toString()}`;

    return { loginUrl };
  }

  /**
   * Procesar callback de Auth0 (para implementar más adelante)
   */
  async handleAuth0Callback(code: string, state?: string): Promise<any> {
    // TODO: Implementar intercambio de código por token con Auth0
    // Esta función se implementará cuando integremos completamente con Auth0
    throw new Error('Auth0 callback not implemented yet');
  }

  /**
   * Logout - invalidar token
   */
  async logout(): Promise<{ message: string }> {
    // En JWT stateless, el logout se maneja en el frontend
    // Aquí podríamos agregar lógica para blacklist de tokens si fuera necesario
    return { message: 'Logged out successfully' };
  }

  /**
   * Validar y refrescar token
   */
  async refreshToken(token: string): Promise<{ accessToken: string; expiresIn: number }> {
    try {
      const payload = this.jwtService.verify(token);

      // Verificar que el usuario sigue siendo válido
      const user = await this.usersService.findByAuth0Id(payload.sub);
      if (!user || !user.isActive) {
        throw new UnauthorizedException('User no longer valid');
      }

      // Generar nuevo token
      const newToken = this.jwtService.sign({
        sub: payload.sub,
        email: payload.email,
        organizationId: payload.organizationId,
        role: payload.role,
      });

      return {
        accessToken: newToken,
        expiresIn: this.getTokenExpirationTime(),
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  /**
   * Métodos auxiliares
   */
  private getFullName(firstName?: string, lastName?: string): string {
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    }
    return firstName || lastName || 'Usuario';
  }

  private getTokenExpirationTime(): number {
    const expiresIn = this.configService.get<string>('auth.jwtExpiresIn');
    // Convertir "24h" a segundos
    if (expiresIn?.endsWith('h')) {
      return parseInt(expiresIn.slice(0, -1)) * 3600;
    }
    if (expiresIn?.endsWith('m')) {
      return parseInt(expiresIn.slice(0, -1)) * 60;
    }
    return 3600; // Default 1 hora
  }
}
