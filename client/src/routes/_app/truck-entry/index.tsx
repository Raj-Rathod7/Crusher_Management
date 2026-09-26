import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ConfigurableDataTable } from "@/components/data-table";
import { FilterChip, StatsCard } from "@/components/stats-card";
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
import { matchesPeriod, matchesRange, QUICK_PERIODS, type QuickPeriod } from "#/lib/date-filters";
import { DateRangePicker, type DateRangeValue } from "@/components/date-range-picker";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  IconCalendarStats,
  IconCube,
  IconPencil,
  IconTrash,
  IconTruck,
} from "@tabler/icons-react";
import { Badge } from "#/components/ui/badge";
import { Truck } from "lucide-react";
import { isManager } from "#/lib/common/api";

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
  const [quickFilter, setQuickFilter] = useState<QuickPeriod>("all");
  const [dateRange, setDateRange] = useState<DateRangeValue>();
  const [visibleQuantity, setVisibleQuantity] = useState(0);
  const [visibleSuppliers, setVisibleSuppliers] = useState(0);
  const [visibleMaterials, setVisibleMaterials] = useState(0);
  const handleFilteredRows = (rows: TruckRow[]) => {
    setVisibleQuantity(rows.reduce((sum, row) => sum + Number(row.quantityBrass), 0));
    setVisibleSuppliers(new Set(rows.map((row) => row.supplierName.trim()).filter((name) => name && name !== "-")).size);
    setVisibleMaterials(new Set(rows.map((row) => row.material.trim()).filter((name) => name && name !== "-")).size);
  };
  const { data, isLoading, isError, error } = useQuery({
    queryKey: truckEntryKeys.all,
    queryFn: getAllTruckEntries,
    retry: false,
    refetchOnMount: true,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  });

  const quickFilterData = useMemo(
    () => (data ?? []).filter((entry) => matchesPeriod(entry.entryDate, quickFilter) && matchesRange(entry.entryDate, dateRange)),
    [data, quickFilter, dateRange],
  );

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

  const periodStats = useMemo(() => {
    const entries = data ?? [];
    const stats = {} as Record<QuickPeriod, { count: number; quantity: number; suppliers: number; materials: number }>;
    for (const period of QUICK_PERIODS) {
      const matched = entries.filter((entry) => matchesPeriod(entry.entryDate, period));
      stats[period] = {
        count: matched.length,
        quantity: matched.reduce((sum, entry) => sum + entry.quantityBrass, 0),
        suppliers: new Set(
          matched.map((entry) => entry.supplierName?.trim()).filter((supplier): supplier is string => Boolean(supplier)),
        ).size,
        materials: new Set(
          matched.map((entry) => entry.materialName?.trim()).filter((material): material is string => Boolean(material)),
        ).size,
      };
    }
    return stats;
  }, [data]);

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
      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:max-w-xl">
        <StatsCard
          icon={<IconCube className="size-4" />}
          title="Qty brass"
          value={visibleQuantity.toFixed(2)}
          description={`${visibleSuppliers} suppliers · ${visibleMaterials} materials`}
        />
      </div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <FilterChip
          icon={<IconTruck className="size-4" />}
          title="All purchases"
          value={periodStats.all.count}
          active={quickFilter === "all" && !dateRange}
          onClick={() => { setQuickFilter("all"); setDateRange(undefined); }}
        />
        <FilterChip
          icon={<IconCalendarStats className="size-4" />}
          title="Today"
          value={periodStats.today.count}
          active={quickFilter === "today"}
          onClick={() => { setQuickFilter("today"); setDateRange(undefined); }}
        />
        {!isManager() && (
          <DateRangePicker
            className="ml-auto"
            showPresets={false}
            value={dateRange}
            onChange={(range) => { setDateRange(range); setQuickFilter("all"); }}
            onClear={() => setDateRange(undefined)}
          />
        )}
      </div>

      <ConfigurableDataTable
        data={truckRows}
        onFilteredDataChange={handleFilteredRows}
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
          ...(isManager() ? [] : [{
            id: "actions",
            header: "Actions",
            meta: { sortable: false, searchable: false },
            cell: ({ row }: { row: { original: TruckRow } }) => (
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
          }]),
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
        exportFileName="truck-entries-report"
        exportTitle="Truck entries report"
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
