import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowUpRight,
  Boxes,
  CircleDollarSign,
  Factory,
  RefreshCw,
  Users,
} from "lucide-react";
import { ConfigurableDataTable } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AnimatedPage,
  AnimatedProgressFill,
} from "@/components/ui/app-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { apiClient } from "@/lib/common/api";

export const Route = createFileRoute("/_app/")({
  component: RouteComponent,
});

function RouteComponent() {
  const dashboard = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => apiClient.get<DashboardData>("/dashboard"),
    staleTime: 30_000,
  });

  if (dashboard.isLoading) {
    return <DashboardSkeleton />;
  }

  if (dashboard.isError) {
    return (
      <main className="flex flex-1 items-center justify-center p-6">
        <Card className="w-full max-w-md border-destructive/30">
          <CardHeader>
            <CardTitle>Dashboard unavailable</CardTitle>
            <CardDescription>
              We could not load the current operating figures.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => dashboard.refetch()}>
              <RefreshCw />
              Try again
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  const data = dashboard.data;
  if (!data) return null;

  const currency = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  });
  const collectionRate =
    data.invoiceTotal > 0
      ? Math.min(100, (data.amountCollected / data.invoiceTotal) * 100)
      : 0;
  const maxBar = Math.max(
    data.invoiceTotal,
    data.expenseTotal,
    data.amountCollected,
    1,
  );

  function getStatusClass(status: string) {
    const normalizedStatus = status.toUpperCase();
    if (normalizedStatus === "PAID") {
      return "bg-green-500/20 border-green-700 text-green-700" as const;
    }

    if (normalizedStatus === "PARTIAL") {
      return "bg-yellow-500/20 border-yellow-700 text-yellow-700" as const;
    }

    return "bg-orange-500/20 border-orange-700 text-orange-700" as const;
  }

  return (
    <AnimatedPage className="min-h-full bg-background p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="flex flex-col justify-between gap-5 border-b border-border/70 pb-6 sm:flex-row sm:items-end">
          <div>
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-amber-600">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              Operations desk
            </div>
            <h1 className="font-heading text-3xl font-semibold tracking-tight md:text-4xl">
              Good morning. Here is the yard.
            </h1>
            <p className="mt-2 text-muted-foreground">
              A live view of sales, collections, and movement across the
              crusher.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => dashboard.refetch()}
            disabled={dashboard.isFetching}
          >
            <RefreshCw className={dashboard.isFetching ? "animate-spin" : ""} />
            Refresh figures
          </Button>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Outstanding balance"
            value={currency.format(data.outstandingBalance)}
            detail="Needs collection"
            icon={<CircleDollarSign />}
            accent="amber"
          />
          <MetricCard
            label="Collected"
            value={currency.format(data.amountCollected)}
            detail={`${collectionRate.toFixed(0)}% of invoiced value`}
            icon={<ArrowUpRight />}
            accent="emerald"
          />
          <MetricCard
            label="Active customers"
            value={data.activeCustomers.toLocaleString("en-IN")}
            detail="Current customer book"
            icon={<Users />}
            accent="sky"
          />
          <MetricCard
            label="Truck entries"
            value={data.truckEntries.toLocaleString("en-IN")}
            detail="Recorded inbound loads"
            icon={<Factory />}
            accent="slate"
          />
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <Card>
            <CardHeader className="border-b">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardDescription>Financial position</CardDescription>
                  <CardTitle className="mt-1 text-2xl">
                    Where the money stands
                  </CardTitle>
                </div>
                <Boxes className="size-6 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <PositionBar
                label="Invoiced"
                value={data.invoiceTotal}
                max={maxBar}
                color="bg-amber-500"
                currency={currency}
              />
              <PositionBar
                label="Collected"
                value={data.amountCollected}
                max={maxBar}
                color="bg-emerald-500"
                currency={currency}
              />
              <PositionBar
                label="Expenses"
                value={data.expenseTotal}
                max={maxBar}
                color="bg-slate-500"
                currency={currency}
              />
              <div className="grid grid-cols-2 gap-4 border-t pt-5">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">
                    Net after expenses
                  </p>
                  <p className="mt-1 text-xl font-semibold tabular-nums">
                    {currency.format(data.amountCollected - data.expenseTotal)}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">
                    To collect
                  </p>
                  <p className="mt-1 text-xl font-semibold tabular-nums text-amber-700 dark:text-amber-400">
                    {currency.format(data.outstandingBalance)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardDescription>Collection pulse</CardDescription>
              <CardTitle className="mt-1 text-2xl">
                {collectionRate.toFixed(0)}% collected
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 pt-4">
                <div className="flex items-end justify-between gap-4">
                  <span className="text-3xl font-semibold tabular-nums">
                    {currency.format(data.amountCollected)}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    of {currency.format(data.invoiceTotal)}
                  </span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-muted">
                  <AnimatedProgressFill
                    progress={collectionRate}
                    className="h-full rounded-full bg-primary transition-all"
                  />
                </div>
              </div>
              <p className="mt-5 text-center text-sm text-muted-foreground">
                {data.outstandingBalance > 0
                  ? `${currency.format(data.outstandingBalance)} remains across active invoices.`
                  : "All active invoices are collected."}
              </p>
            </CardContent>
          </Card>
        </section>

        <Card>
          <CardHeader className="border-b">
            <div>
              <CardDescription>Latest activity</CardDescription>
              <CardTitle className="mt-1 text-2xl">Recent invoices</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-1">
            <ConfigurableDataTable
              data={data.recentInvoices}
              columns={[
                { accessorKey: "invoiceNumber", header: "Invoice" },
                {
                  accessorKey: "customerName",
                  header: "Customer",
                  cell: ({ row }) => row.original.customerName ?? "Unassigned",
                },
                {
                  accessorKey: "invoiceDate",
                  header: "Date",
                  cell: ({ row }) =>
                    new Date(
                      `${row.original.invoiceDate}T00:00:00`,
                    ).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    }),
                },
                {
                  accessorKey: "status",
                  header: "Status",
                  cell: ({ row }) => (
                    <Badge
                      className={`${getStatusClass(row.original.status)} capitalize border p-3`}
                      variant={
                        row.original.status === "paid" ? "default" : "secondary"
                      }
                    >
                      {row.original.status}
                    </Badge>
                  ),
                },
                {
                  accessorKey: "balance",
                  header: "Balance",
                  cell: ({ row }) => (
                    <span className="font-medium tabular-nums">
                      {currency.format(row.original.balance)}
                    </span>
                  ),
                },
              ]}
              getRowId={(row) => row.id.toString()}
              enableColumnVisibility={false}
              enablePagination={false}
              enableSorting={false}
              enableGlobalSearch={true}
              emptyMessage="No invoices have been recorded yet."
            />
          </CardContent>
        </Card>
      </div>
    </AnimatedPage>
  );
}

