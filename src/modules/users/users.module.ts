import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { UsersController } from './controllers/users.controller';
import { AdminUsersController } from './controllers/admin-users.controller';

@Module({
    imports: [
        ConfigModule,
        TypeOrmModule.forFeature([User]),
    ],
    controllers: [UsersController, AdminUsersController],
    providers: [UsersService],
    exports: [UsersService],
})
export class UsersModule { }
