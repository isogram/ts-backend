import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import type { Job } from 'bull';

@Processor('default')
export class FileProcessor {
    private readonly logger = new Logger(FileProcessor.name);

    @Process('file:process')
    async handleFileProcess(job: Job): Promise<void> {
        this.logger.debug(`Processing file:process job ${job.id}`);
        this.logger.debug(`Job data: ${JSON.stringify(job.data)}`);

        try {
            const { fileId, userId, operations } = job.data;

            // Add progress tracking
            await job.progress(10);

            // Here you would implement your file processing logic
            // For example:
            // const file = await this.fileService.findById(fileId);
            // await this.fileService.process(file, operations);

            // For demonstration purposes, let's simulate processing
            this.logger.log(`Processing file ${fileId} for user ${userId}`);

            if (operations?.resize) {
                this.logger.log(`Resizing file to ${operations.resize.width}x${operations.resize.height}`);
                await new Promise(resolve => setTimeout(resolve, 1000));
                await job.progress(40);
            }

            if (operations?.compress) {
                this.logger.log(`Compressing file with quality ${operations.compress.quality}`);
                await new Promise(resolve => setTimeout(resolve, 800));
                await job.progress(70);
            }

            if (operations?.convert) {
                this.logger.log(`Converting file to ${operations.convert.format}`);
                await new Promise(resolve => setTimeout(resolve, 1200));
                await job.progress(90);
            }

            // Finalize processing
            await job.progress(100);
            this.logger.log(`File ${fileId} processed successfully`);
        } catch (error) {
            this.logger.error(`Failed to process file:process job ${job.id}: ${error.message}`, error.stack);
            throw error; // Rethrow to let Bull handle retry logic
        }
    }
}
