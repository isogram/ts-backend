import { Inject, Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { TracingService } from '@shared/services/tracing.service';

@Injectable()
export class LoggerService implements NestLoggerService {
    constructor(@Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger) { }

    private enrichWithTracingContext(context?: string): any {
        const tracingContext = TracingService.getContext();
        return {
            context,
            traceId: tracingContext?.traceId,
            requestId: tracingContext?.requestId,
            correlationId: tracingContext?.correlationId,
        };
    }

    log(message: string, context?: string): void {
        this.logger.info(message, this.enrichWithTracingContext(context));
    }

    error(message: string, trace?: string, context?: string): void {
        this.logger.error(message, {
            trace,
            ...this.enrichWithTracingContext(context)
        });
    }

    warn(message: string, context?: string): void {
        this.logger.warn(message, this.enrichWithTracingContext(context));
    }

    debug(message: string, context?: string): void {
        this.logger.debug(message, this.enrichWithTracingContext(context));
    }

    verbose(message: string, context?: string): void {
        this.logger.verbose(message, this.enrichWithTracingContext(context));
    }

    /**
     * Set the log level dynamically
     * @param level - The log level to set (error, warn, info, http, verbose, debug, silly)
     */
    setLogLevel(level: string): void {
        this.logger.level = level;
    }
}
