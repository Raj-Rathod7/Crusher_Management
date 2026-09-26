import { IconBell, IconChartBar, IconDashboard, IconFolder, IconInvoice, IconListDetails, IconMoneybagMinus, IconMoneybagPlus, IconReceipt, IconUsers, type IconProps } from "@tabler/icons-react";
import { TruckIcon, UserSearch, type LucideProps } from "lucide-react";
import type { ForwardRefExoticComponent, RefAttributes } from "react";

export type quickLink = {
  path: string;
  label: string;
  shortcut?: string;
  managerAllowed?: boolean;
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
    managerAllowed: true,
    icon: IconListDetails
  },

  {
    path: "/truck-entry/new",
    label: "New Purchase",
    shortcut: "F4",
    managerAllowed: true,
    icon: TruckIcon
  },

  {
    path: "/sales",
    label: "Sales",
    shortcut: "F6",
    managerAllowed: true,
    icon: IconFolder 
  },

  {
    path: "/sales/new",
    label: "New Sales Entry",
    shortcut: "F7",
    managerAllowed: true,
    icon: IconInvoice
  },

  { path: "/customer", label: "Customers", shortcut: "alt+shift+c", icon: IconUsers },
  { path: "/customer/new", label: "New Customer", shortcut: "alt+shift+u", managerAllowed: true, icon: UserSearch },

  { path: "/expenses", label: "Expenses/Payments", shortcut: "alt+shift+e", managerAllowed: true, icon: IconMoneybagMinus },
  { path: "/expenses/new", label: "New Expenses/Payments", shortcut: "alt+shift+p", managerAllowed: true, icon: IconMoneybagPlus},

  { path: "/receipt", label: "Receipts", shortcut: "alt+shift+r", managerAllowed: true, icon: IconReceipt },
  { path: "/receipt/new", label: "New Receipt", shortcut: "F8", managerAllowed: true, icon: IconReceipt },

  { path: "/analytics", label: "Analytics", shortcut: "alt+shift+a", icon: IconChartBar },

  { path: "/notification", label: "Notifications", shortcut: "alt+shift+n", icon: IconBell },
];

const managerPathPattern = /^\/(sales|truck-entry|expenses|receipt)(\/(new|\d+))?\/?$|^\/customer\/new\/?$/;

export function isManagerPath(pathname: string): boolean {
  return managerPathPattern.test(pathname);
}

export function getQuickLinks(manager: boolean): quickLink[] {
  return manager ? quickLinks.filter((link) => link.managerAllowed) : quickLinks;
}