import { Injectable, Logger } from '@nestjs/common';
import { QueueService } from '@shared/services/queue.service';

interface FileProcessingOptions {
    resize?: {
        width: number;
        height: number;
    };
    compress?: {
        quality: number;
    };
    convert?: {
        format: string;
    };
}

@Injectable()
export class FileProcessingService {
    private readonly logger = new Logger(FileProcessingService.name);

    constructor(private queueService: QueueService) { }

    /**
     * Queue a file for processing
     */
    async processFile(
        fileId: string,
        userId: string,
        options: FileProcessingOptions
    ): Promise<string | undefined> {
        this.logger.log(`Queueing file ${fileId} for processing`);

        try {
            const jobId = await this.queueService.add({
                name: 'file:process',
                payload: {
                    fileId,
                    userId,
                    operations: options,
                },
                // Can add additional options like delay
                // delaySeconds: 5,
            });

            this.logger.debug(`File processing queued with job ID: ${jobId}`);
            return jobId;
        } catch (error) {
            this.logger.error(`Failed to queue file processing: ${error.message}`, error.stack);
            throw error;
        }
    }
}
