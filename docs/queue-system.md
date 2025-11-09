# Queue System Documentation

This application uses a flexible queue system that supports both Bull (Redis-based) and Amazon SQS as queue providers. By default, it uses Bull for local development, but can easily be switched to SQS for production.

## Queue Provider Configuration

Set your queue provider in the environment variables:

```plaintext
# .env file
QUEUE_DRIVER=bull  # Options: 'bull' or 'sqs'

# Redis configuration (for Bull)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# AWS SQS configuration (if using 'sqs')
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_SQS_QUEUE_URL=your_queue_url
```

## Architecture

The queue system consists of:

1. **QueueService**: Central service for adding jobs to queues
2. **Job Processors**: Bull processors that handle specific job types
3. **Lambda Handler**: For AWS SQS integration in serverless environments

## Queue Message Types

Currently supported job types:

| Job Name | Description | Data Fields |
|----------|-------------|------------|
| `email:send` | Sends an email | `to`, `subject`, `template`, `data` |
| `email:verify` | Sends a verification email | `userId`, `email`, `verificationLink` |
| `file:process` | Processes file operations | `fileId`, `userId`, `operations` |

## Using the Queue in Your Services

### 1. Inject the QueueService

```typescript
import { Injectable } from '@nestjs/common';
import { QueueService } from '@shared/services/queue.service';

@Injectable()
export class YourService {
  constructor(private queueService: QueueService) {}
  
  // Your methods here
}
```

### 2. Add a Job to the Queue

```typescript
async someMethod() {
  // Add a job to the queue
  const jobId = await this.queueService.add({
    name: 'email:send',  // Job type
    payload: {           // Job data
      to: 'user@example.com',
      subject: 'Welcome!',
      template: 'welcome',
      data: { username: 'User' }
    },
    delaySeconds: 30,    // Optional: delay execution
  });
  
  return jobId;  // Can be used to track the job
}
```

## Adding New Job Types

### 1. Create a Processor Method

Add a new process method in the appropriate processor:

```typescript
@Process('your:job:name')
async handleYourJob(job: Job): Promise<void> {
  // Process the job
  const { someData } = job.data;
  
  // Implement job logic here
}
```

### 2. Create a Service Method

Create a method in your service to add the job to the queue:

```typescript
async performYourJob(someData: string): Promise<string | undefined> {
  return this.queueService.add({
    name: 'your:job:name',
    payload: {
      someData
    }
  });
}
```

## Testing and Monitoring

### Testing Locally

You can test queued jobs using the demo controller:

POST `/queue-demo/email`

```json
{
  "to": "test@example.com",
  "subject": "Test Email",
  "template": "test",
  "data": {
    "name": "Test User"
  }
}
```

POST `/queue-demo/process-file`

```json
{
  "fileId": "file123",
  "userId": "user456",
  "resize": {
    "width": 800,
    "height": 600
  }
}
```

### Monitoring

For local development, you can use Bull UI packages like `bull-board` or `bull-arena` to monitor job execution.

## Best Practices

1. Keep job payloads small and avoid circular references
2. Always handle errors in job processors
3. Consider using Bull's retry mechanisms for transient failures
4. Use job progress tracking for long-running tasks
