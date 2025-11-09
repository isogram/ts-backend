# Queue Dashboard UI

A web interface for monitoring and managing Bull queues is available at:

```plaintext
http://localhost:3000/api/admin/queues
```

## Features

- View all queues and their status
- See job details, data, and progress
- Retry, remove, or promote jobs
- View failed jobs and their error details
- Clean queues or pause/resume processing

## Authentication

In production environments, the queue dashboard is protected with basic authentication:

- Username: Set in `app.basicAuthUsername` config (defaults to "admin")
- Password: Set in `app.basicAuthPassword` config (defaults to "admin")

You can set these values in your `.env` file:

```plaintext
BASIC_AUTH_USERNAME=your_admin_username
BASIC_AUTH_PASSWORD=your_secure_password
```

## Technical Implementation

The queue dashboard uses:

- Bull Board: A modern UI for Bull queue monitoring
- Express adapter: Serves the UI through NestJS
- Basic auth: Secures the dashboard in production environments

## Adding New Queues

If you add new named queues to your application, you should also add them to the Bull Board dashboard by modifying the `QueueUIService`:

```typescript
// In queue-ui.module.ts
@Injectable()
class QueueUIService implements OnModuleInit {
  constructor(
    private configService: ConfigService,
    @InjectQueue('default') private defaultQueue: Queue,
    @InjectQueue('your-new-queue') private yourNewQueue: Queue,
  ) {}

  onModuleInit() {
    // ...
    createBullBoard({
      queues: [
        new BullAdapter(this.defaultQueue),
        new BullAdapter(this.yourNewQueue),
      ],
      serverAdapter,
    });
    // ...
  }
}
```
