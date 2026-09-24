import * as React from "react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import type {
  ExpenseCategoryPoint,
  InwardPoint,
  MaterialSalesPoint,
  SalesPoint,
} from "@/lib/models"

const PIE_COLORS = [
  "var(--color-chart-1, oklch(0.65 0.2 40))",
  "var(--color-chart-2, oklch(0.6 0.15 180))",
  "var(--color-chart-3, oklch(0.55 0.2 260))",
  "var(--color-chart-4, oklch(0.75 0.18 90))",
  "var(--color-chart-5, oklch(0.6 0.22 20))",
]

function shortDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  })
}

function EmptyState({ message }: Readonly<{ message: string }>) {
  return (
    <div className="flex aspect-video items-center justify-center text-sm text-muted-foreground">
      {message}
    </div>
  )
}

function ChartCard({
  description,
  title,
  children,
}: Readonly<{ description: string; title: string; children: React.ReactNode }>) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>{description}</CardDescription>
        <CardTitle className="text-xl">{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

export function SalesTrendChart({ data }: Readonly<{ data: SalesPoint[] }>) {
  const config = {
    totalAmount: { label: "Sales amount", color: "var(--primary)" },
  } satisfies ChartConfig

  if (data.length === 0) {
    return (
      <ChartCard description="Billings over time" title="Sales trend">
        <EmptyState message="No invoices in this range." />
      </ChartCard>
    )
  }

  return (
    <ChartCard description="Billings over time" title="Sales trend">
      <ChartContainer config={config}>
        <AreaChart data={data} margin={{ left: 4, right: 4 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="date" tickFormatter={shortDate} tickLine={false} axisLine={false} />
          <YAxis tickLine={false} axisLine={false} width={48} />
          <ChartTooltip
            content={
              <ChartTooltipContent
                labelFormatter={(_, payload) =>
                  payload?.[0]?.payload?.date ? shortDate(payload[0].payload.date) : ""
                }
              />
            }
          />
          <Area
            dataKey="totalAmount"
            type="monotone"
            fill="var(--color-totalAmount)"
            fillOpacity={0.2}
            stroke="var(--color-totalAmount)"
          />
        </AreaChart>
      </ChartContainer>
    </ChartCard>
  )
}

export function ExpenseCategoryChart({ data }: Readonly<{ data: ExpenseCategoryPoint[] }>) {
  const config = {
    totalAmount: { label: "Amount spent", color: "var(--destructive)" },
  } satisfies ChartConfig

  if (data.length === 0) {
    return (
      <ChartCard description="Operational spend split" title="Expenses by category">
        <EmptyState message="No expenses in this range." />
      </ChartCard>
    )
  }

  return (
    <ChartCard description="Operational spend split" title="Expenses by category">
      <ChartContainer config={config}>
        <BarChart data={data} layout="vertical" margin={{ left: 4, right: 4 }}>
          <CartesianGrid horizontal={false} />
          <XAxis type="number" tickLine={false} axisLine={false} />
          <YAxis
            dataKey="category"
            type="category"
            tickLine={false}
            axisLine={false}
            width={100}
          />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Bar dataKey="totalAmount" fill="var(--color-totalAmount)" radius={4} />
        </BarChart>
      </ChartContainer>
    </ChartCard>
  )
}

export function TruckInwardChart({ data }: Readonly<{ data: InwardPoint[] }>) {
  const config = {
    totalQtyBrass: { label: "Qty (brass)", color: "var(--chart-2, var(--primary))" },
  } satisfies ChartConfig

  if (data.length === 0) {
    return (
      <ChartCard description="Incoming material volume" title="Truck inward volume">
        <EmptyState message="No truck entries in this range." />
      </ChartCard>
    )
  }

  return (
    <ChartCard description="Incoming material volume" title="Truck inward volume">
      <ChartContainer config={config}>
        <BarChart data={data} margin={{ left: 4, right: 4 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="date" tickFormatter={shortDate} tickLine={false} axisLine={false} />
          <YAxis tickLine={false} axisLine={false} width={48} />
          <ChartTooltip
            content={
              <ChartTooltipContent
                labelFormatter={(_, payload) =>
                  payload?.[0]?.payload?.date ? shortDate(payload[0].payload.date) : ""
                }
              />
            }
          />
          <Bar dataKey="totalQtyBrass" fill="var(--color-totalQtyBrass)" radius={4} />
        </BarChart>
      </ChartContainer>
    </ChartCard>
  )
}

export function MaterialSalesChart({ data }: Readonly<{ data: MaterialSalesPoint[] }>) {
  const config = Object.fromEntries(
    data.map((point, index) => [
      point.material,
      { label: point.material, color: PIE_COLORS[index % PIE_COLORS.length] },
    ]),
  ) satisfies ChartConfig

  if (data.length === 0) {
    return (
      <ChartCard description="Revenue by material" title="Material-wise sales">
        <EmptyState message="No material sales in this range." />
      </ChartCard>
    )
  }

  return (
    <ChartCard description="Revenue by material" title="Material-wise sales">
      <ChartContainer config={config}>
        <PieChart>
          <ChartTooltip content={<ChartTooltipContent nameKey="material" hideLabel />} />
          <Pie
            data={data}
            dataKey="totalRevenue"
            nameKey="material"
            innerRadius={50}
            outerRadius={80}
            strokeWidth={2}
          >
            {data.map((point, index) => (
              <Cell key={point.material} fill={PIE_COLORS[index % PIE_COLORS.length]} />
            ))}
          </Pie>
          <ChartLegend content={<ChartLegendContent nameKey="material" />} />
        </PieChart>
      </ChartContainer>
    </ChartCard>
  )
}
