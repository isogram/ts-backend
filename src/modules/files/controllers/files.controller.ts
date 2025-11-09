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
import { FilesService } from '../files.service';
import { FileAccessLevel } from '../entities/file.entity';

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
    @ApiResponse({ status: 201, description: 'File uploaded successfully' })
    @UseInterceptors(FileInterceptor('file'))
    async uploadFile(
        @UploadedFile() file: Express.Multer.File,
        @Body('accessLevel') accessLevel: FileAccessLevel = FileAccessLevel.PRIVATE,
        @Req() req,
    ) {
        return this.filesService.uploadFile(file, {
            userId: req.user.id,
            accessLevel,
        });
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a file by ID' })
    @ApiParam({ name: 'id', description: 'File ID' })
    @ApiResponse({ status: 200, description: 'File retrieved successfully' })
    @ApiResponse({ status: 404, description: 'File not found' })
    async getFile(@Param('id') id: string, @Req() req) {
        return this.filesService.getFile(id, req.user.id);
    }

    @Get('user/files')
    @ApiOperation({ summary: 'Get files uploaded by the current user' })
    @ApiResponse({ status: 200, description: 'Files retrieved successfully' })
    async getUserFiles(@Req() req) {
        return this.filesService.getUserFiles(req.user.id);
    }
}
