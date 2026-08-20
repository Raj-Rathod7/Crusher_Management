import { IconChartBar, IconDashboard, IconFolder, IconInvoice, IconListDetails, IconMoneybagMinus, IconMoneybagPlus, IconUsers, type IconProps } from "@tabler/icons-react";
import { TruckIcon, UserSearch, type LucideProps } from "lucide-react";
import type { ForwardRefExoticComponent, RefAttributes } from "react";

export type quickLink = {
  path: string;
  label: string;
  shortcut?: string;
  icon?: ForwardRefExoticComponent<IconProps & RefAttributes<SVGSVGElement>> | ForwardRefExoticComponent<Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>>
}

export const quickLinks: quickLink[] = [
  {
    path: "",
    label: "Dashboard",
    shortcut: "F2",
    icon: IconDashboard
  },

  {
    path: "/truck-entry",
    label: "Truck Entries",
    shortcut: "F3",
    icon: IconListDetails
  },

  {
    path: "/truck-entry/new",
    label: "New Truck Entry",
    shortcut: "F4",
    icon: TruckIcon
  },

  {
    path: "/sales",
    label: "Sales",
    shortcut: "F6",
    icon: IconFolder 
  },

  {
    path: "/sales/new",
    label: "New Sales Entry",
    shortcut: "F7",
    icon: IconInvoice
  },

  { path: "/customer", label: "Customers", icon: IconUsers },
  { path: "/customer/new", label: "New Customer", icon: UserSearch },

  { path: "/expenses", label: "Expenses", icon: IconMoneybagMinus },
  { path: "/expenses/new", label: "New Expenses", icon: IconMoneybagPlus},

  { path: "/analytics", label: "Analytics", icon: IconChartBar },
];