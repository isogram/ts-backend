import { Injectable, Logger } from '@nestjs/common';
import { QueueService } from '@shared/services/queue.service';

@Injectable()
export class EmailService {
    private readonly logger = new Logger(EmailService.name);

    constructor(private queueService: QueueService) { }

    /**
     * Send an email asynchronously via the queue
     */
    async sendEmail(to: string, subject: string, template: string, data: Record<string, any>): Promise<string | undefined> {
        this.logger.log(`Queueing email to ${to} with subject: ${subject}`);

        try {
            const jobId = await this.queueService.add({
                name: 'email:send',
                payload: {
                    to,
                    subject,
                    template,
                    data,
                },
            });

            this.logger.debug(`Email queued with job ID: ${jobId}`);
            return jobId;
        } catch (error) {
            this.logger.error(`Failed to queue email: ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * Send a verification email asynchronously
     */
    async sendVerificationEmail(userId: string, email: string, verificationLink: string): Promise<string | undefined> {
        this.logger.log(`Queueing verification email to ${email}`);

        try {
            const jobId = await this.queueService.add({
                name: 'email:verify',
                payload: {
                    userId,
                    email,
                    verificationLink,
                },
            });

            this.logger.debug(`Verification email queued with job ID: ${jobId}`);
            return jobId;
        } catch (error) {
            this.logger.error(`Failed to queue verification email: ${error.message}`, error.stack);
            throw error;
        }
    }
}
