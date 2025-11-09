import { HttpException, HttpStatus } from '@nestjs/common';

export class AppException extends HttpException {
    constructor(message: string, status: HttpStatus) {
        super(message, status);
    }
}

export class BadRequestException extends AppException {
    constructor(message = 'Bad request') {
        super(message, HttpStatus.BAD_REQUEST);
    }
}

export class UnauthorizedException extends AppException {
    constructor(message = 'Unauthorized') {
        super(message, HttpStatus.UNAUTHORIZED);
    }
}

export class ForbiddenException extends AppException {
    constructor(message = 'Forbidden') {
        super(message, HttpStatus.FORBIDDEN);
    }
}

export class NotFoundException extends AppException {
    constructor(message = 'Resource not found') {
        super(message, HttpStatus.NOT_FOUND);
    }
}

export class ConflictException extends AppException {
    constructor(message = 'Conflict') {
        super(message, HttpStatus.CONFLICT);
    }
}

export class InternalServerErrorException extends AppException {
    constructor(message = 'Internal server error') {
        super(message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}

export class ServiceUnavailableException extends AppException {
    constructor(message = 'Service unavailable') {
        super(message, HttpStatus.SERVICE_UNAVAILABLE);
    }
}

export class ValidationException extends AppException {
    constructor(errors: Record<string, any>) {
        super(
            'Validation failed',
            HttpStatus.UNPROCESSABLE_ENTITY,
        );
        Object.defineProperty(this, 'response', {
            value: {
                statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
                error: 'Validation failed',
                errors,
            }
        });
    }
}
