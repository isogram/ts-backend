import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import type { Job } from 'bull';
import { TracingService } from '@shared/services/tracing.service';

@Processor('default')
export class EmailProcessor {
    private readonly logger = new Logger(EmailProcessor.name);

    @Process('email:send')
    async handleSendEmail(job: Job): Promise<void> {
        // Create tracing context for this background job
        const traceId = job.data.payload?.traceId || TracingService.generateTraceId();
        const context = TracingService.createContext({
            traceId,
            requestId: `job-${job.id}`,
            correlationId: traceId
        });

        return TracingService.runWithContext(context, async () => {
            this.logger.debug(`Processing email:send job ${job.id}`);
            this.logger.debug(`Job data: ${JSON.stringify(job.data)}`);

            try {
                const { to, subject, template, data } = job.data.payload || job.data;

                // Add progress tracking
                await job.progress(10);

                // Here you would implement your email sending logic
                // For example:
                // await this.emailService.sendTemplateEmail(to, subject, template, data);

                // For demonstration purposes, let's simulate email sending
                this.logger.log(`Sending email to ${to} with subject "${subject}" using template "${template}"`);

                // Simulate some processing time
                await new Promise(resolve => setTimeout(resolve, 1000));
                await job.progress(50);

                // Simulate more processing
                await new Promise(resolve => setTimeout(resolve, 1000));
                await job.progress(100);

                this.logger.log(`Email to ${to} sent successfully`);
            } catch (error) {
                this.logger.error(`Failed to process email:send job ${job.id}: ${error.message}`, error.stack);
                throw error; // Rethrow to let Bull handle retry logic
            }
        });
    }

    @Process('email:verify')
    async handleVerifyEmail(job: Job): Promise<void> {
        // Create tracing context for this background job
        const traceId = job.data.payload?.traceId || TracingService.generateTraceId();
        const context = TracingService.createContext({
            traceId,
            requestId: `job-${job.id}`,
            correlationId: traceId
        });

        return TracingService.runWithContext(context, async () => {
            this.logger.debug(`Processing email:verify job ${job.id}`);

            try {
                const { userId, email } = job.data.payload || job.data;

                // Implement verification email logic here
                this.logger.log(`Sending verification email to ${email} for user ${userId}`);

                // Simulate processing
                await new Promise(resolve => setTimeout(resolve, 500));

                this.logger.log(`Verification email to ${email} sent successfully`);
            } catch (error) {
                this.logger.error(`Failed to process email:verify job ${job.id}: ${error.message}`, error.stack);
                throw error;
            }
        });
    }
}
