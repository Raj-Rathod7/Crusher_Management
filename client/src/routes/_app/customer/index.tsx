import { ConfigurableDataTable } from "#/components/data-table";
import { Button } from "#/components/ui/button";
import { Badge } from "#/components/ui/badge";
import { Card, CardContent } from "#/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "#/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "#/components/ui/table";
import type { Customer, Invoice } from "#/lib/models";
import { apiClient } from "#/lib/common/api";
import { customerKeys, getAllCustomers } from "#/lib/query";
import {
  IconChevronDown,
  IconChevronRight,
  IconPencil,
  IconReceipt,
  IconTrash,
} from "@tabler/icons-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { PersonStanding, User2 } from "lucide-react";

export const Route = createFileRoute("/_app/customer/")({
  component: RouteComponent,
});

type CustomerRow = Omit<Customer, "createdAt" | "isActive">;

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

function RouteComponent() {
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );
  const [expandedInvoiceId, setExpandedInvoiceId] = useState<number | null>(
    null,
  );
  const { data, isLoading, isError, error } = useQuery({
    queryKey: customerKeys.all,
    queryFn: getAllCustomers,
    retry: false,
  });

  const customerRows: CustomerRow[] = (data ?? []).map((customer) => {
    return {
      id: customer.id,
      name: customer.name,
      phone: customer.phone ?? "-",
      address: customer.address ?? "-",
      notes: customer.notes ?? "-",
      pendingBalance: customer.pendingBalance ?? 0,
    };
  });

  const setEntryToDelete = (entry: CustomerRow | null) => {
    void entry;
  };

  const invoicesQuery = useQuery({
    queryKey: ["customer-invoices", selectedCustomer?.id],
    queryFn: () =>
      apiClient.get<Invoice[]>(`/customers/${selectedCustomer!.id}/invoices`),
    enabled: selectedCustomer !== null,
    retry: false,
  });

  return (
    <div className="flex h-[calc(100vh-5rem)] flex-col p-6">
      <div className="mb-6 flex shrink-0 items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Customers</h1>
          <p className="text-sm text-muted-foreground">All customers</p>
        </div>
      </div>
      <ConfigurableDataTable
        data={customerRows}
        columns={[
          {
            accessorKey: "id",
            header: "ID",
            meta: { filterable: true, filterType: "number" },
          },
          {
            accessorKey: "name",
            header: "Name",
            meta: { filterable: true, filterPlaceholder: "Filter name" },
            cell: ({ row }) => (
              <Badge variant="outline" className={`capitalize font-bold p-2`}>
                <User2 />
                {row.original.name}
              </Badge>
            ),
          },
          {
            accessorKey: "phone",
            header: "Phone",
            meta: { filterable: true, filterPlaceholder: "Filter phone" },
          },
          {
            accessorKey: "address",
            header: "Address",
          },
          {
            accessorKey: "notes",
            header: "Notes",
          },
          {
            accessorKey: "pendingBalance",
            header: "Pending Balance",
            meta: { filterable: true, filterType: "number" },
            cell: ({ row }) => (
              <span className="font-medium text-amber-700 dark:text-amber-400">
                {currency.format(Number(row.original.pendingBalance ?? 0))}
              </span>
            ),
          },
          {
            id: "actions",
            header: "Actions",
            meta: { sortable: false, searchable: false },
            cell: ({ row }) => (
              <div className="flex items-center gap-2">
                <Button asChild size="icon-sm" variant="outline">
                  <Link
                    to="/customer/$customerId/edit"
                    params={{ customerId: String(row.original.id) }}
                    onClick={(event) => event.stopPropagation()}
                  >
                    <IconPencil />
                    <span className="sr-only">Edit customer</span>
                  </Link>
                </Button>
                <Button
                  size="icon-sm"
                  variant="destructive"
                  onClick={(event) => {
                    event.stopPropagation();
                    setEntryToDelete(row.original);
                  }}
                >
                  <IconTrash />
                  <span className="sr-only">Delete customer</span>
                </Button>
              </div>
            ),
          },
        ]}
        getRowId={(row) => row.id.toString()}
        enableColumnVisibility
        enablePagination
        enableSorting
        isLoading={isLoading}
        loadingMessage="Loading customers"
        emptyMessage="No customers found."
        className="w-full flex-1"
        tableClassName="flex-1"
        enableAddButton
        addButtonLink="/customer/new"
        addButtonText="Add Customer"
        onRowClick={(row) => {
          setSelectedCustomer(
            data?.find((customer) => customer.id === row.id) ?? null,
          );
          setExpandedInvoiceId(null);
        }}
      />

      <Dialog
        open={selectedCustomer !== null}
        onOpenChange={(open) => !open && setSelectedCustomer(null)}
      >
        <DialogContent className="max-w-5xl">
          <DialogHeader className="border-b bg-muted/30 pb-5">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-amber-500/15 p-2 text-amber-700 dark:text-amber-400">
                <IconReceipt className="size-5" />
              </div>
              <div>
                <DialogTitle>{selectedCustomer?.name}</DialogTitle>
                <DialogDescription className="mt-1">
                  Invoice history and material breakdown
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="max-h-[65vh] overflow-y-auto p-5">
            {selectedCustomer ? (
              <CustomerDetailsPanel customer={selectedCustomer} />
            ) : null}

            {invoicesQuery.isLoading ? (
              <InvoiceModalSkeleton />
            ) : invoicesQuery.isError ? (
              <Card className="border-destructive/30">
                <CardContent className="p-5 text-sm text-destructive">
                  Unable to load this customer&apos;s invoices.
                </CardContent>
              </Card>
            ) : invoicesQuery.data?.length ? (
              <div className="mt-4">
                <CustomerInvoiceSummary invoices={invoicesQuery.data} />
                <ExpandableInvoiceTable invoices={invoicesQuery.data} />
              </div>
            ) : (
              <Card className="mt-4">
                <CardContent className="p-8 text-center text-sm text-muted-foreground">
                  No invoices recorded for this customer.
                </CardContent>
              </Card>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CustomerDetailsPanel({ customer }: { customer: Customer }) {
  return (
    <Card>
      <CardContent className="grid gap-4 p-4 md:grid-cols-2">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Customer name</p>
          <p className="mt-1 text-base font-semibold">{customer.name}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Pending balance</p>
          <p className="mt-1 text-base font-semibold text-amber-700 dark:text-amber-400">
            {currency.format(customer.pendingBalance ?? 0)}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Phone</p>
          <p className="mt-1 text-sm">{customer.phone ?? "-"}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Address</p>
          <p className="mt-1 text-sm">{customer.address ?? "-"}</p>
        </div>
        <div className="md:col-span-2">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Notes</p>
          <p className="mt-1 text-sm">{customer.notes ?? "-"}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function CustomerInvoiceSummary({ invoices }: { invoices: Invoice[] }) {
  const consolidated = invoices.reduce(
    (acc, invoice) => {
      acc.totalAmount += invoice.totalAmount;
      acc.amountPaid += invoice.amountPaid;
      acc.pendingBalance += Math.max(invoice.balance, 0);
      return acc;
    },
    {
      totalAmount: 0,
      amountPaid: 0,
      pendingBalance: 0,
    },
  );

  return (
    <div className="mb-4 grid gap-3 md:grid-cols-4">
      <Card>
        <CardContent className="p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Invoices</p>
          <p className="mt-1 text-lg font-semibold">{invoices.length}</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Total billed</p>
          <p className="mt-1 text-lg font-semibold">{currency.format(consolidated.totalAmount)}</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Collected</p>
          <p className="mt-1 text-lg font-semibold text-emerald-700 dark:text-emerald-400">
            {currency.format(consolidated.amountPaid)}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Pending balance</p>
          <p className="mt-1 text-lg font-semibold text-amber-700 dark:text-amber-400">
            {currency.format(consolidated.pendingBalance)}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function ExpandableInvoiceTable({ invoices }: { invoices: Invoice[] }) {
  return (
    <ConfigurableDataTable
      data={invoices}
      columns={[
        { accessorKey: "invoiceNumber", header: "Invoice" },
        { accessorKey: "invoiceDate", header: "Date" },
        {
          accessorKey: "status",
          header: "Status",
          cell: ({ row }) => (
            <Badge
              variant={
                row.original.status === "paid"
                  ? "default"
                  : row.original.status === "partial"
                    ? "secondary"
                    : "outline"
              }
            >
              {row.original.status}
            </Badge>
          ),
        },
        {
          accessorKey: "totalAmount",
          header: "Total",
          cell: ({ row }) => currency.format(row.original.totalAmount),
        },
        {
          accessorKey: "balance",
          header: "Balance",
          cell: ({ row }) => (
            <span
              className={
                row.original.balance > 0
                  ? "font-medium text-amber-700 dark:text-amber-400"
                  : "font-medium text-emerald-700 dark:text-emerald-400"
              }
            >
              {currency.format(row.original.balance)}
            </span>
          ),
        },
      ]}
      getRowId={(row) => row.id.toString()}
      enableColumnVisibility={false}
      enablePagination={false}
      enableSorting={false}
      enableGlobalSearch={false}
      renderExpandedRow={(invoice) => (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Material items</p>
            <span className="text-xs text-muted-foreground">
              {invoice.invoiceItems?.length ?? 0} item
              {invoice.invoiceItems?.length === 1 ? "" : "s"}
            </span>
          </div>
          {invoice.invoiceItems?.length ? (
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/40">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">
                      Material
                    </th>
                    <th className="px-3 py-2 text-left font-medium">Truck</th>
                    <th className="px-3 py-2 text-right font-medium">
                      Quantity
                    </th>
                    <th className="px-3 py-2 text-right font-medium">Rate</th>
                    <th className="px-3 py-2 text-right font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.invoiceItems.map((item) => (
                    <tr key={item.id} className="border-b last:border-0">
                      <td className="px-3 py-2">
                        {item.materialName ?? "Material"}
                      </td>
                      <td className="px-3 py-2">
                        {item.truckNumber ?? "Not assigned"}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {item.quantityBrass}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {currency.format(item.rate)}
                      </td>
                      <td className="px-3 py-2 text-right font-medium tabular-nums">
                        {currency.format(item.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No material items attached.
            </p>
          )}
        </div>
      )}
      emptyMessage="No invoices recorded for this customer."
    />
  );
}

function ReusableInvoiceTable({
  invoices,
  expandedInvoiceId,
  onToggle,
}: {
  invoices: Invoice[];
  expandedInvoiceId: number | null;
  onToggle: (id: number) => void;
}) {
  const currency = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  });
  const selectedInvoice = invoices.find(
    (invoice) => invoice.id === expandedInvoiceId,
  );

  return (
    <div className="space-y-4">
      <ConfigurableDataTable
        data={invoices}
        columns={[
          { accessorKey: "invoiceNumber", header: "Invoice" },
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
                variant={
                  row.original.status === "paid"
                    ? "default"
                    : row.original.status === "partial"
                      ? "secondary"
                      : "outline"
                }
              >
                {row.original.status}
              </Badge>
            ),
          },
          {
            accessorKey: "totalAmount",
            header: "Total",
            cell: ({ row }) => currency.format(row.original.totalAmount),
          },
          {
            accessorKey: "balance",
            header: "Balance",
            cell: ({ row }) => (
              <span
                className={
                  row.original.balance > 0
                    ? "font-medium text-amber-700 dark:text-amber-400"
                    : "font-medium text-emerald-700 dark:text-emerald-400"
                }
              >
                {currency.format(row.original.balance)}
              </span>
            ),
          },
        ]}
        getRowId={(row) => row.id.toString()}
        enableColumnVisibility={false}
        enablePagination={false}
        enableSorting={false}
        enableGlobalSearch={false}
        onRowClick={(row) => onToggle(row.id)}
        emptyMessage="No invoices recorded for this customer."
      />
      {selectedInvoice ? (
        <Card className="border-l-2 border-l-primary">
          <CardContent className="space-y-3 p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">
                Materials in {selectedInvoice.invoiceNumber}
              </p>
              <span className="text-xs text-muted-foreground">
                {selectedInvoice.invoiceItems.length} item
                {selectedInvoice.invoiceItems.length === 1 ? "" : "s"}
              </span>
            </div>
            {selectedInvoice.invoiceItems.length ? (
              <div className="grid gap-2">
                {selectedInvoice.invoiceItems.map((item) => (
                  <div
                    key={item.id}
                    className="grid grid-cols-[1fr_auto_auto] items-center gap-3 rounded-md border px-3 py-2 text-sm"
                  >
                    <div>
                      <p className="font-medium">
                        {item.materialName ?? "Material"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Truck {item.truckNumber ?? "Not assigned"}
                      </p>
                    </div>
                    <span className="text-muted-foreground">
                      {item.quantityBrass} x{" "}
                      {currency.format(item.rate)}
                    </span>
                    <span className="font-medium tabular-nums">
                      {currency.format(item.amount)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No material items attached.
              </p>
            )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function InvoiceTable({
  invoices,
  expandedInvoiceId,
  onToggle,
}: {
  invoices: Invoice[];
  expandedInvoiceId: number | null;
  onToggle: (id: number) => void;
}) {
  const currency = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  });
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-10" />
          <TableHead>Invoice</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Total</TableHead>
          <TableHead className="text-right">Balance</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invoices.map((invoice) => {
          const expanded = expandedInvoiceId === invoice.id;
          const statusVariant =
            invoice.status === "paid"
              ? "default"
              : invoice.status === "partial"
                ? "secondary"
                : "outline";
          return (
            <>
              <TableRow
                key={invoice.id}
                className="cursor-pointer"
                onClick={() => onToggle(invoice.id)}
                aria-expanded={expanded}
              >
                <TableCell>
                  {expanded ? (
                    <IconChevronDown className="size-4 text-muted-foreground" />
                  ) : (
                    <IconChevronRight className="size-4 text-muted-foreground" />
                  )}
                </TableCell>
                <TableCell className="font-medium">
                  {invoice.invoiceNumber}
                </TableCell>
                <TableCell>
                  {new Date(
                    `${invoice.invoiceDate}T00:00:00`,
                  ).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </TableCell>
                <TableCell>
                  <Badge variant={statusVariant}>{invoice.status}</Badge>
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {currency.format(invoice.totalAmount)}
                </TableCell>
                <TableCell
                  className={`text-right font-medium tabular-nums ${invoice.balance > 0 ? "text-amber-700 dark:text-amber-400" : "text-emerald-700 dark:text-emerald-400"}`}
                >
                  {currency.format(invoice.balance)}
                </TableCell>
              </TableRow>
              {expanded ? (
                <TableRow
                  key={`${invoice.id}-items`}
                  className="bg-muted/20 hover:bg-muted/20"
                >
                  <TableCell colSpan={6} className="p-0">
                    <div className="border-l-2 border-amber-500/60 px-6 py-4">
                      <div className="mb-3 flex items-center justify-between">
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Material items
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {invoice.invoiceItems.length} item
                          {invoice.invoiceItems.length === 1 ? "" : "s"}
                        </p>
                      </div>
                      {invoice.invoiceItems.length ? (
                        <div className="space-y-2">
                          {invoice.invoiceItems.map((item) => (
                            <div
                              key={item.id}
                              className="grid grid-cols-[1fr_auto_auto] items-center gap-4 rounded-md bg-background px-3 py-2 text-sm ring-1 ring-border/60"
                            >
                              <div>
                                <p className="font-medium">
                                  {item.materialName ?? "Material"}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Truck {item.truckNumber ?? "未 assigned"}
                                </p>
                              </div>
                              <span className="text-muted-foreground">
                                {item.quantityBrass} × {currency.format(item.rate)}
                              </span>
                              <span className="font-medium tabular-nums">
                                {currency.format(item.amount)}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          No material items attached.
                        </p>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : null}
            </>
          );
        })}
      </TableBody>
    </Table>
  );
}

function InvoiceModalSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((item) => (
        <div key={item} className="h-14 animate-pulse rounded-md bg-muted" />
      ))}
    </div>
  );
}
