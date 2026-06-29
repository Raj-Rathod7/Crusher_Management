# Development Guidelines & AI Agent Instructions

This document provides comprehensive guidelines for developing features in the Crusher Management System. Use these guidelines when implementing new screens, components, features, or maintaining the codebase.

---

## 1. Tech Stack Guidelines

### UI Components - shadcn/ui Only

All UI components must use **shadcn/ui** components. Do NOT use custom HTML elements or other UI libraries.

**Installation:**
```bash
npx shadcn-ui@latest add <component-name>
```

**Common Components:**
- `Button` - All interactive buttons
- `Card` - Content containers
- `Input` - Text input fields
- `Select` - Dropdown selections
- `Table` - Data tables
- `Dialog` - Modal dialogs
- `Tabs` - Tabbed content
- `Badge` - Status indicators
- `Alert` - Notification alerts
- `Form` - Form wrapper (use with React Form)
- `DatePicker` - Date input

**Styling Components:**
- `cn()` from `lib/utils.ts` for Tailwind class merging
- Always use Tailwind CSS classes for styling
- Use `class-variance-authority` for component variants

### Styling - Tailwind CSS v4

All styling uses **Tailwind CSS v4** with no CSS-in-JS:

```tsx
// ✅ Correct
<div className="flex gap-4 p-4 bg-white rounded-lg shadow">
  <Button className="w-full">Click me</Button>
</div>

// ❌ Incorrect
<div style={{ display: 'flex', gap: '16px' }}>
  <button style={{ width: '100%' }}>Click me</button>
</div>
```

**Responsive Design:**
```tsx
// Mobile-first approach
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Responsive columns */}
</div>
```

### State Management - React Query Only

All server state uses **TanStack React Query** (`@tanstack/react-query`):

```tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

// Fetching data
function CustomersList() {
  const { data: customers, isLoading, error } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const res = await fetch('/api/v1/customers', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      return res.json()
    }
  })

  return (
    <Table>
      {customers?.map(customer => (
        <TableRow key={customer.id}>
          <TableCell>{customer.name}</TableCell>
        </TableRow>
      ))}
    </Table>
  )
}

// Mutating data
function CreateCustomer() {
  const queryClient = useQueryClient()
  
  const mutation = useMutation({
    mutationFn: (data) => fetch('/api/v1/customers', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
    }
  })

  return <button onClick={() => mutation.mutate(customerData)}>Create</button>
}
```

**Query Key Conventions:**
- Single resource: `['customers']`, `['invoices']`
- Filtered: `['customers', { status: 'active' }]`
- Nested: `['customers', customerId, 'invoices']`

### Form Handling - React Form with Zod

All forms use **TanStack React Form** with **Zod** validation:

```tsx
import { useForm } from '@tanstack/react-form'
import { zodValidator } from '@tanstack/zod-form-adapter'
import { z } from 'zod'

const customerSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  phone: z.string().regex(/^\d{10}$/, 'Must be 10 digits'),
  address: z.string().optional(),
})

function CustomerForm() {
  const form = useForm({
    defaultValues: {
      name: '',
      phone: '',
      address: '',
    },
    onSubmit: async (values) => {
      await fetch('/api/v1/customers', {
        method: 'POST',
        body: JSON.stringify(values),
        headers: { 'Authorization': `Bearer ${token}` }
      })
    },
    validatorAdapter: zodValidator(),
  })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        e.stopPropagation()
        form.handleSubmit()
      }}
    >
      <form.Field
        name="name"
        children={(field) => (
          <>
            <Input
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
              placeholder="Customer name"
            />
            {field.state.meta.errors.length > 0 && (
              <p className="text-red-500 text-sm">
                {field.state.meta.errors[0]}
              </p>
            )}
          </>
        )}
      />
      <Button type="submit">Submit</Button>
    </form>
  )
}
```

### Data Tables - TanStack Table

All data tables use **TanStack Table** (React Table) with **shadcn/ui** Table component for rich features like sorting, filtering, pagination, and column visibility.

**Installation:**
```bash
npx shadcn-ui@latest add table
yarn add @tanstack/react-table
```

**Basic Table with TanStack Table:**
```tsx
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  ColumnDef,
} from '@tanstack/react-table'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

type Customer = {
  id: string
  name: string
  phone: string
  outstandingBalance: number
}

const columns: ColumnDef<Customer>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
  },
  {
    accessorKey: 'phone',
    header: 'Phone',
  },
  {
    accessorKey: 'outstandingBalance',
    header: 'Outstanding Balance',
    cell: (info) => formatCurrency(info.getValue() as number),
  },
]

function CustomersTable({ data }: { data: Customer[] }) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <Table>
      <TableHeader>
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <TableHead key={header.id}>
                {flexRender(
                  header.column.columnDef.header,
                  header.getContext()
                )}
              </TableHead>
            ))}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {table.getRowModel().rows.map((row) => (
          <TableRow key={row.id}>
            {row.getVisibleCells().map((cell) => (
              <TableCell key={cell.id}>
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
```

