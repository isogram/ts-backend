import { registerAs } from '@nestjs/config';

export default registerAs('aws', () => ({
    s3: {
        region: process.env.AWS_REGION || 'us-east-1',
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
        bucketName: process.env.AWS_S3_BUCKET_NAME || 'ts-backend-uploads',
        endpoint: process.env.AWS_S3_ENDPOINT, // Set for MinIO, leave empty for AWS S3
    },
    sqs: {
        region: process.env.AWS_REGION || 'us-east-1',
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
        queueUrl: process.env.AWS_SQS_QUEUE_URL || '',
    },
}));
