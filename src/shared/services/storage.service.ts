import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuid } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';
import * as mime from 'mime-types';
import { BadRequestException, InternalServerErrorException } from '@shared/exceptions/app.exception';
import { TracingService } from './tracing.service';

export interface FileUploadOptions {
    prefix?: string;
    maxSizeBytes?: number;
    contentType?: string;
}

export interface PresignedUploadResult {
    url: string;
    fields: Record<string, string>;
    key: string;
    bucket: string;
}

export interface FileMetadata {
    key: string;
    filename: string;
    contentType: string;
    size: number;
    lastModified?: Date;
    url?: string;
}

@Injectable()
export class StorageService {
    private readonly logger = new Logger(StorageService.name);
    private s3Client: S3Client;
    private readonly bucketName: string;
    private readonly storageDriver: string;
    private readonly localUploadDir: string;

    constructor(private configService: ConfigService) {
        this.storageDriver = this.configService.get<string>('storage.driver', 's3');
        this.localUploadDir = this.configService.get<string>('storage.local.uploadDir', './uploads');

        // Ensure local upload directory exists if using local storage
        if (this.storageDriver === 'local') {
            if (!fs.existsSync(this.localUploadDir)) {
                fs.mkdirSync(this.localUploadDir, { recursive: true });
            }
        }

        // Initialize S3 client if using S3 storage
        if (this.storageDriver === 's3') {
            const region = this.configService.get<string>('aws.s3.region');
            const accessKeyId = this.configService.get<string>('aws.s3.accessKeyId');
            const secretAccessKey = this.configService.get<string>('aws.s3.secretAccessKey');
            this.bucketName = this.configService.get<string>('aws.s3.bucketName', 'ts-backend-uploads');
            const endpoint = this.configService.get<string>('aws.s3.endpoint');

            const s3Config: any = {
                region,
                credentials: {
                    accessKeyId,
                    secretAccessKey,
                },
            };

            // Add custom endpoint for MinIO
            if (endpoint) {
                s3Config.endpoint = endpoint;
                s3Config.forcePathStyle = true;
            }

            this.s3Client = new S3Client(s3Config);
        }
    }

    /**
     * Upload a file to storage (Buffer)
     */
    async uploadBuffer(
        buffer: Buffer,
        filename: string,
        contentType: string,
        options: FileUploadOptions = {},
    ): Promise<FileMetadata> {
        const traceId = TracingService.getTraceId();
        const key = this.generateKey(filename, options.prefix);

        this.logger.debug(`[${traceId}] Uploading buffer to ${this.storageDriver} storage: ${key}`, 'StorageService');

        try {
            if (this.storageDriver === 's3') {
                return this.uploadBufferToS3(buffer, key, contentType);
            } else {
                return this.uploadBufferToLocal(buffer, key, contentType);
            }
        } catch (error) {
            this.logger.error(`[${traceId}] Failed to upload buffer: ${error.message}`, error.stack, 'StorageService');
            throw error;
        }
    }

    /**
     * Get a presigned URL for direct browser upload
     */
    async getPresignedUploadUrl(
        filename: string,
        options: FileUploadOptions = {},
    ): Promise<PresignedUploadResult> {
        const traceId = TracingService.getTraceId();

        if (this.storageDriver !== 's3') {
            this.logger.error(`[${traceId}] Presigned URLs requested for non-S3 storage`, null, 'StorageService');
            throw new BadRequestException('Presigned URLs are only supported with S3 storage driver');
        }

        const key = this.generateKey(filename, options.prefix);
        const contentType = options.contentType || mime.lookup(filename) || 'application/octet-stream';

        this.logger.debug(`[${traceId}] Generating presigned URL for: ${key}`, 'StorageService');

        const params = {
            Bucket: this.bucketName,
            Key: key,
            Conditions: [
                ['content-length-range', 0, options.maxSizeBytes || 10485760] as any, // Default 10MB max
            ],
            Fields: {
                'Content-Type': contentType,
            },
            Expires: 3600, // URL expires in 1 hour
        } as any;

        try {
            const presignedPost = await createPresignedPost(this.s3Client, params);
            this.logger.debug(`[${traceId}] Presigned URL generated successfully for: ${key}`, 'StorageService');
            return {
                ...presignedPost,
                key,
                bucket: this.bucketName,
            };
        } catch (error) {
            this.logger.error(`[${traceId}] Failed to generate presigned URL: ${error.message}`, error.stack, 'StorageService');
            throw new InternalServerErrorException(`Failed to generate presigned URL: ${error.message}`);
        }
    }

