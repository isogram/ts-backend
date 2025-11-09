import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullBoardModule } from '@bull-board/nestjs';
import { ExpressAdapter } from '@bull-board/express';
import { BullAdapter } from '@bull-board/api/bullAdapter';
import basicAuth from "express-basic-auth";

@Module({
    imports: [
        BullModule.registerQueue({
            name: 'default',
        }),
        ConfigModule,
        BullBoardModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                route: '/admin/queues',
                adapter: ExpressAdapter,
                middleware: basicAuth({
                    challenge: true,
                    users: {
                        [configService.get('app.basicAuthUsername', 'admin')]: configService.get('app.basicAuthPassword', 'password')
                    },
                }),
            }),
        }),
        BullBoardModule.forFeature({
            name: 'default',
            adapter: BullAdapter,
        }),
    ],
})
export class QueueUIModule { }