type DashboardData = {
  invoiceTotal: number;
  amountCollected: number;
  outstandingBalance: number;
  expenseTotal: number;
  activeCustomers: number;
  truckEntries: number;
  recentInvoices: Array<{
    id: number;
    invoiceNumber: string;
    invoiceDate: string;
    customerName: string | null;
    totalAmount: number;
    balance: number;
    status: string;
  }>;
};

function MetricCard({
  label,
  value,
  detail,
  icon,
  accent,
}: {
  label: string;
  value: string;
  detail: string;
  icon: React.ReactNode;
  accent: "amber" | "emerald" | "sky" | "slate";
}) {
  const accents = {
    amber: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
    emerald: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    sky: "bg-sky-500/10 text-sky-700 dark:text-sky-400",
    slate: "bg-slate-500/10 text-slate-700 dark:text-slate-300",
  };
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-4 pt-6">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight">
            {value}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">{detail}</p>
        </div>
        <div className={`rounded-lg p-2.5 ${accents[accent]}`}>{icon}</div>
      </CardContent>
    </Card>
  );
}

function PositionBar({
  label,
  value,
  max,
  color,
  currency,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
  currency: Intl.NumberFormat;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium tabular-nums">
          {currency.format(value)}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <AnimatedProgressFill
          progress={Math.max(2, (value / max) * 100)}
          className={`h-full rounded-full ${color} transition-all`}
        />
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <main className="space-y-8 p-4 md:p-8">
      <div className="space-y-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-10 w-80" />
        <Skeleton className="h-4 w-96" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-32" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-80" />
        <Skeleton className="h-80" />
      </div>
      <Skeleton className="h-64" />
    </main>
  );
}
