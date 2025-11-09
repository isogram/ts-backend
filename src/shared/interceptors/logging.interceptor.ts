import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
    Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, finalize } from 'rxjs/operators';
import { v4 as uuid } from 'uuid';
import { Request, Response } from 'express';
import { TracingService } from '@shared/services/tracing.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
    private readonly logger = new Logger(LoggingInterceptor.name);

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest<Request>();
        const response = context.switchToHttp().getResponse<Response>();
        const { method, url, body, params, query, headers } = request;

        // Extract tracing context from headers
        const tracingContext = TracingService.extractFromHeaders(headers);

        // Store in request object for easier access from other parts of the app
        request['requestId'] = tracingContext.requestId;
        request['correlationId'] = tracingContext.correlationId;
        request['traceId'] = tracingContext.traceId;

        // Add all tracing headers to request
        request.headers['x-request-id'] = tracingContext.requestId;
        request.headers['x-correlation-id'] = tracingContext.correlationId;
        request.headers['x-trace-id'] = tracingContext.traceId;

        // Add all tracing headers to response
        response.setHeader('x-request-id', tracingContext.requestId!);
        response.setHeader('x-correlation-id', tracingContext.correlationId!);
        response.setHeader('x-trace-id', tracingContext.traceId);

        const userAgent = headers['user-agent'] || 'unknown';
        const ip = this.getClientIp(request);

        const startTime = Date.now();

        // Run the rest of the request processing within the tracing context
        return TracingService.runWithContext(tracingContext, () => {
            // Log the incoming request
            this.logger.log(
                `[${tracingContext.traceId}][${tracingContext.requestId}] ${method} ${url} - Start - IP: ${ip} - User-Agent: ${userAgent}`,
            );

            return next.handle().pipe(
                tap(() => {
                    // This runs on success
                    const statusCode = response.statusCode;
                    const responseTime = Date.now() - startTime;

                    this.logger.log(
                        `[${tracingContext.traceId}][${tracingContext.requestId}] ${method} ${url} - ${statusCode} - ${responseTime}ms`,
                    );
                }),
                finalize(() => {
                    // This runs on both success and failure
                    const responseTime = Date.now() - startTime;

                    // Log the request details for debugging (only in development)
                    if (process.env.NODE_ENV === 'development') {
                        const sanitizedBody = this.sanitizeData(body);
                        const sanitizedQuery = this.sanitizeData(query);
                        const sanitizedParams = this.sanitizeData(params);

                        this.logger.debug(
                            `[${tracingContext.traceId}][${tracingContext.requestId}] Request details: ${JSON.stringify({
                                params: sanitizedParams,
                                query: sanitizedQuery,
                                body: sanitizedBody,
                            })}`,
                        );
                    }
                }),
            );
        });
    }

    private getClientIp(request: Request): string {
        const xForwardedFor = request.headers['x-forwarded-for'];
        if (xForwardedFor) {
            return Array.isArray(xForwardedFor)
                ? xForwardedFor[0]
                : xForwardedFor.split(',')[0];
        }
        return request.ip || 'unknown';
    }

    private sanitizeData(data: any): any {
        if (!data) {
            return data;
        }

        // Deep clone the object to avoid modifying the original
        const sanitized = JSON.parse(JSON.stringify(data));

        // List of sensitive fields to redact
        const sensitiveFields = [
            'password',
            'token',
            'refreshToken',
            'accessToken',
            'authorization',
            'secret',
            'key',
            'apiKey',
            'credit_card',
            'creditCard',
            'cvv',
            'ssn',
            'socialSecurityNumber',
        ];

        // Recursively sanitize the object
        this.redactSensitiveFields(sanitized, sensitiveFields);

        return sanitized;
    }

    private redactSensitiveFields(obj: any, sensitiveFields: string[]): void {
        if (!obj || typeof obj !== 'object') {
            return;
        }

        // Handle arrays
        if (Array.isArray(obj)) {
            obj.forEach((item) => this.redactSensitiveFields(item, sensitiveFields));
            return;
        }

        // Handle objects
        Object.keys(obj).forEach((key) => {
            const lowerKey = key.toLowerCase();

            if (
                sensitiveFields.some(field =>
                    lowerKey.includes(field.toLowerCase())
                )
            ) {
                obj[key] = '[REDACTED]';
            } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                this.redactSensitiveFields(obj[key], sensitiveFields);
            }
        });
    }
}
