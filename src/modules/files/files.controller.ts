import {
    Controller,
    Post,
    Get,
    Delete,
    Param,
    UseInterceptors,
    UploadedFile,
    Body,
    UseGuards,
    Req,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@shared/guards/jwt-auth.guard';
import { FilesService } from './files.service';
import { FileAccessLevel } from './entities/file.entity';

@ApiTags('files')
@Controller('files')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FilesController {
    constructor(private readonly filesService: FilesService) { }

    @Post('upload')
    @ApiOperation({ summary: 'Upload a file' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                },
                accessLevel: {
                    type: 'string',
                    enum: Object.values(FileAccessLevel),
                    default: FileAccessLevel.PRIVATE,
                },
            },
        },
    })
    @ApiResponse({ status: HttpStatus.CREATED, description: 'File uploaded successfully' })
    @UseInterceptors(FileInterceptor('file'))
    async uploadFile(
        @UploadedFile() file: Express.Multer.File,
        @Body('accessLevel') accessLevel: FileAccessLevel = FileAccessLevel.PRIVATE,
        @Req() req: any,
    ) {
        return this.filesService.uploadFile(file, {
            userId: req.user.id,
            accessLevel,
        });
    }

    @Post('presigned-url')
    @ApiOperation({ summary: 'Get a presigned URL for direct file upload' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                filename: { type: 'string' },
                contentType: { type: 'string' },
                accessLevel: {
                    type: 'string',
                    enum: Object.values(FileAccessLevel),
                    default: FileAccessLevel.PRIVATE,
                },
            },
            required: ['filename', 'contentType'],
        },
    })
    @ApiResponse({ status: HttpStatus.OK, description: 'Presigned URL generated' })
    async getPresignedUrl(
        @Body('filename') filename: string,
        @Body('contentType') contentType: string,
        @Body('accessLevel') accessLevel: FileAccessLevel = FileAccessLevel.PRIVATE,
        @Req() req: any,
    ) {
        return this.filesService.getPresignedUploadUrl(
            filename,
            contentType,
            req.user.id,
            accessLevel,
        );
    }

    @Post('complete-upload/:fileId')
    @ApiOperation({ summary: 'Complete a direct upload process' })
    @ApiParam({ name: 'fileId', description: 'The ID of the file' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                size: { type: 'number' },
            },
            required: ['size'],
        },
    })
    @ApiResponse({ status: HttpStatus.OK, description: 'Upload completion recorded' })
    async completeUpload(
        @Param('fileId') fileId: string,
        @Body('size') size: number,
    ) {
        return this.filesService.completeUpload(fileId, size);
    }

    @Get()
    @ApiOperation({ summary: 'Get all files for the current user' })
    @ApiResponse({ status: HttpStatus.OK, description: 'List of files' })
    async getUserFiles(@Req() req: any) {
        return this.filesService.getFiles(req.user.id);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a file by ID' })
    @ApiParam({ name: 'id', description: 'The ID of the file' })
    @ApiResponse({ status: HttpStatus.OK, description: 'File details' })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'File not found' })
    async getFile(@Param('id') id: string, @Req() req: any) {
        return this.filesService.getFile(id, req.user.id);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a file' })
    @ApiParam({ name: 'id', description: 'The ID of the file' })
    @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'File deleted' })
    @HttpCode(HttpStatus.NO_CONTENT)
    async deleteFile(@Param('id') id: string, @Req() req: any) {
        await this.filesService.deleteFile(id, req.user.id);
    }
}
