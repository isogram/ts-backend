import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { StorageService, FileMetadata } from '@shared/services/storage.service';
import { FileEntity, FileAccessLevel } from './entities/file.entity';
import { NotFoundException, BadRequestException } from '@shared/exceptions/app.exception';

@Injectable()
export class FilesService {
    constructor(
        @InjectRepository(FileEntity)
        private filesRepository: Repository<FileEntity>,
        private storageService: StorageService,
        private configService: ConfigService,
    ) { }

    async uploadFile(
        file: Express.Multer.File,
        options: { userId: string; accessLevel?: FileAccessLevel; metadata?: Record<string, any> },
    ): Promise<FileEntity> {
        const { userId, accessLevel = FileAccessLevel.PRIVATE, metadata = {} } = options;
        // Upload to storage provider (S3, MinIO, etc.)
        const fileMetadata = await this.storageService.uploadBuffer(
            file.buffer,
            file.originalname,
            file.mimetype,
            { prefix: 'uploads' },
        );

        // Create file record in database
        const fileEntity = this.filesRepository.create({
            filename: fileMetadata.filename,
            originalName: file.originalname,
            size: file.size,
            mimeType: file.mimetype,
            key: fileMetadata.key,
            bucket: this.configService.get<string>('aws.s3.bucketName'),
            url: fileMetadata.url,
            userId,
            accessLevel,
            metadata,
        });

        return this.filesRepository.save(fileEntity);
    }

    async getPresignedUploadUrl(
        filename: string,
        contentType: string,
        userId: string,
        accessLevel: FileAccessLevel = FileAccessLevel.PRIVATE,
    ): Promise<{ uploadUrl: any; fileId: string }> {
        const presignedData = await this.storageService.getPresignedUploadUrl(
            filename,
            {
                contentType,
                prefix: 'uploads',
                maxSizeBytes: 10 * 1024 * 1024, // 10MB
            },
        );

        // Create file record in database (initially without size)
        const fileEntity = this.filesRepository.create({
            filename: presignedData.key.split('/').pop(),
            originalName: filename,
            size: 0, // Will be updated after upload
            mimeType: contentType,
            key: presignedData.key,
            bucket: presignedData.bucket,
            userId,
            accessLevel,
        });

        const savedFile = await this.filesRepository.save(fileEntity);

        return {
            uploadUrl: presignedData,
            fileId: savedFile.id,
        };
    }

    async getFile(id: string, userId?: string): Promise<FileEntity> {
        const file = await this.filesRepository.findOne({
            where: { id },
        });

        if (!file) {
            throw new NotFoundException('File not found');
        }

        // Check access rights
        if (
            file.accessLevel === FileAccessLevel.PRIVATE &&
            file.userId !== userId
        ) {
            throw new BadRequestException('You do not have access to this file');
        }

        // Get fresh signed URL
        if (file.key) {
            file.url = await this.storageService.getFileUrl(file.key);
        }

        return file;
    }

    async getFiles(userId: string): Promise<FileEntity[]> {
        const files = await this.filesRepository.find({
            where: [
                { userId },
                { accessLevel: FileAccessLevel.PUBLIC },
            ],
            order: {
                createdAt: 'DESC',
            },
        });

        // Update URLs for each file
        for (const file of files) {
            if (file.key) {
                file.url = await this.storageService.getFileUrl(file.key);
            }
        }

        return files;
    }

    async deleteFile(id: string, userId?: string): Promise<void> {
        const file = await this.filesRepository.findOne({
            where: { id },
        });

        if (!file) {
            throw new NotFoundException('File not found');
        }

        // Check access rights - only owner or admin can delete
        if (file.userId !== userId) {
            throw new BadRequestException('You do not have permission to delete this file');
        }

        // Delete from storage provider
        await this.storageService.deleteFile(file.key);

        // Delete from database (soft delete)
        await this.filesRepository.softDelete(id);
    }

    async completeUpload(fileId: string, size: number): Promise<FileEntity> {
        const file = await this.filesRepository.findOne({
            where: { id: fileId },
        });

        if (!file) {
            throw new NotFoundException('File not found');
        }

        // Update file size and url
        file.size = size;
        file.url = await this.storageService.getFileUrl(file.key);

        return this.filesRepository.save(file);
    }

    // Admin methods
    async findAll(options: { page: number; limit: number } = { page: 1, limit: 10 }): Promise<{ data: FileEntity[]; total: number }> {
        const { page, limit } = options;
        const skip = (page - 1) * limit;

        const [data, total] = await this.filesRepository.findAndCount({
            skip,
            take: limit,
            order: { createdAt: 'DESC' },
        });

        return { data, total };
    }

    async remove(id: string): Promise<void> {
        const file = await this.filesRepository.findOne({
            where: { id },
        });

        if (!file) {
            throw new NotFoundException('File not found');
        }

        // Delete from storage
        await this.storageService.deleteFile(file.key);

        // Delete from database
        await this.filesRepository.remove(file);
    }

    async getStats() {
        // Get total file count
        const total = await this.filesRepository.count();

        // Get total storage used
        const { sum } = await this.filesRepository
            .createQueryBuilder('file')
            .select('SUM(file.size)', 'sum')
            .getRawOne();

        // Get file types breakdown
        const typesBreakdown = await this.filesRepository
            .createQueryBuilder('file')
            .select('file.mimeType', 'type')
            .addSelect('COUNT(file.id)', 'count')
            .groupBy('file.mimeType')
            .getRawMany();

        return {
            total,
            totalSize: sum || 0,
            typeBreakdown: typesBreakdown,
        };
    }

    async getUserFiles(userId: string): Promise<FileEntity[]> {
        return this.filesRepository.find({
            where: { userId },
            order: { createdAt: 'DESC' },
        });
    }
}
