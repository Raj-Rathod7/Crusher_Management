import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ConfigurableDataTable } from "@/components/data-table";
import { FilterChip } from "@/components/stats-card";
import { Button } from "#/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "#/components/ui/dialog";
import { deleteTruckEntry } from "#/lib/mutation";
import { getAllTruckEntries, truckEntryKeys } from "#/lib/query";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  IconCube,
  IconPencil,
  IconTrash,
  IconTruck,
} from "@tabler/icons-react";
import { Badge } from "#/components/ui/badge";
import { Truck } from "lucide-react";

export const Route = createFileRoute("/_app/truck-entry/")({
  component: RouteComponent,
});

type TruckRow = {
  id: number;
  truckNo: string;
  entryDate: string;
  material: string;
  supplierName: string;
  quantityBrass: string;
};

function RouteComponent() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [entryToDelete, setEntryToDelete] = useState<TruckRow | null>(null);
  const [quickFilter, setQuickFilter] = useState<"all" | "today">("all");
  const { data, isLoading, isError, error } = useQuery({
    queryKey: truckEntryKeys.all,
    queryFn: getAllTruckEntries,
    retry: false,
    refetchOnMount: true,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  });

  const quickFilterData = useMemo(() => {
    if (quickFilter !== "today") {
      return data ?? [];
    }
    const today = new Date();
    const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(
      today.getDate(),
    ).padStart(2, "0")}`;
    return (data ?? []).filter((entry) => entry.entryDate === todayKey);
  }, [data, quickFilter]);

  const truckRows: TruckRow[] = quickFilterData.map((entry) => ({
    id: entry.id,
    truckNo: entry.truckNumber,
    entryDate: entry.entryDate,
    material: entry.materialName ?? "-",
    supplierName: entry.supplierName ?? "-",
    quantityBrass: String(entry.quantityBrass),
  }));

  const deleteMutation = useMutation({
    mutationFn: deleteTruckEntry,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: truckEntryKeys.all }),
        queryClient.refetchQueries({
          queryKey: truckEntryKeys.all,
          type: "all",
        }),
        router.invalidate(),
      ]);
      setEntryToDelete(null);
      toast.success("Truck entry deleted.");
    },
    onError: () => {
      toast.error("Failed to delete truck entry.");
    },
  });

  const stats = useMemo(() => {
    const entries = data ?? [];
    const today = new Date();
    const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(
      today.getDate(),
    ).padStart(2, "0")}`;
    const todayEntries = entries.filter(
      (entry) => entry.entryDate === todayKey,
    );
    const selectedEntries = quickFilter === "today" ? todayEntries : entries;
    const quantityToday = selectedEntries.reduce(
      (sum, entry) => sum + entry.quantityBrass,
      0,
    );
    const uniqueSuppliersToday = new Set(
      selectedEntries
        .map((entry) => entry.supplierName?.trim())
        .filter((supplier): supplier is string => Boolean(supplier)),
    ).size;
    const uniqueMaterialsToday = new Set(
      selectedEntries
        .map((entry) => entry.materialName?.trim())
        .filter((material): material is string => Boolean(material)),
    ).size;

    return {
      entriesToday: selectedEntries.length,
      quantityToday,
      uniqueSuppliersToday,
      uniqueMaterialsToday,
      allEntries: entries.length,
      todayEntries: todayEntries.length,
      allQuantity: entries.reduce((sum, entry) => sum + entry.quantityBrass, 0),
    };
  }, [data, quickFilter]);

  useEffect(() => {
    if (isError) {
      toast.error("Failed to load truck entries. Please try again later.", {});
    }
  }, [isError, error]);

  return (
    <div className="flex h-[calc(100vh-5rem)] flex-col p-6">
      <div className=" mb-6 bg-red flex shrink-0 items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Purchase</h1>
          <p className="text-sm text-muted-foreground">All purchase entries.</p>
        </div>
      </div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <FilterChip
          icon={<IconTruck className="size-4" />}
          title="All purchases"
          value={stats.allEntries}
          active={quickFilter === "all"}
          onClick={() => setQuickFilter("all")}
        />
        <FilterChip
          icon={<IconCube className="size-4" />}
          title="Purchases today"
          value={stats.todayEntries}
          active={quickFilter === "today"}
          onClick={() => setQuickFilter("today")}
        />
        <span className="text-xs text-muted-foreground">Quantity: {(quickFilter === "today" ? stats.quantityToday : stats.allQuantity).toFixed(2)}</span>
      </div>

      <ConfigurableDataTable
        data={truckRows}
        columns={[
          {
            accessorKey: "truckNo",
            header: "Truck No",
            meta: { filterable: true, filterPlaceholder: "Filter truck" },
            cell: ({ row }) => (
              <Badge
                variant="secondary"
                className={`uppercase p-3  font-bold`}
              >
                <Truck className="mr-2"/>
                {row.original.truckNo}
              </Badge>
            ),
          },
          {
            accessorKey: "entryDate",
            header: "Entry Date",
            meta: { filterable: true, filterType: "date" },
          },
          {
            accessorKey: "material",
            header: "Material",
            meta: { filterable: true, filterPlaceholder: "Filter material" },
          },
          {
            accessorKey: "supplierName",
            header: "Supplier",
            meta: { filterable: true, filterPlaceholder: "Filter supplier" },
          },
          {
            accessorKey: "quantityBrass",
            header: "Quantity (Brass)",
          },
          {
            id: "actions",
            header: "Actions",
            meta: { sortable: false, searchable: false },
            cell: ({ row }) => (
              <div className="flex items-center gap-2">
                <Button asChild size="icon-sm" variant="outline">
                  <Link
                    to="/truck-entry/$entryId/edit"
                    params={{ entryId: String(row.original.id) }}
                  >
                    <IconPencil />
                    <span className="sr-only">Edit truck entry</span>
                  </Link>
                </Button>
                <Button
                  size="icon-sm"
                  variant="destructive"
                  onClick={() => setEntryToDelete(row.original)}
                >
                  <IconTrash />
                  <span className="sr-only">Delete truck entry</span>
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
        loadingMessage="Loading truck entries"
        emptyMessage="No truck entries found."
        className="w-full flex-1"
        tableClassName="flex-1"
        enableAddButton
        addButtonLink="/truck-entry/new"
        addButtonText="Add Truck Entry"
      />

      <Dialog
        open={Boolean(entryToDelete)}
        onOpenChange={(open) => !open && setEntryToDelete(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete truck entry</DialogTitle>
            <DialogDescription>
              {entryToDelete
                ? `Delete ${entryToDelete.truckNo} from ${entryToDelete.entryDate}? This action cannot be undone.`
                : "Delete this truck entry? This action cannot be undone."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEntryToDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (!entryToDelete) {
                  return;
                }
                deleteMutation.mutate(entryToDelete.id);
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
