import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TracedHttpService } from '@shared/services/traced-http.service';
import { TracingService } from '@shared/services/tracing.service';
import { LoggerModule } from '@shared/modules/logger/logger.module';

@Module({
    imports: [
        HttpModule.register({
            timeout: 5000,
            maxRedirects: 5,
        }),
        LoggerModule,
    ],
    providers: [TracedHttpService, TracingService],
    exports: [TracedHttpService, TracingService],
})
export class TracingModule { }