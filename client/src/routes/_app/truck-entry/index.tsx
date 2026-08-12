import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ConfigurableDataTable } from "@/components/data-table";
import { StatsCard } from "@/components/stats-card";
import { getAllTruckEntries, truckEntryKeys } from "#/lib/query";
import { useEffect, useMemo } from "react";
import { toast } from "sonner";
import {
  IconCube,
  IconTruck,
} from "@tabler/icons-react";

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
  const { data, isLoading, isError, error } = useQuery({
    queryKey: truckEntryKeys.all,
    queryFn: getAllTruckEntries,
    retry: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  });

  const truckRows: TruckRow[] = (data ?? []).map((entry) => ({
    id: entry.id,
    truckNo: entry.truckNumber,
    entryDate: entry.entryDate,
    material: entry.materialName ?? "-",
    supplierName: entry.supplierName ?? "-",
    quantityBrass: String(entry.quantityBrass),
  }));

  const stats = useMemo(() => {
    const entries = data ?? [];
    const today = new Date();
    const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(
      today.getDate()
    ).padStart(2, "0")}`;
    const todayEntries = entries.filter((entry) => entry.entryDate === todayKey);
    const quantityToday = todayEntries.reduce((sum, entry) => sum + entry.quantityBrass, 0);
    const uniqueSuppliersToday = new Set(
      todayEntries
        .map((entry) => entry.supplierName?.trim())
        .filter((supplier): supplier is string => Boolean(supplier))
    ).size;
    const uniqueMaterialsToday = new Set(
      todayEntries
        .map((entry) => entry.materialName?.trim())
        .filter((material): material is string => Boolean(material))
    ).size;

    return {
      entriesToday: todayEntries.length,
      quantityToday,
      uniqueSuppliersToday,
      uniqueMaterialsToday,
    };
  }, [data]);

  useEffect(() => {
    if (isError) {
      console.error("Error loading truck entries:", error);
      toast.error("Failed to load truck entries. Please try again later.", {
        style: {
          color: "red",
        },
      });
    }
  }, [isError, error]);

  return (
    <div className="flex h-[calc(100vh-5rem)] flex-col p-6">
      <div className="mb-6 flex shrink-0 items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Truck Entry</h1>
          <p className="text-sm text-muted-foreground">All truck entries.</p>
        </div>
      </div>
      <div className="mb-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatsCard
          icon={<IconTruck className="size-4" />}
          title="Truck entries today"
          value={stats.entriesToday}
          footer="Entries recorded for today"
        />

        <StatsCard
          icon={<IconCube className="size-4" />}
          title="Quantity today"
          value={stats.quantityToday.toFixed(2)}
          footer="Total quantity recorded today."
        />
      </div>

      <ConfigurableDataTable
        data={truckRows}
        columns={[
          {
            accessorKey: "truckNo",
            header: "Truck No",
          },
          {
            accessorKey: "entryDate",
            header: "Entry Date",
          },
          {
            accessorKey: "material",
            header: "Material",
          },
          {
            accessorKey: "supplierName",
            header: "Supplier",
          },
          {
            accessorKey: "quantityBrass",
            header: "Quantity (Brass)",
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
    </div>
  );
}
