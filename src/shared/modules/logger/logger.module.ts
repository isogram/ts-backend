import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import { LoggerService } from './logger.service';

@Module({
    imports: [
        WinstonModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => {
                const logLevel = configService.get('app.logLevel', 'info');

                return {
                    level: logLevel,
                    transports: [
                        new winston.transports.Console({
                            level: logLevel,
                            format: winston.format.combine(
                                winston.format.timestamp(),
                                winston.format.ms(),
                                winston.format.colorize(),
                                winston.format.printf((info) => {
                                    const { timestamp, level, message, context, traceId, requestId, correlationId } = info;
                                    const contextStr = context || 'Application';
                                    const traceInfo = traceId ? `[trace:${traceId}]` : '';
                                    const requestInfo = requestId ? `[req:${requestId}]` : '';
                                    return `${timestamp} [${level}] ${traceInfo}${requestInfo} [${contextStr}] - ${message}`;
                                }),
                            ),
                        }),
                        new winston.transports.File({
                            filename: 'logs/error.log',
                            level: 'error',
                            format: winston.format.combine(
                                winston.format.timestamp(),
                                winston.format.json(),
                                winston.format.printf((info) => {
                                    return JSON.stringify({
                                        ...info,
                                        traceId: info.traceId || null,
                                        requestId: info.requestId || null,
                                        correlationId: info.correlationId || null,
                                    });
                                }),
                            ),
                        }),
                        new winston.transports.File({
                            filename: 'logs/combined.log',
                            level: logLevel,
                            format: winston.format.combine(
                                winston.format.timestamp(),
                                winston.format.json(),
                                winston.format.printf((info) => {
                                    return JSON.stringify({
                                        ...info,
                                        traceId: info.traceId || null,
                                        requestId: info.requestId || null,
                                        correlationId: info.correlationId || null,
                                    });
                                }),
                            ),
                        }),
                    ],
                };
            },
        }),
    ],
    providers: [LoggerService],
    exports: [LoggerService],
})
export class LoggerModule { }
