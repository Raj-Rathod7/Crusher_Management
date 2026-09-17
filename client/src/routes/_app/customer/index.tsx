import { ConfigurableDataTable } from "#/components/data-table";
import { Button } from "#/components/ui/button";
import { Badge } from "#/components/ui/badge";
import type { Customer } from "#/lib/models";
import { customerKeys, getAllCustomers } from "#/lib/query";
import {
  IconPencil,
  IconTrash,
} from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { User2 } from "lucide-react";
import { useMemo, useState } from "react";

export const Route = createFileRoute("/_app/customer/")({
  component: RouteComponent,
});

type CustomerRow = Omit<Customer, "createdAt" | "isActive">;

type QuickFilter = "all" | "pendingBalance" | "hasCredit" | "settled";

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

function RouteComponent() {
  const navigate = useNavigate();
  const [quickFilter, setQuickFilter] = useState<QuickFilter>("all");
  const { data, isLoading } = useQuery({
    queryKey: customerKeys.all,
    queryFn: getAllCustomers,
    retry: false,
  });

  const quickFilterCounts = useMemo(() => {
    const customers = data ?? [];
    return {
      all: customers.length,
      pendingBalance: customers.filter((customer) => (customer.pendingBalance ?? 0) > 0).length,
      hasCredit: customers.filter((customer) => (customer.availableCredit ?? 0) > 0).length,
      settled: customers.filter(
        (customer) => (customer.pendingBalance ?? 0) === 0 && (customer.availableCredit ?? 0) === 0,
      ).length,
    };
  }, [data]);

  const filteredCustomers = useMemo(() => {
    const customers = data ?? [];
    switch (quickFilter) {
      case "pendingBalance":
        return customers.filter((customer) => (customer.pendingBalance ?? 0) > 0);
      case "hasCredit":
        return customers.filter((customer) => (customer.availableCredit ?? 0) > 0);
      case "settled":
        return customers.filter(
          (customer) => (customer.pendingBalance ?? 0) === 0 && (customer.availableCredit ?? 0) === 0,
        );
      default:
        return customers;
    }
  }, [data, quickFilter]);

  const customerRows: CustomerRow[] = filteredCustomers.map((customer) => {
    return {
      id: customer.id,
      name: customer.name,
      phone: customer.phone ?? "-",
      address: customer.address ?? "-",
      notes: customer.notes ?? "-",
      pendingBalance: customer.pendingBalance ?? 0,
      availableCredit: customer.availableCredit ?? 0,
    };
  });

  const setEntryToDelete = (entry: CustomerRow | null) => {
    void entry;
  };

  return (
    <div className="flex h-[calc(100vh-5rem)] flex-col p-6">
      <div className="mb-6 flex shrink-0 items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Customers</h1>
          <p className="text-sm text-muted-foreground">All customers</p>
        </div>
      </div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <QuickFilterChip label="All" count={quickFilterCounts.all} active={quickFilter === "all"} onClick={() => setQuickFilter("all")} />
        <QuickFilterChip
          label="Pending balance"
          count={quickFilterCounts.pendingBalance}
          active={quickFilter === "pendingBalance"}
          onClick={() => setQuickFilter("pendingBalance")}
        />
        <QuickFilterChip
          label="Has credit"
          count={quickFilterCounts.hasCredit}
          active={quickFilter === "hasCredit"}
          onClick={() => setQuickFilter("hasCredit")}
        />
        <QuickFilterChip
          label="Settled"
          count={quickFilterCounts.settled}
          active={quickFilter === "settled"}
          onClick={() => setQuickFilter("settled")}
        />
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
            accessorKey: "availableCredit",
            header: "Available Credit",
            meta: { filterable: true, filterType: "number" },
            cell: ({ row }) => (
              <span className="font-medium text-emerald-700 dark:text-emerald-400">
                {currency.format(Number(row.original.availableCredit ?? 0))}
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
          navigate({ to: "/customer/$customerId", params: { customerId: String(row.id) } });
        }}
      />
    </div>
  );
}

function QuickFilterChip({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <Button type="button" size="sm" variant={active ? "default" : "outline"} onClick={onClick} className="gap-2">
      {label}
      <Badge variant={active ? "secondary" : "outline"} className="px-1.5 font-mono">
        {count}
      </Badge>
    </Button>
  );
}


