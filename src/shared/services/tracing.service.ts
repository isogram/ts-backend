import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';
import { v4 as uuid } from 'uuid';

export interface TracingContext {
    traceId: string;
    requestId?: string;
    correlationId?: string;
}

@Injectable()
export class TracingService {
    private static asyncLocalStorage = new AsyncLocalStorage<TracingContext>();

    /**
     * Run a callback with a specific tracing context
     */
    static runWithContext<T>(context: TracingContext, callback: () => T): T {
        return TracingService.asyncLocalStorage.run(context, callback);
    }

    /**
     * Get the current tracing context
     */
    static getContext(): TracingContext | undefined {
        return TracingService.asyncLocalStorage.getStore();
    }

    /**
     * Get the current trace ID
     */
    static getTraceId(): string | undefined {
        const context = TracingService.getContext();
        return context?.traceId;
    }

    /**
     * Get the current request ID
     */
    static getRequestId(): string | undefined {
        const context = TracingService.getContext();
        return context?.requestId;
    }

    /**
     * Get the current correlation ID
     */
    static getCorrelationId(): string | undefined {
        const context = TracingService.getContext();
        return context?.correlationId;
    }

    /**
     * Create a new tracing context with optional parameters
     */
    static createContext(options: Partial<TracingContext> = {}): TracingContext {
        const traceId = options.traceId || uuid();
        const requestId = options.requestId || uuid();
        const correlationId = options.correlationId || traceId;

        return {
            traceId,
            requestId,
            correlationId,
        };
    }

    /**
     * Set or update values in the current context
     */
    static updateContext(updates: Partial<TracingContext>): void {
        const currentContext = TracingService.getContext();
        if (currentContext) {
            Object.assign(currentContext, updates);
        }
    }

    /**
     * Generate a new trace ID
     */
    static generateTraceId(): string {
        return uuid();
    }

    /**
     * Get headers object with tracing information for outgoing requests
     */
    static getTracingHeaders(): Record<string, string> {
        const context = TracingService.getContext();
        const headers: Record<string, string> = {};

        if (context?.traceId) {
            headers['x-trace-id'] = context.traceId;
        }

        if (context?.requestId) {
            headers['x-request-id'] = context.requestId;
        }

        if (context?.correlationId) {
            headers['x-correlation-id'] = context.correlationId;
        }

        return headers;
    }

    /**
     * Extract tracing context from incoming request headers
     */
    static extractFromHeaders(headers: Record<string, any>): TracingContext {
        const traceId = headers['x-trace-id'] || TracingService.generateTraceId();
        const requestId = headers['x-request-id'] || uuid();
        const correlationId = headers['x-correlation-id'] || traceId;

        return {
            traceId,
            requestId,
            correlationId,
        };
    }
}