**Advanced Features with TanStack Table:**
```tsx
// Sorting
import { getSortedRowModel, SortingState } from '@tanstack/react-table'

const [sorting, setSorting] = useState<SortingState>([])

const table = useReactTable({
  data,
  columns,
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  state: {
    sorting,
  },
  onSortingChange: setSorting,
})

// Column headers become clickable for sorting
<TableHead
  onClick={() => header.column.toggleSorting()}
  className="cursor-pointer select-none"
>
  {/* Header content */}
</TableHead>

// Filtering
import { getFilteredRowModel, ColumnFiltersState } from '@tanstack/react-table'

const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

const table = useReactTable({
  data,
  columns,
  getCoreRowModel: getCoreRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  state: {
    columnFilters,
  },
  onColumnFiltersChange: setColumnFilters,
})

// Pagination
import { getPaginationRowModel } from '@tanstack/react-table'

const table = useReactTable({
  data,
  columns,
  getCoreRowModel: getCoreRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
})

// Navigation
<Button onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
  Previous
</Button>
<Button onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
  Next
</Button>
```

**Benefits:**
- **Type-safe**: Full TypeScript support for columns and data
- **Flexible**: Compose features as needed (sorting, filtering, pagination, selection)
- **Headless**: Works with any UI framework (we use shadcn/ui)
- **Performant**: Efficient rendering with React optimization patterns

### Routing - TanStack Router

All page routing uses **TanStack Router** with file-based routing:

**Route Structure:**
```
src/routes/
├── __root.tsx              # Root layout
├── index.tsx               # Dashboard (/)
├── truck-entries.tsx       # Truck entries (/truck-entries)
├── customers.tsx           # Customers (/customers)
├── customers/$customerId.tsx  # Customer detail (/customers/:id)
├── invoices.tsx            # Invoices (/invoices)
└── settings.tsx            # Settings (/settings)
```

**Creating Routes:**
```tsx
// src/routes/customers.tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/customers')({
  component: CustomersPage,
})

function CustomersPage() {
  return <div>Customers List</div>
}
```

**Navigation:**
```tsx
import { Link, useNavigate } from '@tanstack/react-router'

// Link component
<Link to="/customers/$customerId" params={{ customerId: '123' }}>
  View Customer
</Link>

// Programmatic navigation
const navigate = useNavigate()
await navigate({ to: '/customers' })
```

---

## 2. Component Architecture

### File Organization

```
src/
├── components/
│   ├── ui/              # shadcn/ui imported components
│   ├── layout/          # Layout components
│   │   └── Sidebar.tsx
│   ├── features/        # Feature-specific components
│   │   ├── customers/
│   │   │   ├── CustomerList.tsx
│   │   │   ├── CustomerForm.tsx
│   │   │   └── CustomerCard.tsx
│   │   └── invoices/
│   │       ├── InvoiceList.tsx
│   │       ├── InvoiceForm.tsx
│   │       └── PaymentForm.tsx
│   └── common/          # Reusable components
│       ├── Table.tsx
│       ├── DataTable.tsx
│       └── StatusBadge.tsx
```

### Component Naming

- PascalCase for component names: `CustomerList`, `InvoiceForm`
- Files match component names: `CustomerList.tsx`
- Hooks use camelCase: `useCustomers`, `useFetchInvoices`
- Utilities use camelCase: `formatCurrency`, `calculateDates`

### Reusable Component Checklist

Create reusable components when:

1. **Used in multiple places** - Appears in 2+ different routes/features
2. **Complex logic** - Encapsulates significant functionality
3. **Data table** - For any data listing (use TanStack Table + shadcn/ui Table wrapper)
4. **Form section** - Repeated form fields across multiple forms
5. **Card/layout pattern** - Consistent visual structure

**Example: Reusable DataTable Component**

