import {
    Controller,
    Post,
    Body,
    Req,
    HttpCode,
    HttpStatus,
    UseGuards,
    Get,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';

import { AuthService, LoginResponse } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtAuthGuard } from '@shared/guards/jwt-auth.guard';
import { Public } from '@shared/decorators/public.decorator'; @ApiTags('auth')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Public()
    @Post('login')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Login with email and password' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'User logged in successfully',
    })
    @ApiResponse({
        status: HttpStatus.UNAUTHORIZED,
        description: 'Invalid credentials',
    })
    async login(@Body() loginDto: LoginDto, @Req() req: Request): Promise<LoginResponse> {
        const user = await this.authService.validateUser(
            loginDto.email,
            loginDto.password,
        );

        return this.authService.login(
            user,
            req.headers['user-agent'],
            req.ip,
        );
    }

    @Public()
    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Refresh access token' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Token refreshed successfully',
    })
    @ApiResponse({
        status: HttpStatus.UNAUTHORIZED,
        description: 'Invalid refresh token',
    })
    async refresh(@Body() refreshTokenDto: RefreshTokenDto, @Req() req: Request): Promise<LoginResponse> {
        return this.authService.refreshToken(
            refreshTokenDto.refreshToken,
            req.headers['user-agent'],
            req.ip,
        );
    }

    @Public()
    @Post('logout')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Logout user' })
    @ApiResponse({
        status: HttpStatus.NO_CONTENT,
        description: 'User logged out successfully',
    })
    async logout(@Body() refreshTokenDto: RefreshTokenDto): Promise<void> {
        await this.authService.logout(refreshTokenDto.refreshToken);
    }

    @Post('logout-all')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Logout from all devices' })
    @ApiResponse({
        status: HttpStatus.NO_CONTENT,
        description: 'User logged out from all devices',
    })
    async logoutAll(@Req() req: any): Promise<void> {
        await this.authService.logoutAll(req.user.id);
    }

    @Get('me')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get current user profile' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'User profile retrieved successfully',
    })
    async getMe(@Req() req: any): Promise<any> {
        return req.user;
    }

    // OAuth routes would be added here
    // @Get('google')
    // @Get('google/callback')
    // etc.
}
