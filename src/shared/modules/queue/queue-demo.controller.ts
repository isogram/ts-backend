import { Controller, Post, Body, Logger, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { EmailService } from '@shared/services/email.service';
import { FileProcessingService } from '@shared/services/file-processing.service';
import { Public } from '@shared/decorators/public.decorator';

class SendEmailDto {
    to: string;
    subject: string;
    template: string;
    data: Record<string, any>;
}

class ProcessFileDto {
    fileId: string;
    userId: string;
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

@ApiTags('queue-demo')
@Controller('queue-demo')
export class QueueDemoController {
    private readonly logger = new Logger(QueueDemoController.name);

    constructor(
        private readonly emailService: EmailService,
        private readonly fileProcessingService: FileProcessingService,
    ) { }

    @Public()
    @Post('email')
    @ApiOperation({ summary: 'Send an email via queue' })
    async sendEmail(@Body() emailDto: SendEmailDto): Promise<{ jobId: string | null }> {
        this.logger.log(`Sending email to ${emailDto.to}`);

        const jobId = await this.emailService.sendEmail(
            emailDto.to,
            emailDto.subject,
            emailDto.template,
            emailDto.data,
        );

        return { jobId: jobId || null };
    }

    @Public()
    @Post('process-file')
    @ApiOperation({ summary: 'Process a file via queue' })
    async processFile(@Body() fileDto: ProcessFileDto): Promise<{ jobId: string | null }> {
        this.logger.log(`Processing file ${fileDto.fileId}`);

        const options = {
            resize: fileDto.resize,
            compress: fileDto.compress,
            convert: fileDto.convert,
        };

        const jobId = await this.fileProcessingService.processFile(
            fileDto.fileId,
            fileDto.userId,
            options,
        );

        return { jobId: jobId || null };
    }
}
