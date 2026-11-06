import { apiClient } from "./api";
import {
  Customer,
  CustomerDetail,
  CustomerRecentOrder,
  SMSMessageLog,
  CRMKPIStats,
  SMSGateway,
  ConfigureSMSGatewayPayload,
  SMSAutomationRule,
  AutomationRuleCreatePayload,
  TestSendSMSPayload,
} from "@/types";

export const crmApi = {
  async getCustomers(search?: string, segment?: string): Promise<Customer[]> {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (segment && segment !== "all") params.set("segment", segment);

    const query = params.toString() ? `?${params.toString()}` : "";
    return apiClient<Customer[]>(`/crm/customers${query}`, {
      requiresTenant: true,
    });
  },

  async getCustomerDetail(customerId: string): Promise<CustomerDetail> {
    return apiClient<CustomerDetail>(`/crm/customers/${customerId}`, {
      requiresTenant: true,
    });
  },

  async updateCustomer(
    customerId: string,
    payload: { tags?: string[]; notes?: string; opted_out_marketing?: boolean }
  ): Promise<Customer> {
    return apiClient<Customer>(`/crm/customers/${customerId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
      requiresTenant: true,
    });
  },

  async getCRMKPIs(): Promise<CRMKPIStats> {
    return apiClient<CRMKPIStats>("/crm/stats/kpis", {
      requiresTenant: true,
    });
  },

  async getSMSGateway(): Promise<SMSGateway> {
    return apiClient<SMSGateway>("/crm/sms/gateway", {
      requiresTenant: true,
    });
  },

  async configureSMSGateway(
    payload: ConfigureSMSGatewayPayload
  ): Promise<SMSGateway> {
    return apiClient<SMSGateway>("/crm/sms/gateway", {
      method: "POST",
      body: JSON.stringify(payload),
      requiresTenant: true,
    });
  },

  async getAutomationRules(): Promise<SMSAutomationRule[]> {
    return apiClient<SMSAutomationRule[]>("/crm/sms/rules", {
      requiresTenant: true,
    });
  },

  async createAutomationRule(
    payload: AutomationRuleCreatePayload
  ): Promise<SMSAutomationRule> {
    return apiClient<SMSAutomationRule>("/crm/sms/rules", {
      method: "POST",
      body: JSON.stringify(payload),
      requiresTenant: true,
    });
  },

  async testSendSMS(
    payload: TestSendSMSPayload
  ): Promise<{ success: boolean; status: string; provider_ref?: string; sms_count: number }> {
    return apiClient<{ success: boolean; status: string; provider_ref?: string; sms_count: number }>(
      "/crm/sms/test-send",
      {
        method: "POST",
        body: JSON.stringify(payload),
        requiresTenant: true,
      }
    );
  },

  async getSMSLogs(): Promise<SMSMessageLog[]> {
    return apiClient<SMSMessageLog[]>("/crm/sms/logs", {
      requiresTenant: true,
    });
  },
};

