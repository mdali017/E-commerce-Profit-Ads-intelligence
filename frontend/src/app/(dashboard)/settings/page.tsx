export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Workspace Settings & Integrations
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Manage integrations (Meta, WooCommerce, Courier APIs), roles, and currency settings.
        </p>
      </div>
      <div className="p-8 border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl text-center bg-white dark:bg-slate-900/40">
        <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
          SaaS Workspace Management
        </span>
        <p className="text-xs text-slate-400 mt-1">
          Configured with Multi-Tenancy support in Unit 1.
        </p>
      </div>
    </div>
  );
}

