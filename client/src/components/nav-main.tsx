import { cn } from "#/lib/utils";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Link } from "@tanstack/react-router";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

type NavItem = {
  title: string;
  url: string;
  icon?: React.ReactNode;
};

export function NavMain({
  items,
  activeRoute,
}: {
  items: NavItem[];
  activeRoute?: string;
}) {
  const indicatorRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLLIElement | null)[]>([]);
  const [animate, setAnimate] = useState(false);

  useLayoutEffect(() => {
    if (!activeRoute) return;

    const activeIndex = items.findIndex((item) => item.url === activeRoute);

    if (activeIndex === -1) return;

    const activeItem = itemRefs.current[activeIndex];
    const indicator = indicatorRef.current;

    if (!activeItem || !indicator) return;

    
    requestAnimationFrame(() => {
      indicator.style.transform = `translateY(${activeItem.offsetTop}px)`;
      indicator.style.height = `${activeItem.offsetHeight}px`;

      if(!animate) {
        setAnimate(true);
      }
    });
  }, [activeRoute, items]);

  return (
    <SidebarGroup>
      <SidebarGroupContent className="relative">
        {/* Animated Background */}
        <div
          ref={indicatorRef}
          className={cn("absolute left-0 w-full rounded-md dark:bg-primary bg-neutral-300 transition-all duration-300 ease-in-out", animate ? "opacity-100" : "opacity-0")}
        />

        <SidebarMenu>
          {items.map((item, index) => (
            <SidebarMenuItem
              key={item.title}
              ref={(el) => {
                itemRefs.current[index] = el;
              }}
            >
              <Link to={item.url} replace>
                <SidebarMenuButton
                  tooltip={item.title}
                  className="relative z-10 hover:bg-transparent hover:font-semibold"
                >
                  {item.icon}
                  <span>{item.title}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}