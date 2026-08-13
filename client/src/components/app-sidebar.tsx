import * as React from "react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { IconDashboard, IconListDetails, IconChartBar, IconFolder, IconUsers, IconInnerShadowTop } from "@tabler/icons-react"
import { useLocation } from "@tanstack/react-router"

const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
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
      title: "Workers",
      url: "#",
      icon: (
        <IconUsers
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
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
