import { IconBell, IconChartBar, IconDashboard, IconFolder, IconInvoice, IconListDetails, IconMoneybagMinus, IconMoneybagPlus, IconReceipt, IconUsers, type IconProps } from "@tabler/icons-react";
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
    label: "Purchase",
    shortcut: "F3",
    icon: IconListDetails
  },

  {
    path: "/truck-entry/new",
    label: "New Purchase",
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

  { path: "/customer", label: "Customers", shortcut: "alt+shift+c", icon: IconUsers },
  { path: "/customer/new", label: "New Customer", shortcut: "alt+shift+u", icon: UserSearch },

  { path: "/expenses", label: "Expenses/Payments", shortcut: "alt+shift+e", icon: IconMoneybagMinus },
  { path: "/expenses/new", label: "New Expenses/Payments", shortcut: "alt+shift+p", icon: IconMoneybagPlus},

  { path: "/receipt", label: "Receipts", shortcut: "alt+shift+r", icon: IconReceipt },
  { path: "/receipt/new", label: "New Receipt", shortcut: "F8", icon: IconReceipt },

  { path: "/analytics", label: "Analytics", shortcut: "alt+shift+a", icon: IconChartBar },

  { path: "/notification", label: "Notifications", shortcut: "alt+shift+n", icon: IconBell },
];