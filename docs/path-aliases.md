# Path Aliases

This project uses TypeScript path aliases to simplify imports. Instead of using relative paths with multiple `../` segments, you can use these predefined aliases:

```typescript
// Before
import { UserRole } from '../../users/entities/user.entity';
import { StorageService } from '../../../shared/services/storage.service';

// After
import { UserRole } from '@modules/users/entities/user.entity';
import { StorageService } from '@shared/services/storage.service';
```

Available aliases:

| Alias        | Path           | Description                         |
|--------------|----------------|-------------------------------------|
| `@modules/*` | `src/modules/*`| Feature modules (auth, users, etc.) |
| `@config/*`  | `src/config/*` | Configuration files                 |
| `@shared/*`  | `src/shared/*` | Shared utilities, guards, etc.      |
| `@utils/*`   | `src/utils/*`  | Utility functions                   |
| `@database/*`| `src/database/*`| Database-related files             |

When importing from the same module, you can still use relative imports:

```typescript
// From src/modules/users/controllers/admin-users.controller.ts
import { UsersService } from '../users.service';          // Same module
import { UserRole } from '../entities/user.entity';       // Same module
import { AuthService } from '@modules/auth/auth.service'; // Different module
```
