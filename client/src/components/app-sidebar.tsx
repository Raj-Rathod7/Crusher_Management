import * as React from "react"

import { NavMain } from "@/components/nav-main"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { IconDashboard, IconListDetails, IconChartBar, IconFolder, IconUsers, IconInnerShadowTop, IconMoneybagMinus } from "@tabler/icons-react"
import { useLocation } from "@tanstack/react-router"

const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/",
      icon: (
        <IconDashboard
        />
      ),
    },
    {
      title: "Truck Entries",
      url: "/truck-entry",
      icon: (
        <IconListDetails
        />
      ),
    },
    {
      title: "Sales",
      url: "/sales",
      icon: (
        <IconFolder
        />
      ),
    },
    {
      title: "Customers",
      url: "/customer",
      icon: (
        <IconUsers />
      )
    },
    {
      title: "Analytics",
      url: "#",
      icon: (
        <IconChartBar
        />
      ),
    },
    
    {
      title: "Expenses",
      url: "/expenses",
      icon: (
        <IconMoneybagMinus
        />
      ),
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const location = useLocation();
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:p-1.5!"
            >
              <a href="/">
                <IconInnerShadowTop className="size-5!" />
                <span className="text-base font-semibold">Vaibhav Stone Crusher</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} activeRoute={location.pathname} />
      </SidebarContent>
    </Sidebar>
  )
}
