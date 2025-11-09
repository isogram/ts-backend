import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FilesService } from './files.service';
import { FileEntity } from './entities/file.entity';
import { StorageService } from '@shared/services/storage.service';
import { FilesController } from './controllers/files.controller';
import { AdminFilesController } from './controllers/admin-files.controller';

@Module({
    imports: [
        ConfigModule,
        TypeOrmModule.forFeature([FileEntity]),
    ],
    controllers: [FilesController, AdminFilesController],
    providers: [FilesService, StorageService],
    exports: [FilesService],
})
export class FilesModule { }
