import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bull';
import type { Queue as BullQueue } from 'bull';
import { SQSClient, SendMessageCommand, ReceiveMessageCommand, DeleteMessageCommand } from '@aws-sdk/client-sqs';
import { TracingService } from './tracing.service';

export interface QueueMessage {
    id?: string;
    name: string;
    payload: Record<string, any>;
    delaySeconds?: number;
    groupId?: string; // For FIFO queues
    deduplicationId?: string; // For FIFO queues
}

@Injectable()
export class QueueService {
    private readonly logger = new Logger(QueueService.name);
    private sqsClient: SQSClient;
    private sqsQueueUrl: string;
    private readonly driver: string;

    constructor(
        private configService: ConfigService,
        @InjectQueue('default') private defaultQueue: BullQueue,
    ) {
        this.driver = this.configService.get<string>('queue.driver', 'bull');

        // Initialize SQS client if using SQS
        if (this.driver === 'sqs') {
            const region = this.configService.get<string>('aws.sqs.region') || 'us-east-1';
            const accessKeyId = this.configService.get<string>('aws.sqs.accessKeyId') || '';
            const secretAccessKey = this.configService.get<string>('aws.sqs.secretAccessKey') || '';
            this.sqsQueueUrl = this.configService.get<string>('aws.sqs.queueUrl') || '';

            this.sqsClient = new SQSClient({
                region,
                credentials: {
                    accessKeyId,
                    secretAccessKey,
                },
            });
        }
    }

    /**
     * Add a job to the queue
     */
    async add(message: QueueMessage): Promise<string | undefined> {
        try {
            // Enrich payload with current tracing context
            const tracingContext = TracingService.getContext();
            const enrichedPayload = {
                ...message.payload,
                traceId: tracingContext?.traceId,
                parentRequestId: tracingContext?.requestId,
            };

            this.logger.debug(`Adding job to queue: ${message.name}`);

            if (this.driver === 'bull') {
                const job = await this.defaultQueue.add(
                    message.name,
                    {
                        ...message,
                        payload: enrichedPayload
                    },
                    {
                        delay: message.delaySeconds ? message.delaySeconds * 1000 : undefined,
                        jobId: message.id,
                    },
                );
                return job.id.toString();
            } else if (this.driver === 'sqs') {
                const command = new SendMessageCommand({
                    QueueUrl: this.sqsQueueUrl,
                    MessageBody: JSON.stringify({
                        name: message.name,
                        payload: enrichedPayload,
                    }),
                    DelaySeconds: message.delaySeconds,
                    MessageGroupId: message.groupId, // Only for FIFO queues
                    MessageDeduplicationId: message.deduplicationId, // Only for FIFO queues
                });

                const response = await this.sqsClient.send(command);
                return response.MessageId;
            }
        } catch (error) {
            this.logger.error(`Failed to add message to queue: ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * Process a message from the queue
     * This is used by the AWS Lambda SQS handler
     */
    async processMessage(message: any): Promise<void> {
        try {
            const { name, payload } = typeof message === 'string'
                ? JSON.parse(message)
                : message;

            this.logger.debug(`Processing message: ${name}`);

            // For SQS messages, add them to the Bull queue for processing
            // This ensures consistent processing logic regardless of the source
            if (this.driver === 'bull') {
                // If already using Bull, the processors will handle it automatically
                this.logger.debug(`Using Bull processor for message: ${name}`);
            } else {
                // If using SQS, add to Bull queue for processing
                await this.defaultQueue.add(name, payload);
                this.logger.debug(`Added SQS message to Bull queue: ${name}`);
            }
        } catch (error) {
            this.logger.error(`Error processing message: ${error.message}`, error.stack);
            throw error;
        }
    }
}
