import { ConfigurableDataTable } from "#/components/data-table";
import { Button } from "#/components/ui/button";
import type { Customer } from "#/lib/models";
import { customerKeys, getAllCustomers } from "#/lib/query";
import { IconPencil, IconTrash } from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/customer/")({
  component: RouteComponent,
});

type CustomerRow = Omit<Customer, "createdAt" | "isActive">

function RouteComponent() {
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
    }
  })

  const setEntryToDelete = (entry: CustomerRow | null) => {
    void entry
  }

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
          },
          {
            accessorKey: "name",
            header: "Name",
          },
          {
            accessorKey: "phone",
            header: "Phone",
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
            id: "actions",
            header: "Actions",
            cell: ({ row }) => (
              <div className="flex items-center gap-2">
                <Button asChild size="icon-sm" variant="outline">
                  <Link
                    to="/customer/$customerId/edit"
                    params={{ customerId: String(row.original.id) }}
                  >
                    <IconPencil />
                    <span className="sr-only">Edit customer</span>
                  </Link>
                </Button>
                <Button
                  size="icon-sm"
                  variant="destructive"
                  onClick={() => setEntryToDelete(row.original)}
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
      />
    </div>
  );
}
