import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { v4 as uuid } from 'uuid';
import { TracingService } from '@shared/services/tracing.service';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(GlobalExceptionFilter.name);

    catch(exception: any, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        // Get tracing context from current request or extract from headers
        const tracingContext = TracingService.getContext() || TracingService.extractFromHeaders(request.headers);
        const traceId = tracingContext.traceId;
        const requestId = tracingContext.requestId || uuid();
        const correlationId = tracingContext.correlationId || traceId;

        let status: number;
        let message: string;
        let errorResponse: any = {};

        if (exception instanceof HttpException) {
            status = exception.getStatus();
            const excResponse = exception.getResponse();

            if (typeof excResponse === 'object') {
                message = excResponse['message'] || exception.message;
                errorResponse = excResponse;
            } else {
                message = exception.message;
            }
        } else {
            status = HttpStatus.INTERNAL_SERVER_ERROR;
            message = 'Internal server error';
        }

        // Don't log 404 errors as errors
        if (status === 404) {
            this.logger.debug(
                `[${traceId}][${requestId}] ${request.method} ${request.url} - ${status} ${message}`,
            );
        } else if (status >= 500) {
            this.logger.error(
                `[${traceId}][${requestId}] ${request.method} ${request.url} - ${status} ${message}`,
                exception.stack,
            );
        } else {
            this.logger.warn(
                `[${traceId}][${requestId}] ${request.method} ${request.url} - ${status} ${message}`,
            );
        }

        // Standardized error response format
        const responseBody = {
            statusCode: status,
            timestamp: new Date().toISOString(),
            path: request.url,
            traceId,
            requestId,
            correlationId,
            message,
            ...errorResponse,
        };

        // Remove stack trace in production
        if (process.env.NODE_ENV === 'production' && responseBody['stack']) {
            delete responseBody['stack'];
        }

        response.status(status).json(responseBody);
    }
}
