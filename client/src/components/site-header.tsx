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
  CommandList, CommandShortcut
} from "@/components/ui/command";
import React, { useEffect } from "react";
import { InputGroup, InputGroupAddon, InputGroupInput } from "./ui/input-group";
import { Search } from "lucide-react";
import { useCache } from "#/hooks/use-cache";
import { quickLinks, type quickLink } from "#/lib/common";

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

export function SiteHeader() {
  const { pathname } = useLocation();
  const breadcrumbs = getBreadcrumbs(pathname);
  const [open, setOpen] = React.useState(false);
  const navigate = useNavigate();

  const cache = useCache<string, quickLink>(3, {persitent: true, key: 'links'});

  const handleOnCommandClick = (link: quickLink) => {
    cache?.set(link.path, link);
    setOpen(false);
    navigate({ to: link.path });
  };

  const mostRecentLinks = cache?.getAll() ?? [];

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
        <InputGroup onClick={() => setOpen(true)} className="mr-5">
          <InputGroupInput readOnly placeholder="Search system" />
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
          <InputGroupAddon align="inline-end">Ctrl + /</InputGroupAddon>
        </InputGroup>
        <CommandDialog className="w-full" open={open} onOpenChange={setOpen}>
          <Command>
            <CommandInput placeholder="Type a command or search..." />
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              {mostRecentLinks.length > 0 && 
              (
              <CommandGroup heading="Frequent Visits">
                {mostRecentLinks.map((link) => {
                  const Icon = quickLinks.find(l => l.path === link.path)?.icon;
                  return (
                    <CommandItem
                      key={link.path}
                      value={link.label}
                      onSelect={() => handleOnCommandClick(link)}
                    >
                      {Icon && <Icon />} 
                      <span className="flex-1">{link.label}</span>
                      {link.shortcut && (
                        <CommandShortcut>{link.shortcut}</CommandShortcut>
                      )}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
              )}
              <CommandGroup heading="Quick Links">
                {quickLinks.map((link) => {
                  const Icon = link.icon
                  return (
                    <CommandItem
                      key={link.label}
                      value={link.label}
                      onSelect={() => handleOnCommandClick(link)}
                    >
                      {Icon && <Icon />}
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
