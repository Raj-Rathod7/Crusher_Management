import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { ModeToggle } from "./mode-toggle";
import { NavUser } from "./nav-user";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { Button } from "./ui/button";
import React, { useEffect } from "react";
import { Input } from "./ui/input";
import { InputGroup, InputGroupAddon, InputGroupInput } from "./ui/input-group";
import { HomeIcon, Search, TruckIcon, UserSearch } from "lucide-react";
import { IconChartBar, IconDashboard, IconFolder, IconInvoice, IconListDetails, IconMoneybagMinus, IconMoneybagPlus, IconUsers } from "@tabler/icons-react";

type AppPath = "/" | "/customer" | "/expenses" | "/sales" | "/truck-entry";

type BreadcrumbEntry = {
  label: string;
  to?: AppPath;
};

const user = {
  name: "shadcn",
  email: "m@example.com",
  avatar: "/avatars/shadcn.jpg",
};

function getBreadcrumbs(pathname: string): BreadcrumbEntry[] {
  const sections = [
    { path: "/customer", label: "Customers" },
    { path: "/expenses", label: "Expenses" },
    { path: "/sales", label: "Sales" },
    { path: "/truck-entry", label: "Truck entries" },
  ] as const;

  const section = sections.find(
    ({ path }) => pathname === path || pathname.startsWith(`${path}/`),
  );

  if (!section) {
    return [{ label: "Dashboard" }];
  }

  const crumbs: BreadcrumbEntry[] = [
    { label: "Dashboard", to: "/" },
    { label: section.label, to: section.path },
  ];

  if (pathname.endsWith("/new")) {
    crumbs.push({ label: `New ${section.label.slice(0, -1)}` });
  } else if (pathname.endsWith("/edit")) {
    crumbs.push({ label: `Edit ${section.label.slice(0, -1)}` });
  }

  return crumbs;
}

export const quickLinks = [
  {
    path: "",
    label: "Dashboard",
    shortcut: "F2",
    icon: <IconDashboard />
  },

  {
    path: "/truck-entry",
    label: "Truck Entries",
    shortcut: "F3",
    icon: <IconListDetails />
  },

  {
    path: "/truck-entry/new",
    label: "New Truck Entry",
    shortcut: "F4",
    icon: <TruckIcon />
  },

  {
    path: "/sales",
    label: "Sales",
    shortcut: "F6",
    icon: <IconFolder />
  },

  {
    path: "/sales/new",
    label: "New Sales Entry",
    shortcut: "F7",
    icon: <IconInvoice />
  },

  { path: "/customer", label: "Customers", icon: <IconUsers /> },
  { path: "/customer/new", label: "New Customer", icon: <UserSearch /> },

  { path: "/expenses", label: "Expenses", icon: <IconMoneybagMinus /> },
  { path: "/expenses/new", label: "New Expenses", icon: <IconMoneybagPlus /> },

  { path: "/analytics", label: "Analytics", icon: <IconChartBar /> },
];

export function SiteHeader() {
  const { pathname } = useLocation();
  const breadcrumbs = getBreadcrumbs(pathname);
  const [open, setOpen] = React.useState(false);
  const navigate = useNavigate();

  const handleOnCommandClick = (link: any) => {
    setOpen(false);
    navigate({ to: link.path });
  };

  useEffect(() => {
    const handleCommand = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      
      const isTyping = target &&
                      (["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) ||
                        target.isContentEditable);
      if(isTyping) return;

      if(event.ctrlKey && event.code === "Slash" || event.key === "/"){
        event.preventDefault();
        event.stopImmediatePropagation();
        setOpen((prev) => {
          return !prev
        });
      }
    }
    document.addEventListener('keydown', handleCommand, true);
    return () => {
      document.removeEventListener('keydown', handleCommand, true);
    }
  }, [])

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <Breadcrumb>
          <BreadcrumbList>
            {breadcrumbs.map((breadcrumb, index) => {
              const isCurrentPage = index === breadcrumbs.length - 1;

              return (
                <BreadcrumbItem key={breadcrumb.label}>
                  {isCurrentPage || !breadcrumb.to ? (
                    <BreadcrumbPage>{breadcrumb.label}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink asChild>
                      <Link to={breadcrumb.to}>{breadcrumb.label}</Link>
                    </BreadcrumbLink>
                  )}
                  {!isCurrentPage && <BreadcrumbSeparator />}
                </BreadcrumbItem>
              );
            })}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <div className="flex shrink-0 items-center gap-1 pr-4 lg:pr-6">
        <InputGroup onClick={() => setOpen(true)} className="mr-4">
          <InputGroupInput readOnly placeholder="Search through system" />
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
          <InputGroupAddon align="inline-end">Ctrl + K</InputGroupAddon>
        </InputGroup>
        <CommandDialog className="w-full" open={open} onOpenChange={setOpen}>
          <Command>
            <CommandInput placeholder="Type a command or search..." />
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandGroup heading="Quick Links">
                {quickLinks.map((link) => {
                  return (
                    <CommandItem
                      key={link.label}
                      value={link.label}
                      onSelect={() => handleOnCommandClick(link)}
                    >
                      {link.icon}
                      <span className="flex-1">{link.label}</span>
                      {link.shortcut && (
                        <CommandShortcut>{link.shortcut}</CommandShortcut>
                      )}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </CommandDialog>
        <ModeToggle />
        <NavUser user={user} />
      </div>
    </header>
  );
}
