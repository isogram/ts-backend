import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Server } from 'http';
import { Context, APIGatewayProxyEvent, APIGatewayProxyResult, SQSEvent } from 'aws-lambda';
import { createServer, proxy } from 'aws-serverless-express';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
import { INestApplication } from '@nestjs/common';
import { QueueService } from './shared/services/queue.service';

let cachedServer: Server;
let cachedApp: INestApplication;

async function bootstrapServer(): Promise<Server> {
    if (!cachedServer) {
        const expressApp = express();
        const nestApp = await NestFactory.create(AppModule, new ExpressAdapter(expressApp));

        // Setup global configuration
        nestApp.enableCors();

        await nestApp.init();

        cachedServer = createServer(expressApp);
        cachedApp = nestApp;
    }

    return cachedServer;
}

export async function handler(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
    const server = await bootstrapServer();
    return proxy(server, event, context, 'PROMISE').promise;
}

export async function taskHandler(event: SQSEvent, context: Context): Promise<void> {
    // If app is not initialized, bootstrap it
    if (!cachedApp) {
        const expressApp = express();
        cachedApp = await NestFactory.create(AppModule, new ExpressAdapter(expressApp));
        await cachedApp.init();
    }

    const queueService = cachedApp.get(QueueService);

    for (const record of event.Records) {
        try {
            const body = JSON.parse(record.body);
            await queueService.processMessage(body);
        } catch (error) {
            console.error('Failed to process SQS message:', error);
            throw error; // Re-throw to retry via SQS
        }
    }
}
