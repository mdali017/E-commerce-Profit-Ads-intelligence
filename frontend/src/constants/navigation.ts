import {
  LayoutDashboard,
  Megaphone,
  ShoppingBag,
  Truck,
  Package,
  TrendingUp,
  Users,
  Settings,
} from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

export const MAIN_NAVIGATION: NavItem[] = [
  {
    title: "Executive Overview",
    href: "/overview",
    icon: LayoutDashboard,
  },
  {
    title: "Meta Ads & ROAS",
    href: "/ads",
    icon: Megaphone,
  },
  {
    title: "Orders & Ingestion",
    href: "/orders",
    icon: ShoppingBag,
  },
  {
    title: "Courier Tracking",
    href: "/couriers",
    icon: Truck,
  },
  {
    title: "Products & COGS",
    href: "/products",
    icon: Package,
  },
  {
    title: "P&L Financials",
    href: "/pnl",
    icon: TrendingUp,
  },
  {
    title: "Customer CRM",
    href: "/crm",
    icon: Users,
  },
  {
    title: "Workspace Settings",
    href: "/settings",
    icon: Settings,
  },
];

