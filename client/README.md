# Crusher Management System (CMS)

A modern, responsive web application for managing crusher operations, including truck entries, customer management, invoicing, worker payroll, and financial reporting.

## Project Overview

The Crusher Management System is designed as a desktop-optimized, responsive web application for on-site operations across desktops, laptops, and iPads. It provides complete management of:

- **Truck Entries**: Log incoming materials with quantities, suppliers, and remarks
- **Customer Management**: Maintain detailed customer profiles with sales history and outstanding balances
- **Invoicing**: Create, track, and manage sales invoices with payment records
- **Worker Management**: Track worker information and process payouts
- **Expense Management**: Log and categorize business expenses
- **Financial Reports**: Generate comprehensive reports for trucks, sales, payments, expenses, and worker activities
- **System Administration**: Manage users, materials, expense categories, and business profile settings

---

## Tech Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Frontend Framework** | React 19 + TypeScript | Core UI and state management |
| **Routing** | TanStack Router v1 | File-based routing with type-safe navigation |
| **UI Components** | shadcn/ui + Tailwind CSS | Accessible, reusable component library |
| **State Management** | TanStack React Query | Server state management and caching |
| **Form Handling** | TanStack React Form | Type-safe form validation and submission |
| **Styling** | Tailwind CSS v4 | Utility-first CSS framework |
| **Icons** | Lucide React + Tabler Icons | Consistent icon system |
| **Validation** | Zod | Runtime schema validation |
| **Package Manager** | yarn | Fast and reliable package management |
| **Build Tool** | Vite | Lightning-fast development and production builds |

---

## Project Structure

```
crusher-management/
├── src/
│   ├── routes/                  # File-based routing (TanStack Router)
│   │   ├── __root.tsx          # Root layout
│   │   └── index.tsx           # Home/Dashboard page
│   ├── components/
│   │   └── ui/                 # shadcn/ui components
│   │       └── button.tsx      # Button component
│   ├── integrations/           # Third-party integrations
│   │   └── tanstack-query/
│   │       ├── devtools.tsx    # React Query devtools
│   │       └── root-provider.tsx  # Query client provider
│   ├── lib/
│   │   └── utils.ts            # Utility functions
│   ├── router.tsx              # Router configuration
│   ├── routeTree.gen.ts        # Auto-generated route tree
│   └── styles.css              # Global styles
├── public/                      # Static assets
├── docs/                        # Project documentation
├── vite.config.ts              # Vite configuration
├── tailwind.config.js          # Tailwind CSS configuration
├── tsconfig.json               # TypeScript configuration
├── components.json             # shadcn/ui configuration
└── package.json                # Dependencies and scripts
```

---

## Getting Started

### Prerequisites

- Node.js 18+ and yarn
- Git

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd crusher-management

# Install dependencies
yarn install

# Generate route types
yarn generate-routes
```

### Development

```bash
# Start development server on localhost:3000
yarn dev

# Watch mode with hot reload enabled
# Browser will auto-refresh on file changes
```

### Building

```bash
# Create production build
yarn build

# Preview production build
yarn preview
```

### Testing

```bash
# Run tests with Vitest
yarn test
```

---

## Core Features & Navigation

### Main Navigation Menu

**Sidebar Navigation Structure:**

```
Dashboard
├── 🏠 Dashboard               (Main overview)
├── 🚛 Truck Entries           (Log incoming materials)
├── 👥 Customers               (Customer management)
├── 📄 Invoices                (Sales invoicing)
├── 💰 Expenses                (Expense tracking)
├── 👷 Workers                 (Worker management & payroll)
├── 📊 Reports Hub             (Analytics & reporting)
│   ├── Truck Report
│   ├── Sales Report
│   ├── Payment Report
│   ├── Expense Report
│   └── Worker Report
└── ⚙️ System Settings         (Admin only)
    ├── Business Profile
    ├── Material Types
    ├── Expense Categories
    └── Users