```tsx
// src/components/common/DataTable.tsx
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  ColumnDef,
} from '@tanstack/react-table'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface DataTableProps<T> {
  data: T[]
  columns: ColumnDef<T>[]
  isLoading?: boolean
  onRowClick?: (row: T) => void
}

export function DataTable<T>({
  data,
  columns,
  isLoading,
  onRowClick,
}: DataTableProps<T>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <Table>
      <TableHeader>
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <TableHead key={header.id}>
                {flexRender(
                  header.column.columnDef.header,
                  header.getContext()
                )}
              </TableHead>
            ))}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {table.getRowModel().rows.map((row) => (
          <TableRow
            key={row.id}
            onClick={() => onRowClick?.(row.original)}
            className="cursor-pointer hover:bg-gray-50"
          >
            {row.getVisibleCells().map((cell) => (
              <TableCell key={cell.id}>
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

// Usage with TanStack Table
const columns: ColumnDef<Customer>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
  },
  {
    accessorKey: 'phone',
    header: 'Phone',
  },
  {
    accessorKey: 'outstandingBalance',
    header: 'Outstanding Balance',
    cell: (info) => formatCurrency(info.getValue() as number),
  },
]

function CustomersPage() {
  const { data: customers } = useQuery({
    queryKey: ['customers'],
    queryFn: () => fetch('/api/v1/customers').then(r => r.json()),
  })

  return (
    <DataTable
      data={customers || []}
      columns={columns}
      onRowClick={(customer) => navigate({ to: `/customers/${customer.id}` })}
    />
  )
}
```

---

## 3. Feature Implementation Workflow

### Step 1: Plan the Feature

1. Identify all screens/routes needed
2. Sketch the UI layout
3. List API endpoints to be consumed
4. Identify reusable components
5. Plan data flow and state management

### Step 2: Create Routes

```tsx
// src/routes/new-feature.tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/new-feature')({
  component: FeaturePage,
})

function FeaturePage() {
  return <div>Feature content</div>
}
```

### Step 3: Build Reusable Components

```tsx
// src/components/features/newFeature/ComponentName.tsx
interface ComponentProps {
  // Props with clear types
  data: Array<{ id: string; name: string }>
  onSelect?: (item: any) => void
  isLoading?: boolean
}

export function ComponentName({
  data,
  onSelect,
  isLoading,
}: ComponentProps) {
  return (
    <div className="space-y-4">
      {data.map((item) => (
        <Card key={item.id} onClick={() => onSelect?.(item)}>
          {item.name}
        </Card>
      ))}
    </div>
  )
}
```

### Step 4: Implement Data Fetching

```tsx
// In your page/route component
function FeaturePage() {
  // Fetch data
  const { data, isLoading, error } = useQuery({
    queryKey: ['features'],
    queryFn: () => fetch('/api/v1/features').then(r => r.json()),
  })

  if (isLoading) return <div>Loading...</div>
  if (error) return <Alert variant="destructive">Error loading data</Alert>

  return <ComponentName data={data} />
}
```

### Step 5: Add Forms & Mutations

```tsx
function CreateFeatureForm() {
  const queryClient = useQueryClient()
  
  const form = useForm({
    defaultValues: { name: '' },
    onSubmit: async (values) => {
      const res = await fetch('/api/v1/features', {
        method: 'POST',
        body: JSON.stringify(values),
      })
      return res.json()
    },
  })

  const mutation = useMutation({
    mutationFn: form.handleSubmit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['features'] })
    },
  })

  return (
    <form onSubmit={form.handleSubmit}>
      {/* Form fields */}
      <Button type="submit" disabled={mutation.isPending}>
        Create
      </Button>
    </form>
  )
}
```

---

## 4. Best Practices

### TypeScript Usage

- Always use TypeScript types
- Export types from components for reusability
- Use `interface` for component props, `type` for data structures

```tsx
interface CustomerCardProps {
  customer: Customer
  onSelect: (id: string) => void
}

type Customer = {
  id: string
  name: string
  phone: string
  balance: number
}
```

### Error Handling

```tsx
// Query errors
const { data, error } = useQuery({
  queryKey: ['items'],
  queryFn: async () => {
    const res = await fetch('/api/v1/items')
    if (!res.ok) throw new Error('Failed to fetch')
    return res.json()
  },
})

if (error) {
  return (
    <Alert variant="destructive">
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>{error.message}</AlertDescription>
    </Alert>
  )
}

// Mutation errors
const mutation = useMutation({
  mutationFn: (data) => api.create(data),
  onError: (error) => {
    toast({
      title: 'Error',
      description: error.message,
      variant: 'destructive',
    })
  },
})
```

### Loading States

```tsx
// Query loading
if (isLoading) {
  return (
    <div className="flex items-center justify-center p-8">
      <Spinner /> Loading...
    </div>
  )
}

// Mutation loading
<Button disabled={mutation.isPending}>
  {mutation.isPending ? 'Creating...' : 'Create'}
</Button>
```

### Accessibility

- All interactive elements must be keyboard accessible
- Use proper semantic HTML
- Include `aria-labels` where needed
- Test with screen readers
- Use shadcn/ui for built-in a11y

```tsx
<Button aria-label="Create new customer">
  <Plus className="w-4 h-4" />
</Button>

<Input
  type="text"
  placeholder="Search customers"
  aria-label="Search customers by name or phone"
/>
```

### Code Formatting

