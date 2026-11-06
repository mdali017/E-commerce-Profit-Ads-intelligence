"use client";

import { useState, useEffect } from "react";
import { crmApi } from "@/lib/crm";
import {
  Customer,
  CustomerDetail,
  CRMKPIStats,
  SMSGateway,
  SMSAutomationRule,
  SMSMessageLog,
  ConfigureSMSGatewayPayload,
  TestSendSMSPayload,
} from "@/types";
import { CRMStats } from "@/components/crm/CRMStats";
import { CustomerTable } from "@/components/crm/CustomerTable";
import { CustomerDetailDrawer } from "@/components/crm/CustomerDetailDrawer";
import { SMSGatewayModal } from "@/components/crm/SMSGatewayModal";
import { TestSMSModal } from "@/components/crm/TestSMSModal";
import {
  Users,
  MessageSquare,
  Server,
  Send,
  Zap,
  RefreshCw,
  Plus,
  CheckCircle2,
  Clock,
  Sparkles,
} from "lucide-react";

export default function CRMPage() {
  const [activeTab, setActiveTab] = useState<"customers" | "sms_automation">("customers");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [kpis, setKpis] = useState<CRMKPIStats | null>(null);
  const [gateway, setGateway] = useState<SMSGateway | null>(null);
  const [rules, setRules] = useState<SMSAutomationRule[]>([]);
  const [logs, setLogs] = useState<SMSMessageLog[]>([]);

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [segmentFilter, setSegmentFilter] = useState("all");

  // Drawers and Modals
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [customerDetail, setCustomerDetail] = useState<CustomerDetail | null>(null);
  const [isGatewayModalOpen, setIsGatewayModalOpen] = useState(false);
  const [isTestSMSModalOpen, setIsTestSMSModalOpen] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [custList, kpiRes, gwRes, ruleList, logList] = await Promise.all([
        crmApi.getCustomers(search, segmentFilter),
        crmApi.getCRMKPIs(),
        crmApi.getSMSGateway(),
        crmApi.getAutomationRules(),
        crmApi.getSMSLogs(),
      ]);
      setCustomers(custList);
      setKpis(kpiRes);
      setGateway(gwRes);
      setRules(ruleList);
      setLogs(logList);
    } catch (err: any) {
      console.error("Failed to load CRM data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [segmentFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const handleOpenCustomer = async (customer: Customer) => {
    setSelectedCustomerId(customer.id);
    try {
      const detail = await crmApi.getCustomerDetail(customer.id);
      setCustomerDetail(detail);
    } catch (err) {
      console.error("Failed to fetch customer detail", err);
    }
  };

  const handleUpdateCustomer = async (
    customerId: string,
    tags: string[],
    notes: string
  ) => {
    await crmApi.updateCustomer(customerId, { tags, notes });
    const detail = await crmApi.getCustomerDetail(customerId);
    setCustomerDetail(detail);
    loadData();
  };

  const handleSaveGateway = async (payload: ConfigureSMSGatewayPayload) => {
    const updated = await crmApi.configureSMSGateway(payload);
    setGateway(updated);
  };

  const handleTestSendSMS = async (payload: TestSendSMSPayload) => {
    const res = await crmApi.testSendSMS(payload);
    // Reload logs & KPIs
    const [logList, kpiRes] = await Promise.all([crmApi.getSMSLogs(), crmApi.getCRMKPIs()]);
    setLogs(logList);
    setKpis(kpiRes);
    return res;
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Customer CRM & SMS Automation
            </h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              <Sparkles className="w-3 h-3 mr-1" />
              Intelligence Engine
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track customer lifetime value, detect high return risk COD buyers, and automate post-delivery review SMS.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsTestSMSModalOpen(true)}
            className="inline-flex items-center px-3.5 py-2 text-xs font-semibold rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors shadow-sm"
          >
            <Send className="w-3.5 h-3.5 mr-1.5 text-blue-500" />
            Test SMS
          </button>

          <button
            onClick={() => setIsGatewayModalOpen(true)}
            className="inline-flex items-center px-3.5 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-sm"
          >
            <Server className="w-3.5 h-3.5 mr-1.5" />
            SMS Gateway Config
          </button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <CRMStats stats={kpis} />

      {/* Primary Tab Switcher */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab("customers")}
          className={`flex items-center space-x-2 pb-3 px-4 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === "customers"
              ? "border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Customer Directory & Segments ({customers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("sms_automation")}
          className={`flex items-center space-x-2 pb-3 px-4 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === "sms_automation"
              ? "border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>SMS Gateway & Trigger Automations ({rules.length})</span>
        </button>
      </div>

      {/* Tab 1: Customers */}
      {activeTab === "customers" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <input
                type="text"
                placeholder="Search by customer name or phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && loadData()}
                className="w-full px-3.5 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div className="flex items-center space-x-1.5 self-start sm:self-auto overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
              {["all", "vip", "repeat", "new", "at_risk"].map((seg) => (
                <button
                  key={seg}
                  onClick={() => setSegmentFilter(seg)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize whitespace-nowrap transition-colors ${
                    segmentFilter === seg
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850"
                  }`}
                >
                  {seg === "at_risk" ? "High Risk" : seg}
                </button>
              ))}
            </div>
          </div>
          <CustomerTable
            customers={customers}
            onSelectCustomer={handleOpenCustomer}
          />
        </div>
      )}

      {/* Tab 2: SMS Automation & Gateway */}
      {activeTab === "sms_automation" && (
        <div className="space-y-6">
          {/* Active Gateway Status Banner */}
          <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Server className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-bold text-slate-900 dark:text-white capitalize">
                    {gateway?.provider ? `${gateway.provider} Gateway` : "Simulated BD Gateway"}
                  </h3>
                  <span
                    className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                      gateway?.is_active
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                        : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                    }`}
                  >
                    {gateway?.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Sender Masking ID: <span className="font-mono">{gateway?.sender_id || "PROFITPULSE (Default)"}</span> • Non-masking fallback enabled
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsGatewayModalOpen(true)}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Change Provider
              </button>
              <button
                onClick={() => setIsTestSMSModalOpen(true)}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              >
                Send Test
              </button>
            </div>
          </div>

          {/* Automated Event Rules Section */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <span>Delivery-Triggered SMS Automations</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Automated dispatches fired immediately when Steadfast/Pathao courier confirms delivery.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {rules.map((r) => (
                <div
                  key={r.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-slate-900 dark:text-white">
                      {r.name}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        r.is_active
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                          : "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                      }`}
                    >
                      {r.is_active ? "Automated" : "Disabled"}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 font-mono bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
                    {r.template_text}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span className="flex items-center">
                      <Clock className="w-3.5 h-3.5 mr-1" />
                      Delay: {r.delay_minutes} min after {r.trigger_event.replace("_", " ")}
                    </span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                      Variables: {"{{customer_name}}"}, {"{{order_id}}"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Live SMS Audit Dispatches Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <MessageSquare className="w-4 h-4 text-emerald-500" />
                <span>SMS Dispatches Audit Log</span>
              </h3>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Total: {logs.length} messages
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 uppercase font-semibold text-slate-500">
                  <tr>
                    <th className="py-3 px-4">Recipient</th>
                    <th className="py-3 px-4">Trigger Event</th>
                    <th className="py-3 px-4">Message Body</th>
                    <th className="py-3 px-4">Provider</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Cost (BDT)</th>
                    <th className="py-3 px-4">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {logs.length > 0 ? (
                    logs.map((log) => (
                      <tr
                        key={log.id}
                        className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        <td className="py-3 px-4 font-mono font-medium text-slate-900 dark:text-white">
                          {log.recipient_phone}
                        </td>
                        <td className="py-3 px-4 capitalize text-slate-700 dark:text-slate-300">
                          {(log.trigger_event || "manual").replace("_", " ")}
                        </td>
                        <td className="py-3 px-4 max-w-xs truncate text-slate-600 dark:text-slate-400 font-mono">
                          {log.message_body || log.message}
                        </td>
                        <td className="py-3 px-4 uppercase text-slate-500 font-medium">
                          {log.provider}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              log.status === "delivered"
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                                : log.status === "sent"
                                ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                                : "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                            }`}
                          >
                            {log.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                          ৳{log.cost ?? log.cost_bdt ?? 0}
                        </td>
                        <td className="py-3 px-4 text-slate-400">
                          {new Date(log.sent_at || log.created_at || "").toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        No SMS dispatches logged yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modals & Drawers */}
      <CustomerDetailDrawer
        customer={customerDetail}
        isOpen={!!selectedCustomerId}
        onClose={() => {
          setSelectedCustomerId(null);
          setCustomerDetail(null);
        }}
        onUpdateTags={handleUpdateCustomer}
      />

      <SMSGatewayModal
        isOpen={isGatewayModalOpen}
        onClose={() => setIsGatewayModalOpen(false)}
        gateway={gateway}
        onSave={handleSaveGateway}
      />

      <TestSMSModal
        isOpen={isTestSMSModalOpen}
        onClose={() => setIsTestSMSModalOpen(false)}
        onSend={handleTestSendSMS}
      />
    </div>
  );
}
