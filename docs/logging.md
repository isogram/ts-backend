# Logging Configuration

The application uses a centralized logging system based on Winston logger, integrated with NestJS.

## Log Levels

The log levels are configured in the environment variables. The available log levels (from most to least verbose):

1. `error`: Only error messages
2. `warn`: Warnings and errors
3. `info`: General information, warnings and errors (default)
4. `http`: HTTP request information, plus info, warnings and errors
5. `verbose`: Verbose output, plus all the above
6. `debug`: Debug information, plus all the above
7. `silly`: Excessive detail, plus all the above

## Configuration

Set the log level in your environment variables:

```bash
LOG_LEVEL=info
```

You can add this to your `.env` file:

```plaintext
LOG_LEVEL=info
```

## Log Files

Logs are stored in the `logs` directory:

- `logs/combined.log`: All logs based on the configured log level
- `logs/error.log`: Only error logs

## Using the Logger in Code

```typescript
// Import the logger service
import { LoggerService } from '@shared/modules/logger/logger.service';

@Injectable()
export class YourService {
  constructor(private logger: LoggerService) {}
  
  someMethod() {
    // Available log methods
    this.logger.log('Information message', 'YourContext');
    this.logger.error('Error message', 'Error trace', 'YourContext');
    this.logger.warn('Warning message', 'YourContext');
    this.logger.debug('Debug message', 'YourContext');
    this.logger.verbose('Verbose message', 'YourContext');
  }
}
```

## Dynamic Log Level

You can change the log level at runtime using the logger service:

```typescript
this.logger.setLogLevel('debug'); // Temporarily increase verbosity
```
