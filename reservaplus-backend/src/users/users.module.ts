import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { OrganizationUser } from '../organizations/entities/organization-user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, OrganizationUser])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService], // Exportar para usar en AuthModule
})
export class UsersModule {}
