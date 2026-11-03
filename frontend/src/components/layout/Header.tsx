"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, ChevronDown, Bell, LogOut, Check } from "lucide-react";
import { authStorage, UserProfile } from "@/lib/auth";
import { apiClient } from "@/lib/api";

interface WorkspaceItem {
  id: string;
  name: string;
  currency: string;
  role: string;
}

export function Header() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [workspaces, setWorkspaces] = useState<WorkspaceItem[]>([]);
  const [activeTenantId, setActiveTenantId] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  useEffect(() => {
    const currentUser = authStorage.getUser();
    setUser(currentUser);

    const tenantId = authStorage.getActiveTenantId();
    setActiveTenantId(tenantId);

    // Fetch user workspaces
    const token = authStorage.getToken();
    if (token) {
      apiClient<
        Array<{
          id: string;
          tenant_id: string;
          role: string;
          tenant: { id: string; name: string; currency: string };
        }>
      >("/workspaces/me", { method: "GET" })
        .then((memberships) => {
          const list = memberships.map((m) => ({
            id: m.tenant_id,
            name: m.tenant.name,
            currency: m.tenant.currency,
            role: m.role,
          }));
          setWorkspaces(list);

          if (!tenantId && list.length > 0) {
            authStorage.setActiveTenantId(list[0].id);
            setActiveTenantId(list[0].id);
          }
        })
        .catch(() => {
          // Fallback if not yet logged in or backend offline
        });
    }
  }, []);

  const handleSelectWorkspace = (id: string) => {
    authStorage.setActiveTenantId(id);
    setActiveTenantId(id);
    setIsDropdownOpen(false);
    window.location.reload();
  };

  const handleLogout = () => {
    authStorage.clearAuth();
    router.push("/login");
  };

  const activeWorkspace = workspaces.find((w) => w.id === activeTenantId) || {
    id: "default",
    name: "My E-commerce Store",
    currency: "BDT",
    role: "Owner",
  };

  const userInitials = (user?.full_name || "EO")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md px-8 flex items-center justify-between sticky top-0 z-20">
      {/* Workspace Selector Dropdown */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <Building2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>{activeWorkspace.name}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-medium">
            {activeWorkspace.currency}
          </span>
          <ChevronDown className="w-3 h-3 text-slate-400" />
        </button>

        {isDropdownOpen && (
          <div className="absolute left-0 mt-2 w-64 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl py-1.5 z-50">
            <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Switch Workspace
            </div>
            {workspaces.length === 0 ? (
              <div className="px-3 py-2 text-xs text-slate-500">
                Single workspace mode
              </div>
            ) : (
              workspaces.map((ws) => (
                <button
                  key={ws.id}
                  onClick={() => handleSelectWorkspace(ws.id)}
                  className="w-full px-3 py-2 text-left text-xs flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
                      {ws.name}
                    </span>
                  </div>
                  {ws.id === activeTenantId && (
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  )}
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Notifications"
          className="w-9 h-9 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
        >
          <Bell className="w-4 h-4" />
        </button>

        <div className="h-6 w-px bg-slate-200 dark:bg-slate-800" />

        {/* User Profile & Logout */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-2.5 pl-1 cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shadow-xs">
              {userInitials}
            </div>
            <div className="hidden sm:block text-left">
              <span className="block text-xs font-semibold text-slate-900 dark:text-slate-100 leading-tight">
                {user?.full_name || "Ecom Owner"}
              </span>
              <span className="block text-[11px] text-slate-500 font-medium leading-tight capitalize">
                {activeWorkspace.role || "Owner"}
              </span>
            </div>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {isUserMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl py-1 z-50">
              <div className="px-3.5 py-2 border-b border-slate-100 dark:border-slate-800">
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                  {user?.full_name || "Ecom Owner"}
                </div>
                <div className="text-[11px] text-slate-400 truncate">
                  {user?.email || "owner@brand.com"}
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full px-3.5 py-2 text-left text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-2 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