- Max line length: 100 characters
- Use 2-space indentation
- Consistent naming conventions
- Add JSDoc comments for complex functions

```tsx
/**
 * Fetches customer data with optional filters
 * @param filters - Search filters (name, phone, status)
 * @returns Promise resolving to customer array
 */
async function fetchCustomers(filters?: {
  name?: string
  phone?: string
  status?: 'active' | 'inactive'
}) {
  const params = new URLSearchParams()
  if (filters?.name) params.append('name', filters.name)
  if (filters?.phone) params.append('phone', filters.phone)
  
  const res = await fetch(`/api/v1/customers?${params}`)
  return res.json()
}
```

---

## 5. Common Patterns

### Authentication & API Calls

```tsx
// Utility for API calls with JWT
async function apiCall(
  endpoint: string,
  options?: RequestInit
): Promise<any> {
  const token = localStorage.getItem('authToken')
  
  const res = await fetch(`/api/v1${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options?.headers,
    },
  })

  if (res.status === 401) {
    // Handle logout
    localStorage.removeItem('authToken')
    window.location.href = '/login'
  }

  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || 'API request failed')
  }

  return res.json()
}

// Usage
const { data } = useQuery({
  queryKey: ['customers'],
  queryFn: () => apiCall('/customers'),
})
```

### Status Badge Component

```tsx
function StatusBadge({ status }: { status: 'pending' | 'paid' | 'partial' }) {
  const variants = {
    pending: 'bg-red-500 text-white',
    paid: 'bg-green-500 text-white',
    partial: 'bg-yellow-500 text-white',
  }

  return (
    <Badge className={variants[status]}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  )
}
```

### Date & Currency Formatting

```tsx
// Utility functions
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(amount)
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date))
}

// Usage
<TableCell>{formatCurrency(invoice.totalAmount)}</TableCell>
<TableCell>{formatDate(invoice.createdAt)}</TableCell>
```

---

## 7. Performance Optimization

### Memoization

```tsx
import { memo } from 'react'

// Memoize expensive components
export const CustomerCard = memo(function CustomerCard({
  customer,
  onSelect,
}: CustomerCardProps) {
  return (
    <Card onClick={() => onSelect(customer.id)}>
      {customer.name}
    </Card>
  )
})
```

### Query Optimization

```tsx
// Use staleTime to reduce refetches
const { data } = useQuery({
  queryKey: ['customers'],
  queryFn: () => apiCall('/customers'),
  staleTime: 5 * 60 * 1000, // 5 minutes
})

// Use select to transform data
const { data: activeCustomers } = useQuery({
  queryKey: ['customers'],
  queryFn: () => apiCall('/customers'),
  select: (data) => data.filter(c => c.status === 'active'),
})
```

---

## 8. Dependencies

### Package Installation

Always use `yarn` for package management:

```bash
# Add new package
yarn add package-name

# Add dev dependency
yarn add -D dev-package

# Update packages
yarn upgrade

# Install from lock file
yarn install
```

### Approved Packages

Only use packages from `package.json`. Additional packages must be approved first.

**Current approved packages:**
- `@tanstack/*` - React Query, Router, Form, Table, Start
- `shadcn/ui` - UI components
- `tailwindcss` - Styling
- `zod` - Validation
- `lucide-react` + `@tabler/icons-react` - Icons
- `clsx` - Class name utilities
- `radix-ui` - Headless UI primitives
- React & React DOM

---

## 9. Code Review Checklist

Before submitting a PR, ensure:

- [ ] All components use shadcn/ui
- [ ] Styling only uses Tailwind CSS
- [ ] Forms use React Form + Zod
- [ ] Data fetching uses React Query
- [ ] Data tables use TanStack Table with shadcn/ui
- [ ] All TypeScript types are defined
- [ ] Components are reusable where appropriate
- [ ] Error handling is implemented
- [ ] Loading states are handled
- [ ] Mobile responsive design
- [ ] Accessibility considerations (keyboard, screen readers)
- [ ] No console errors or warnings
- [ ] Tests pass (`yarn test`)
- [ ] Build succeeds (`yarn build`)
- [ ] Code follows style guide

---

## 10. Deployment

### Building for Production

```bash
# Create optimized build
yarn build

# Output in dist/ directory
```

### Environment Variables

Store API endpoints and configuration in environment files:

```
.env.development
.env.production
```

Access in code:
```tsx
const apiBase = import.meta.env.VITE_API_URL || '/api/v1'
```

---

## Quick Reference

| Task | Command/Pattern |
|------|-----------------|
| Add new route | Create file in `src/routes/` |
| Add UI component | `npx shadcn-ui@latest add <name>` |
| Add package | `yarn add package-name` |
| Run dev server | `yarn dev` |

---

## Support

For questions about development practices, refer to this document or check existing code patterns in the repository.