    /**
     * Get download URL for a file
     */
    async getFileUrl(key: string, expiresInSeconds = 3600): Promise<string> {
        if (this.storageDriver === 's3') {
            const command = new GetObjectCommand({
                Bucket: this.bucketName,
                Key: key,
            });

            return getSignedUrl(this.s3Client, command, { expiresIn: expiresInSeconds });
        } else {
            // For local storage, we'd typically serve via a static files endpoint
            return `/uploads/${key}`;
        }
    }

    /**
     * Delete a file from storage
     */
    async deleteFile(key: string): Promise<void> {
        const traceId = TracingService.getTraceId();

        this.logger.debug(`[${traceId}] Deleting file from ${this.storageDriver} storage: ${key}`, 'StorageService');

        try {
            if (this.storageDriver === 's3') {
                const command = new DeleteObjectCommand({
                    Bucket: this.bucketName,
                    Key: key,
                });

                await this.s3Client.send(command);
            } else {
                const filePath = path.join(this.localUploadDir, key);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            }

            this.logger.debug(`[${traceId}] File deleted successfully: ${key}`, 'StorageService');
        } catch (error) {
            this.logger.error(`[${traceId}] Failed to delete file: ${error.message}`, error.stack, 'StorageService');
            throw error;
        }
    }

    /**
     * Get file metadata
     */
    async getFileMetadata(key: string): Promise<FileMetadata | null> {
        try {
            if (this.storageDriver === 's3') {
                const command = new GetObjectCommand({
                    Bucket: this.bucketName,
                    Key: key,
                });

                const response = await this.s3Client.send(command);
                const url = await this.getFileUrl(key);

                return {
                    key,
                    filename: path.basename(key),
                    contentType: response.ContentType || 'application/octet-stream',
                    size: response.ContentLength || 0,
                    lastModified: response.LastModified,
                    url,
                };
            } else {
                const filePath = path.join(this.localUploadDir, key);
                if (!fs.existsSync(filePath)) {
                    return null;
                }

                const stats = fs.statSync(filePath);
                return {
                    key,
                    filename: path.basename(key),
                    contentType: mime.lookup(key) || 'application/octet-stream',
                    size: stats.size,
                    lastModified: stats.mtime,
                    url: `/uploads/${key}`,
                };
            }
        } catch (error) {
            return null;
        }
    }

    private generateKey(filename: string, prefix?: string): string {
        const id = uuid();
        const ext = path.extname(filename);
        const basename = path.basename(filename, ext);
        const sanitizedBasename = basename.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();

        // Include prefix if provided, with trailing slash
        const prefixPath = prefix ? `${prefix.replace(/\/$/, '')}/` : '';

        // Format: prefix/yyyy-mm-dd/uuid-sanitized-filename.ext
        const date = new Date().toISOString().split('T')[0];
        return `${prefixPath}${date}/${id}-${sanitizedBasename}${ext}`;
    }

    private async uploadBufferToS3(
        buffer: Buffer,
        key: string,
        contentType: string,
    ): Promise<FileMetadata> {
        try {
            const command = new PutObjectCommand({
                Bucket: this.bucketName,
                Key: key,
                Body: buffer,
                ContentType: contentType,
            });

            await this.s3Client.send(command);

            const url = await this.getFileUrl(key);

            return {
                key,
                filename: path.basename(key),
                contentType,
                size: buffer.length,
                url,
            };
        } catch (error) {
            throw new InternalServerErrorException(`Failed to upload file to S3: ${error.message}`);
        }
    }

    private async uploadBufferToLocal(
        buffer: Buffer,
        key: string,
        contentType: string,
    ): Promise<FileMetadata> {
        try {
            // Ensure directory exists
            const filePath = path.join(this.localUploadDir, key);
            const fileDir = path.dirname(filePath);

            if (!fs.existsSync(fileDir)) {
                fs.mkdirSync(fileDir, { recursive: true });
            }

            // Write file
            fs.writeFileSync(filePath, buffer);

            return {
                key,
                filename: path.basename(key),
                contentType,
                size: buffer.length,
                url: `/uploads/${key}`,
            };
        } catch (error) {
            throw new InternalServerErrorException(`Failed to save file locally: ${error.message}`);
        }
    }
}
