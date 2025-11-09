import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefreshTokenDto {
    @ApiProperty({
        example: '8e7d4f2c1b5a9e7d4f2c1b5a9e7d4f2c1b5a9e7d4f2c1b5a',
        description: 'The refresh token',
    })
    @IsNotEmpty({ message: 'Refresh token is required' })
    @IsString({ message: 'Refresh token must be a string' })
    refreshToken: string;
}
