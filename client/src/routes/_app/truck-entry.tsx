import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { ConfigurableDataTable } from '@/components/data-table'
import { getAllTruckEntries, truckEntryKeys } from '#/lib/query'
import { useEffect } from 'react'
import { toast } from 'sonner'

export const Route = createFileRoute('/_app/truck-entry')({
  component: RouteComponent,
})

type TruckRow = {
  id: number
  truckNo: string
  entryDate: string
  material: string
  supplierName: string
  quantityBrass: string
}

function RouteComponent() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: truckEntryKeys.all,
    queryFn: getAllTruckEntries,
    retry: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false
  })

  const truckRows: TruckRow[] = (data ?? []).map((entry) => ({
    id: entry.id,
    truckNo: entry.truckNumber,
    entryDate: entry.entryDate,
    material: entry.materialName ?? '-',
    supplierName: entry.supplierName ?? '-',
    quantityBrass: String(entry.quantityBrass),
  }));

  useEffect(() => {
    if (isError) {
      console.error('Error loading truck entries:', error);
      toast.error('Failed to load truck entries. Please try again later.', {
        style: {
          color: 'red'
        }
      });
    }
  }, [isError, error]);

  return (
    <div className="flex h-[calc(100vh-5rem)] flex-col p-6">
      <div className="mb-6 shrink-0">
        <h1 className="text-2xl font-semibold">Truck Entry</h1>
        <p className="text-sm text-muted-foreground">
          All truck entries from server.
        </p>
      </div>

      <ConfigurableDataTable
        data={truckRows}
        columns={[
          {
            accessorKey: 'truckNo',
            header: 'Truck No',
          },
          {
            accessorKey: 'entryDate',
            header: 'Entry Date',
          },
          {
            accessorKey: 'material',
            header: 'Material',
          },
          {
            accessorKey: 'supplierName',
            header: 'Supplier',
          },
          {
            accessorKey: 'quantityBrass',
            header: 'Quantity (Brass)',
          },
        ]}
        getRowId={(row) => row.id.toString()}
        enableColumnVisibility
        enablePagination
        enableSorting
        enableDragAndDrop={false}
        isLoading={isLoading}
        loadingMessage="Loading truck entries"
        emptyMessage="No truck entries found."
        className="w-full flex-1"
        tableClassName="flex-1"
      />
    </div>
  )
}
