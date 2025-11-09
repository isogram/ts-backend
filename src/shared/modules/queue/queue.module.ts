import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigModule } from '@nestjs/config';
import { QueueService } from '@shared/services/queue.service';
import { EmailService } from '@shared/services/email.service';
import { FileProcessingService } from '@shared/services/file-processing.service';
import { EmailProcessor } from './processors/email.processor';
import { FileProcessor } from './processors/file.processor';
import { QueueDemoController } from './queue-demo.controller';

@Module({
    imports: [
        // Import the default queue that's already registered in app.module
        BullModule.registerQueue({
            name: 'default',
        }),
        ConfigModule,
    ],
    controllers: [QueueDemoController],
    providers: [
        QueueService,
        EmailService,
        FileProcessingService,
        EmailProcessor,
        FileProcessor,
    ],
    exports: [
        QueueService,
        EmailService,
        FileProcessingService,
    ],
})
export class QueueModule { }