```

### Key Screens

#### Dashboard
- Summary cards: Today's Trucks, Brass Quantity, Sales, Expenses
- Recent truck entries, invoices, payments, and expenses
- Quick action buttons

#### Truck Entries
- List view with filters (date range, material type, truck number)
- Add/Edit forms for new entries
- Track supplier information and remarks

#### Customers
- Customer directory with search and filtering
- Individual customer ledgers showing:
  - Overview (sales, payments, outstanding)
  - Invoice history
  - Payment timeline

#### Invoices
- Create sales invoices with customer selection
- Single-item constraint per invoice (V1 design)
- Material quantity and rate calculation
- Payment recording and invoice status tracking

#### Workers
- Worker directory with daily wage information
- Worker detail view with payout history
- Quick payout form for wage payments

#### System Settings (Admin Only)
- Business profile management
- Material types management
- Expense category management
- User account management

---

## API Integration

All API calls use JWT Bearer token authentication (except login). The API base URL is `/api/v1`.

**Response Format:**
```json
{
  "success": true,
  "data": {},
  "error": null,
  "meta": { "page": 1, "per_page": 20, "total": 100 }
}
```

### Key Endpoints

**Authentication:**
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout
- `POST /auth/change-password` - Password change

**Users & Setup:**
- `GET/POST /users` - Manage users (admin only)
- `GET/POST /materials` - Manage material types
- `GET/POST /expenses/categories` - Manage expense categories

**Operations:**
- `GET/POST /truck-entries` - Truck entry management
- `GET/POST /customers` - Customer management
- `GET/POST /invoices` - Invoice management
- `POST /payments` - Record invoice payments
- `GET/POST /workers` - Worker management
- `POST /worker-payments` - Record worker payouts
- `GET /dashboard` - Dashboard statistics

---

## Component Architecture

### UI Components (shadcn/ui)

All UI components are built from shadcn/ui with Tailwind CSS styling. Components are:
- **Accessible**: Full WCAG compliance
- **Reusable**: Exported as independent modules
- **Customizable**: Tailwind classes for styling
- **Responsive**: Mobile-first design approach

### Creating New Components

1. **Add shadcn component:**
   ```bash
   npx shadcn-ui@latest add <component-name>
   ```

2. **Create custom component wrapper** in `src/components/` if needed for domain-specific logic

3. **Use in routes** with proper TypeScript typing

### Best Practices

- Keep components small and focused
- Extract reusable logic into custom hooks
- Use React Query for server state
- Use React Form for form management
- Leverage TypeScript for type safety
- Write responsive designs mobile-first

---

## State Management

### React Query (TanStack Query)

Handles all server state with automatic caching, synchronization, and invalidation:

```typescript
// Fetch data
const { data, isLoading, error } = useQuery({
  queryKey: ['customers'],
  queryFn: () => api.getCustomers(),
})

// Mutate data
const mutation = useMutation({
  mutationFn: (data) => api.createCustomer(data),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['customers'] })
})
```

### React Form (TanStack Form)

Type-safe form handling with validation:

```typescript
const form = useForm({
  onSubmit: async (values) => {
    // Submit logic
  },
})

form.Field(
  name="customerName"
  validators={{
    onChange: z.string().min(3)
  }}
  children={(field) => (
    <input
      value={field.state.value}
      onChange={(e) => field.handleChange(e.target.value)}
    />
  )}
)
```

---

## Styling

### Tailwind CSS

All styling uses Tailwind CSS utility classes. Custom styles in `src/styles.css`:

```css
@import "tailwindcss";
```

### Badge Colors (Status Indicators)

- **Pending**: Red (`bg-red-500`)
- **Partial**: Yellow (`bg-yellow-500`)
- **Paid**: Green (`bg-green-500`)
- **Active**: Green (`bg-green-500`)
- **Inactive**: Gray (`bg-gray-500`)

---

## Responsive Design

### Viewport Targets

- **Minimum**: 768px (iPad Portrait)
- **Tablet**: 768px - 1024px
- **Desktop**: 1024px+

### Layout Requirements

- Collapsible sidebar for screens < 768px
- Touch-friendly buttons and form inputs
- Readable font sizes on all devices
- Proper spacing and padding

---

## Authentication & Authorization

### Role-Based Access Control

- **Admin**: Full system access, user management, system settings
- **Manager**: Truck entries, customer management, invoicing, expense tracking
- **Operator**: View-only access to assigned sections

### JWT Token Handling

- Tokens stored in localStorage
- Automatically included in all API requests
- Token refresh on 401 responses
- Clear on logout

---

## Future Phases

### Phase 2: Stock Management & Suppliers
- Stock ledger tracking
- Supplier account management
- Inventory reconciliation

### Phase 3: GST Tax Compliance
- Tax invoice generation
- GST calculations and reporting
- Compliance audit trails

---

## Development Guidelines

See [agents.md](./agents.md) for detailed development workflows and best practices.

---

## Support & Contribution

For issues, feature requests, or contributions, please refer to the development guidelines in agents.md.

---

## License

Proprietary - All rights reserved

TanStack will automatically generate the content of the route file for you.

Now that you have two routes you can use a `Link` component to navigate between them.

### Adding Links

To use SPA (Single Page Application) navigation you will need to import the `Link` component from `@tanstack/react-router`.

```tsx
import { Link } from "@tanstack/react-router";
```

Then anywhere in your JSX you can use it like so:

```tsx
<Link to="/about">About</Link>
```

This will create a link that will navigate to the `/about` route.

More information on the `Link` component can be found in the [Link documentation](https://tanstack.com/router/v1/docs/framework/react/api/router/linkComponent).

### Using A Layout

In the File Based Routing setup the layout is located in `src/routes/__root.tsx`. Anything you add to the root route will appear in all the routes. The route content will appear in the JSX where you render `{children}` in the component.

Here is an example layout that includes a header:

```tsx
import { createRootRoute } from '@tanstack/react-router'
import { Link } from '@tanstack/react-router'

export const Route = createRootRoute({
  component: ({ children }) => (
    <>
      <header>
        <nav>
          <Link to="/">Home</Link>
          <Link to="/about">About</Link>
        </nav>
      </header>
      {children}
    </>
  ),
})
```

More information on layouts can be found in the [Layouts documentation](https://tanstack.com/router/latest/docs/framework/react/guide/routing-concepts#layouts).

## Data Fetching

All data fetching uses **TanStack React Query** for server state management. This provides automatic caching, synchronization, refetching, and invalidation of server state.

For detailed implementation patterns, see the State Management section above.

---

## License

Proprietary - All rights reserved
