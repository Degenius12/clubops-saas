# TypeScript Coding Standards

## Type Safety

### NO `any` Types
```typescript
// ❌ Bad
function process(data: any) { ... }

// ✅ Good
function process(data: UserData) { ... }
// or if truly unknown:
function process(data: unknown) { ... }
```

### Explicit Return Types
```typescript
// ❌ Bad
function calculate(x, y) {
  return x + y;
}

// ✅ Good
function calculate(x: number, y: number): number {
  return x + y;
}
```

### Interface Over Type (for objects)
```typescript
// ✅ Preferred for object shapes
interface User {
  id: string;
  name: string;
  email: string;
}

// Use type for unions, intersections, mapped types
type Status = 'active' | 'inactive' | 'pending';
```

## Error Handling

### Always Handle Errors
```typescript
// ❌ Bad
const data = await fetchData();

// ✅ Good
try {
  const data = await fetchData();
} catch (error) {
  console.error('Failed to fetch data:', error);
  // Handle gracefully
}
```

### Type-Safe Error Handling
```typescript
function isError(error: unknown): error is Error {
  return error instanceof Error;
}

try {
  await riskyOperation();
} catch (error) {
  if (isError(error)) {
    console.error(error.message);
  } else {
    console.error('Unknown error:', error);
  }
}
```

## React Components

### Function Components with Props Interface
```typescript
interface ButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
}

export function Button({ 
  label, 
  onClick, 
  disabled = false,
  variant = 'primary' 
}: ButtonProps): JSX.Element {
  return (
    <button 
      onClick={onClick} 
      disabled={disabled}
      className={`btn btn-${variant}`}
    >
      {label}
    </button>
  );
}
```

### Event Handlers
```typescript
// ❌ Bad
const handleClick = (e) => { ... }

// ✅ Good
const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => { ... }
const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => { ... }
const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => { ... }
```

## API Routes (Next.js)

### Standard Pattern
```typescript
import { NextRequest, NextResponse } from 'next/server';

interface RequestBody {
  name: string;
  email: string;
}

interface ResponseData {
  success: boolean;
  data?: User;
  error?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<ResponseData>> {
  try {
    const body: RequestBody = await request.json();
    
    // Validate
    if (!body.name || !body.email) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Process
    const user = await createUser(body);
    
    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

## Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Variables | camelCase | `userName`, `isLoading` |
| Functions | camelCase | `getUserData`, `handleSubmit` |
| Components | PascalCase | `UserProfile`, `DashboardCard` |
| Interfaces | PascalCase | `UserData`, `ApiResponse` |
| Types | PascalCase | `ButtonVariant`, `StatusType` |
| Constants | UPPER_SNAKE | `MAX_RETRIES`, `API_URL` |
| Files (components) | PascalCase | `UserCard.tsx` |
| Files (utilities) | camelCase | `formatDate.ts` |

## Imports

### Order
1. React/Next.js imports
2. Third-party libraries
3. Local components
4. Local utilities
5. Types
6. Styles

```typescript
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { format } from 'date-fns';
import { z } from 'zod';

import { Button } from '@/components/ui/Button';
import { UserCard } from '@/components/UserCard';

import { formatCurrency } from '@/lib/format';
import { api } from '@/lib/api';

import type { User, ApiResponse } from '@/types';

import styles from './Page.module.css';
```

## Comments

### When to Comment
- Complex business logic
- Non-obvious workarounds
- TODO items with context

```typescript
// Calculate pro-rated fee based on Tennessee regulations
// which require specific rounding rules for partial months
function calculateProRatedFee(daysAttended: number, totalDays: number): number {
  // ...
}

// TODO(2024-03): Remove after migration complete
// Temporary compatibility layer for legacy data format
```

## Performance

### Memoization
```typescript
// Expensive calculations
const expensiveResult = useMemo(() => {
  return calculateComplexValue(data);
}, [data]);

// Callback stability
const handleClick = useCallback(() => {
  doSomething(id);
}, [id]);

// Component memoization (use sparingly)
export const ExpensiveComponent = memo(function ExpensiveComponent({ data }: Props) {
  // ...
});
```

## Validation

### Use Zod for Runtime Validation
```typescript
import { z } from 'zod';

const UserSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  age: z.number().min(0).optional(),
});

type User = z.infer<typeof UserSchema>;

function validateUser(data: unknown): User {
  return UserSchema.parse(data);
}
```
