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
import { IconDashboard, IconListDetails, IconChartBar, IconFolder, IconUsers, IconInnerShadowTop, IconMoneybagMinus, IconNotification } from "@tabler/icons-react"
import { useLocation } from "@tanstack/react-router"
import { isManager } from "#/lib/common/api"

const data: { navMain: { title: string; url: string; icon: React.ReactNode; managerAllowed?: boolean }[] } = {
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
      title: "Purchase",
      url: "/truck-entry",
      managerAllowed: true,
      icon: (
        <IconListDetails
        />
      ),
    },
    {
      title: "Sales",
      url: "/sales",
      managerAllowed: true,
      icon: (
        <IconFolder
        />
      ),
    },
    {
      title: "Receipt",
      url: "/receipt",
      managerAllowed: true,
      icon: (
        <IconChartBar />
      )
    },
    {
      title: "Customers",
      url: "/customer",
      icon: (
        <IconUsers />
      )
    },
    
    {
      title: "Expenses/Payments",
      url: "/expenses",
      managerAllowed: true,
      icon: (
        <IconMoneybagMinus
        />
      ),
    },
    {
      title: "Notifications",
      url: "/notification",
      icon: (
        <IconNotification />
      )
    }
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
        <NavMain
          items={isManager() ? data.navMain.filter((item) => item.managerAllowed) : data.navMain}
          activeRoute={location.pathname}
        />
      </SidebarContent>
    </Sidebar>
  )
}
