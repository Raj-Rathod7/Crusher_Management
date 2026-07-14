import { createFileRoute } from '@tanstack/react-router'

import { ConfigurableDataTable } from '@/components/data-table'

export const Route = createFileRoute('/_app/truck-entry')({
  component: RouteComponent,
})

type TruckRow = {
  id: number
  truckNo: string
  driverName: string
  material: string
  status: string
  weight: string
}

const truckRows: TruckRow[] = [
  {
    id: 1,
    truckNo: 'TRK-101',
    driverName: 'Aman Verma',
    material: 'Stone Dust',
    status: 'In Queue',
    weight: '12.4 ton',
  },
  {
    id: 2,
    truckNo: 'TRK-102',
    driverName: 'Ravi Singh',
    material: 'Crusher Run',
    status: 'Loaded',
    weight: '14.8 ton',
  },
  {
    id: 3,
    truckNo: 'TRK-103',
    driverName: 'Kiran Patel',
    material: 'Aggregate',
    status: 'Weighed',
    weight: '11.9 ton',
  },
]

function RouteComponent() {
  return (
    <div className="flex h-[calc(100vh-5rem)] flex-col p-6">
      <div className="mb-6 shrink-0">
        <h1 className="text-2xl font-semibold">Truck Entry</h1>
        <p className="text-sm text-muted-foreground">
          Example view for the reusable table component.
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
            accessorKey: 'driverName',
            header: 'Driver',
          },
          {
            accessorKey: 'material',
            header: 'Material',
          },
          {
            accessorKey: 'status',
            header: 'Status',
          },
          {
            accessorKey: 'weight',
            header: 'Weight',
          },
        ]}
        getRowId={(row) => row.id.toString()}
        enableSelection
        enableColumnVisibility
        enablePagination
        enableSorting
        enableDragAndDrop={false}
        emptyMessage="No trucks found."
        className="w-full flex-1"
        tableClassName="flex-1"
      />
    </div>
  )
}
