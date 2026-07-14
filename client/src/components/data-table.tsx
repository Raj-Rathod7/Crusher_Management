"use client"

import * as React from "react"
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core"
import { restrictToVerticalAxis } from "@dnd-kit/modifiers"
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconCircleCheckFilled,
  IconDotsVertical,
  IconGripVertical,
  IconLayoutColumns,
  IconLoader,
  IconPlus,
  IconTrendingUp,
} from "@tabler/icons-react"
import {
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type Row,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"
import { toast } from "sonner"
import { z } from "zod"

import { useIsMobile } from "@/hooks/use-mobile"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export const schema = z.object({
  id: z.number(),
  header: z.string(),
  type: z.string(),
  status: z.string(),
  target: z.string(),
  limit: z.string(),
  reviewer: z.string(),
})

type FilterType = "text" | "select" | "number" | "date" | "boolean"

type FilterOption = {
  label: string
  value: string
}

type ColumnMetaConfig = {
  sortable?: boolean
  filterable?: boolean
  filterType?: FilterType
  filterPlaceholder?: string
  filterOptions?: FilterOption[]
  searchable?: boolean
}

type DataTableColumnDef<TData> = ColumnDef<TData, unknown> & {
  meta?: ColumnMetaConfig
}

type DataTableProps<TData> = {
  data: TData[]
  columns: DataTableColumnDef<TData>[]
  getRowId?: (row: TData, index: number) => string
  enableSelection?: boolean
  enableColumnVisibility?: boolean
  enablePagination?: boolean
  enableSorting?: boolean
  enableDragAndDrop?: boolean
  enableGlobalSearch?: boolean
  globalSearchPlaceholder?: string
  toolbar?: React.ReactNode
  emptyMessage?: React.ReactNode
  pageSizeOptions?: number[]
  defaultPageSize?: number
  className?: string
  tableClassName?: string
}

function getColumnValue<TData>(row: TData, column: DataTableColumnDef<TData>) {
  const typedColumn = column as DataTableColumnDef<TData> & {
    accessorFn?: (row: TData) => unknown
    accessorKey?: string
    id?: string
  }

  if (typeof typedColumn.accessorFn === "function") {
    return typedColumn.accessorFn(row)
  }

  if (typeof typedColumn.accessorKey === "string") {
    return (row as Record<string, unknown>)[typedColumn.accessorKey]
  }

  if (typedColumn.id) {
    return (row as Record<string, unknown>)[typedColumn.id]
  }

  return undefined
}

function normalizeFilterValue(value: unknown) {
  if (value === null || value === undefined) {
    return ""
  }

  if (typeof value === "boolean") {
    return value ? "true" : "false"
  }

  if (typeof value === "number") {
    return String(value)
  }

  if (value instanceof Date) {
    return value.toISOString().slice(0, 10)
  }

  return String(value).trim()
}

function applyTableFilters<TData>(
  rows: TData[],
  columns: DataTableColumnDef<TData>[],
  columnFilters: ColumnFiltersState,
  globalSearch: string
) {
  const normalizedQuery = globalSearch.trim().toLowerCase()

  return rows.filter((row) => {
    if (normalizedQuery) {
      const matchesGlobalSearch = columns.some((column) => {
        const meta = column.meta

        if (meta?.searchable === false) {
          return false
        }

        const value = normalizeFilterValue(getColumnValue(row, column))
        return value.toLowerCase().includes(normalizedQuery)
      })

      if (!matchesGlobalSearch) {
        return false
      }
    }

    return columnFilters.every((filter) => {
      const matchedColumn = columns.find(
        (candidate) =>
          candidate.id === filter.id ||
          (candidate as DataTableColumnDef<TData> & { accessorKey?: string }).accessorKey === filter.id
      )

      if (!matchedColumn || !filter.value) {
        return true
      }

      const value = normalizeFilterValue(getColumnValue(row, matchedColumn))
      const filterValue = normalizeFilterValue(filter.value)
      const filterType = matchedColumn.meta?.filterType ?? "text"

      switch (filterType) {
        case "number": {
          const numericValue = Number(value)
          const numericFilter = Number(filterValue)
          return Number.isNaN(numericValue) || Number.isNaN(numericFilter)
            ? value === filterValue
            : numericValue === numericFilter
        }
        case "date":
          return value === filterValue
        case "boolean":
          return value === filterValue
        case "select":
          return value === filterValue
        case "text":
        default:
          return value.toLowerCase().includes(filterValue.toLowerCase())
      }
    })
  })
}

function DragHandle({ id }: { id: string }) {
  const { attributes, listeners } = useSortable({
    id,
  })

  return (
    <Button
      {...attributes}
      {...listeners}
      variant="ghost"
      size="icon"
      className="size-7 text-muted-foreground hover:bg-transparent"
    >
      <IconGripVertical className="size-3 text-muted-foreground" />
      <span className="sr-only">Drag to reorder</span>
    </Button>
  )
}

function DraggableRow<TData>({ row }: { row: Row<TData> }) {
  const { transform, transition, setNodeRef, isDragging } = useSortable({
    id: row.id,
  })

  return (
    <TableRow
      data-state={row.getIsSelected() && "selected"}
      data-dragging={isDragging}
      ref={setNodeRef}
      className="relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:opacity-80"
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
    >
      {row.getVisibleCells().map((cell) => (
        <TableCell key={cell.id}>
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
      ))}
    </TableRow>
  )
}

export function ConfigurableDataTable<TData>({
  data: initialData,
  columns,
  getRowId = (row: TData, index: number) =>
    typeof row === "object" && row !== null && "id" in row
      ? String((row as Record<string, unknown>).id ?? index)
      : String(index),
  enableSelection = true,
  enableColumnVisibility = true,
  enablePagination = true,
  enableSorting = true,
  enableDragAndDrop = false,
  enableGlobalSearch = true,
  globalSearchPlaceholder = "Search all columns",
  toolbar,
  emptyMessage = "No results.",
  pageSizeOptions = [10, 20, 30, 40, 50],
  defaultPageSize = 10,
  className,
  tableClassName,
}: DataTableProps<TData>) {
  const [data, setData] = React.useState(initialData)
  const [rowSelection, setRowSelection] = React.useState({})
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [globalSearch, setGlobalSearch] = React.useState("")
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: defaultPageSize,
  })
  const sortableId = React.useId()
  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {})
  )

  React.useEffect(() => {
    setData(initialData)
  }, [initialData])

  const dataIds = React.useMemo<UniqueIdentifier[]>(
    () => data.map((row, index) => getRowId(row, index)),
    [data, getRowId]
  )

  const tableColumns = React.useMemo(() => {
    const builtInColumns: ColumnDef<TData, unknown>[] = []

    if (enableDragAndDrop) {
      builtInColumns.push({
        id: "drag",
        header: () => null,
        cell: ({ row }) => <DragHandle id={row.id} />,
        enableSorting: false,
        enableHiding: false,
      })
    }

    if (enableSelection) {
      builtInColumns.push({
        id: "select",
        header: ({ table }) => (
          <div className="flex items-center justify-center">
            <Checkbox
              checked={
                table.getIsAllPageRowsSelected() ||
                (table.getIsSomePageRowsSelected() && "indeterminate")
              }
              onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
              aria-label="Select all"
            />
          </div>
        ),
        cell: ({ row }) => (
          <div className="flex items-center justify-center">
            <Checkbox
              checked={row.getIsSelected()}
              onCheckedChange={(value) => row.toggleSelected(!!value)}
              aria-label="Select row"
            />
          </div>
        ),
        enableSorting: false,
        enableHiding: false,
      })
    }

    return [
      ...builtInColumns,
      ...columns.map((column) => ({
        ...column,
        enableSorting: column.meta?.sortable ?? true,
      })),
    ]
  }, [columns, enableDragAndDrop, enableSelection])

  const filteredData = React.useMemo(
    () => applyTableFilters(data, tableColumns, columnFilters, globalSearch),
    [data, tableColumns, columnFilters, globalSearch]
  )

  const table = useReactTable<TData>({
    data: filteredData,
    columns: tableColumns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
    },
    getRowId: (row, index) => getRowId(row, index),
    enableRowSelection: enableSelection,
    onRowSelectionChange: setRowSelection,
    onSortingChange: enableSorting ? setSorting : undefined,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: enablePagination ? getPaginationRowModel() : undefined,
    getSortedRowModel: enableSorting ? getSortedRowModel() : undefined,
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  })

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event

    if (active && over && active.id !== over.id) {
      setData((currentData) => {
        const oldIndex = currentData.findIndex(
          (item, index) => getRowId(item, index) === String(active.id)
        )
        const newIndex = currentData.findIndex(
          (item, index) => getRowId(item, index) === String(over.id)
        )

        if (oldIndex === -1 || newIndex === -1) {
          return currentData
        }

        return arrayMove(currentData, oldIndex, newIndex)
      })
    }
  }

  return (
    <div className={['flex min-h-0 flex-col', className].filter(Boolean).join(' ')}>
      <div className="flex mb-2">
        <div className="flex flex-1 items-center">
          {enableGlobalSearch ? (
            <Input
                value={globalSearch}
                onChange={(event) => setGlobalSearch(event.target.value)}
                placeholder={globalSearchPlaceholder}
                className="max-w-sm"
              />
          ) : null}
        </div>
        {enableColumnVisibility ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <IconLayoutColumns />
                <span className="hidden lg:inline">Customize Columns</span>
                <span className="lg:hidden">Columns</span>
                <IconChevronDown />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" >
              {table
                .getAllColumns()
                .filter(
                  (column) =>
                    typeof column.accessorFn !== "undefined" && column.getCanHide()
                )
                .map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) => column.toggleVisibility(!!value)}
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>

      <div className={['mt-1 flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border', tableClassName ?? ''].filter(Boolean).join(' ')}>
        {enableDragAndDrop ? (
          <DndContext
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis]}
            onDragEnd={handleDragEnd}
            sensors={sensors}
            id={sortableId}
          >
            <div className="flex-1 overflow-auto">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-muted">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id} colSpan={header.colSpan}>
                        {header.isPlaceholder
                          ? null
                          : (() => {
                              const columnMeta = header.column.columnDef.meta as ColumnMetaConfig | undefined
                              const canSort = (columnMeta?.sortable ?? true) && enableSorting

                              return (
                                <div className="flex flex-col gap-2">
                                  <div className="flex items-center gap-2">
                                    {flexRender(
                                      header.column.columnDef.header,
                                      header.getContext()
                                    )}
                                    {header.column.getCanSort() && canSort ? (
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="size-7 shrink-0"
                                        onClick={header.column.getToggleSortingHandler()}
                                      >
                                        {header.column.getIsSorted() === "desc" ? "↓" : header.column.getIsSorted() === "asc" ? "↑" : "↕"}
                                      </Button>
                                    ) : null}
                                  </div>
                                  {columnMeta?.filterable ? (
                                    <ColumnFilterInput
                                      column={header.column}
                                      columnFilters={columnFilters}
                                      setColumnFilters={setColumnFilters}
                                    />
                                  ) : null}
                                </div>
                              )
                            })()}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody className="**:data-[slot=table-cell]:first:w-8">
                {table.getRowModel().rows?.length ? (
                  <SortableContext
                    items={dataIds}
                    strategy={verticalListSortingStrategy}
                  >
                    {table.getRowModel().rows.map((row) => (
                      <DraggableRow key={row.id} row={row} />
                    ))}
                  </SortableContext>
                ) : (
                  <TableRow>
                    <TableCell colSpan={tableColumns.length} className="h-24 text-center">
                      {emptyMessage}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
              </Table>
            </div>
          </DndContext>
        ) : (
          <div className="flex-1 overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-muted">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} colSpan={header.colSpan}>
                      {header.isPlaceholder
                        ? null
                        : (() => {
                            const columnMeta = header.column.columnDef.meta as ColumnMetaConfig | undefined
                            const canSort = (columnMeta?.sortable ?? true) && enableSorting

                            return (
                              <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-2">
                                  {flexRender(header.column.columnDef.header, header.getContext())}
                                  {header.column.getCanSort() && canSort ? (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      className="size-7 shrink-0"
                                      onClick={header.column.getToggleSortingHandler()}
                                    >
                                      {header.column.getIsSorted() === "desc" ? "↓" : header.column.getIsSorted() === "asc" ? "↑" : "↕"}
                                    </Button>
                                  ) : null}
                                </div>
                                {columnMeta?.filterable ? (
                                  <ColumnFilterInput
                                    column={header.column}
                                    columnFilters={columnFilters}
                                    setColumnFilters={setColumnFilters}
                                  />
                                ) : null}
                              </div>
                            )
                          })()}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody className="**:data-[slot=table-cell]:first:w-8">
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={tableColumns.length} className="h-24 text-center">
                    {emptyMessage}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
            </Table>
          </div>
        )}
      </div>

      {enablePagination ? (
        <div className="flex items-center justify-between px-4 py-4">
          <div className="hidden flex-1 text-sm text-muted-foreground lg:flex">
            {table.getFilteredSelectedRowModel().rows.length} of{" "}
            {table.getFilteredRowModel().rows.length} row(s) selected.
          </div>
          <div className="flex w-full items-center gap-8 lg:w-fit">
            <div className="hidden items-center gap-2 lg:flex">
              <Label htmlFor="rows-per-page" className="text-sm font-medium">
                Rows per page
              </Label>
              <Select
                value={`${table.getState().pagination.pageSize}`}
                onValueChange={(value) => table.setPageSize(Number(value))}
              >
                <SelectTrigger size="sm" className="w-20" id="rows-per-page">
                  <SelectValue placeholder={table.getState().pagination.pageSize} />
                </SelectTrigger>
                <SelectContent side="top">
                  {pageSizeOptions.map((pageSize) => (
                    <SelectItem key={pageSize} value={`${pageSize}`}>
                      {pageSize}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex w-fit items-center justify-center text-sm font-medium">
              Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
            </div>
            <div className="ml-auto flex items-center gap-2 lg:ml-0">
              <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to first page</span>
                <IconChevronsLeft />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to previous page</span>
                <IconChevronLeft />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Go to next page</span>
                <IconChevronRight />
              </Button>
              <Button
                variant="outline"
                className="hidden size-8 lg:flex"
                size="icon"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Go to last page</span>
                <IconChevronsRight />
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function ColumnFilterInput({
  column,
  columnFilters,
  setColumnFilters,
}: {
  column: any
  columnFilters: ColumnFiltersState
  setColumnFilters: React.Dispatch<React.SetStateAction<ColumnFiltersState>>
}) {
  const meta = column.columnDef.meta as ColumnMetaConfig | undefined
  const filterType = meta?.filterType ?? "text"
  const placeholder = meta?.filterPlaceholder ?? `Filter ${column.id}`

  const currentFilter = columnFilters.find((item) => item.id === column.id)

  const updateFilter = (value: string) => {
    setColumnFilters((prev) => {
      const next = prev.filter((item) => item.id !== column.id)
      if (!value) {
        return next
      }
      return [...next, { id: column.id, value }]
    })
  }

  if (filterType === "select" && meta?.filterOptions?.length) {
    return (
      <Select value={String(currentFilter?.value ?? "")} onValueChange={updateFilter}>
        <SelectTrigger className="h-8 w-full" size="sm">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {meta.filterOptions.map((option: FilterOption) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    )
  }

  return (
    <Input
      value={String(currentFilter?.value ?? "")}
      onChange={(event) => updateFilter(event.target.value)}
      placeholder={placeholder}
      className="h-8"
    />
  )
}


