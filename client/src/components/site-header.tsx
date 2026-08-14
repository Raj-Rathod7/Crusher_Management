import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Link, useLocation } from "@tanstack/react-router"
import { ModeToggle } from "./mode-toggle"
import { NavUser } from "./nav-user"

type AppPath = "/" | "/customer" | "/expenses" | "/sales" | "/truck-entry"

type BreadcrumbEntry = {
  label: string
  to?: AppPath
}

const user = {
  name: "shadcn",
  email: "m@example.com",
  avatar: "/avatars/shadcn.jpg",
}

function getBreadcrumbs(pathname: string): BreadcrumbEntry[] {
  const sections = [
    { path: "/customer", label: "Customers" },
    { path: "/expenses", label: "Expenses" },
    { path: "/sales", label: "Sales" },
    { path: "/truck-entry", label: "Truck entries" },
  ] as const

  const section = sections.find(({ path }) => pathname === path || pathname.startsWith(`${path}/`))

  if (!section) {
    return [{ label: "Dashboard" }]
  }

  const crumbs: BreadcrumbEntry[] = [
    { label: "Dashboard", to: "/" },
    { label: section.label, to: section.path },
  ]

  if (pathname.endsWith("/new")) {
    crumbs.push({ label: `New ${section.label.slice(0, -1)}` })
  } else if (pathname.endsWith("/edit")) {
    crumbs.push({ label: `Edit ${section.label.slice(0, -1)}` })
  }

  return crumbs
}

export function SiteHeader() {
  const { pathname } = useLocation()
  const breadcrumbs = getBreadcrumbs(pathname)

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
              const isCurrentPage = index === breadcrumbs.length - 1

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
              )
            })}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <div className="flex shrink-0 items-center gap-1 pr-4 lg:pr-6">
        <ModeToggle />
        <NavUser user={user} />
      </div>
    </header>
  )
}
