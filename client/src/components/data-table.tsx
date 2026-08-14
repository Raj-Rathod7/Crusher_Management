"use client"

import * as React from "react"
import {
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconLayoutColumns,
  IconLoader,
  IconPlus
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
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent, DropdownMenuTrigger
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Link } from "@tanstack/react-router"

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
  isLoading?: boolean
  loadingMessage?: React.ReactNode
  getRowId?: (row: TData, index: number) => string
  enableColumnVisibility?: boolean
  enablePagination?: boolean
  enableSorting?: boolean
  enableGlobalSearch?: boolean
  globalSearchPlaceholder?: string
  toolbar?: React.ReactNode
  emptyMessage?: React.ReactNode
  pageSizeOptions?: number[]
  defaultPageSize?: number
  className?: string
  tableClassName?: string
  enableAddButton?: boolean
  addButtonLink?: string
  addButtonText?: string
  onRowClick?: (row: TData) => void
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

export function ConfigurableDataTable<TData>({
  data,
  columns,
  isLoading = false,
  loadingMessage = 'Loading...',
  getRowId = (row: TData, index: number) =>
    typeof row === "object" && row !== null && "id" in row
      ? String((row as Record<string, unknown>).id ?? index)
      : String(index),
  enableColumnVisibility = true,
  enablePagination = true,
  enableSorting = true,
  enableGlobalSearch = true,
  globalSearchPlaceholder = "Search all columns",
  toolbar,
  emptyMessage = "No results.",
  pageSizeOptions = [10, 20, 30, 40, 50],
  defaultPageSize = 10,
  className,
  tableClassName,
  addButtonLink,
  addButtonText = "Add Entry",
  enableAddButton = false,
  onRowClick,
}: DataTableProps<TData>) {
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [globalSearch, setGlobalSearch] = React.useState("")
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: defaultPageSize,
  })

  const tableColumns = React.useMemo(() => {
    return columns.map((column) => ({
        ...column,
        enableSorting: column.meta?.sortable ?? true,
      }))
  }, [columns])

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
      columnFilters,
      pagination,
    },
    getRowId: (row, index) => getRowId(row, index),
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
        {toolbar ? <div className="mr-2 flex items-center gap-2">{toolbar}</div> : null}
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
        {enableAddButton && (
          <Button asChild className="ml-2">
            <Link to={addButtonLink}>
              <IconPlus />
              {addButtonText}
            </Link>
          </Button>
        )}
      </div>

      <div className={['mt-1 flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border', tableClassName ?? ''].filter(Boolean).join(' ')}>
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
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={tableColumns.length} className="h-24 text-center">
                  <div className="inline-flex items-center gap-2 text-muted-foreground">
                    <IconLoader className="size-4 animate-spin" />
                    <span>{loadingMessage}</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className={onRowClick ? "cursor-pointer" : undefined}
                  tabIndex={onRowClick ? 0 : undefined}
                  onClick={() => onRowClick?.(row.original)}
                  onKeyDown={(event) => {
                    if (onRowClick && (event.key === "Enter" || event.key === " ")) {
                      event.preventDefault()
                      onRowClick(row.original)
                    }
                  }}
                >
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
      </div>

      {enablePagination ? (
        <div className="flex items-center justify-between px-4 py-4">
          <div className="hidden flex-1 text-sm text-muted-foreground lg:flex">
            {table.getFilteredRowModel().rows.length} row(s) total.
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


