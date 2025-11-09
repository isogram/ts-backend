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
    Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@shared/guards/jwt-auth.guard';
import { RolesGuard } from '@shared/guards/roles.guard';
import { Roles } from '@shared/decorators/roles.decorator';
import { FilesService } from '../files.service';
import { FileAccessLevel } from '../entities/file.entity';
import { UserRole } from '@modules/users/entities/user.entity';

@ApiTags('admin/files')
@Controller('admin/files')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
@ApiBearerAuth()
export class AdminFilesController {
    constructor(private readonly filesService: FilesService) { }

    @Get()
    @ApiOperation({ summary: 'List all files (Admin only)' })
    @ApiResponse({ status: 200, description: 'Files retrieved successfully' })
    async getAllFiles(
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 10,
    ) {
        // Add method to return all files with pagination
        return this.filesService.findAll({ page, limit });
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a file (Admin only)' })
    @ApiParam({ name: 'id', description: 'File ID' })
    @ApiResponse({ status: 200, description: 'File deleted successfully' })
    @ApiResponse({ status: 404, description: 'File not found' })
    @HttpCode(HttpStatus.OK)
    async deleteFile(@Param('id') id: string) {
        return this.filesService.remove(id);
    }

    @Get('stats')
    @ApiOperation({ summary: 'Get file statistics (Admin only)' })
    @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
    async getFileStats() {
        // Implement a method in filesService to return stats like:
        // - Total file count
        // - Total storage used
        // - File types breakdown
        return this.filesService.getStats();
    }
}
