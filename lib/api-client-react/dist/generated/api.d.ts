import type { QueryKey, UseMutationOptions, UseMutationResult, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import type { BackupData, Customer, CustomerInput, CustomerProfile, CustomerUpdate, DashboardStats, HealthStatus, ImportResult, Invoice, InvoiceInput, InvoiceUpdate, Job, JobInput, JobUpdate, ListCustomersParams, ListInvoicesParams, ListJobsParams, PinVerify, PinVerifyResult, Settings, SettingsUpdate } from './api.schemas';
import { customFetch } from '../custom-fetch';
import type { ErrorType, BodyType } from '../custom-fetch';
type AwaitedInput<T> = PromiseLike<T> | T;
type Awaited<O> = O extends AwaitedInput<infer T> ? T : never;
type SecondParameter<T extends (...args: never) => unknown> = Parameters<T>[1];
export declare const getHealthCheckUrl: () => string;
/**
 * Returns server health status
 * @summary Health check
 */
export declare const healthCheck: (options?: RequestInit) => Promise<HealthStatus>;
export declare const getHealthCheckQueryKey: () => readonly ["/api/healthz"];
export declare const getHealthCheckQueryOptions: <TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData> & {
    queryKey: QueryKey;
};
export type HealthCheckQueryResult = NonNullable<Awaited<ReturnType<typeof healthCheck>>>;
export type HealthCheckQueryError = ErrorType<unknown>;
/**
 * @summary Health check
 */
export declare function useHealthCheck<TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getListCustomersUrl: (params?: ListCustomersParams) => string;
/**
 * @summary List all customers
 */
export declare const listCustomers: (params?: ListCustomersParams, options?: RequestInit) => Promise<Customer[]>;
export declare const getListCustomersQueryKey: (params?: ListCustomersParams) => readonly ["/api/customers", ...ListCustomersParams[]];
export declare const getListCustomersQueryOptions: <TData = Awaited<ReturnType<typeof listCustomers>>, TError = ErrorType<unknown>>(params?: ListCustomersParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listCustomers>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listCustomers>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListCustomersQueryResult = NonNullable<Awaited<ReturnType<typeof listCustomers>>>;
export type ListCustomersQueryError = ErrorType<unknown>;
/**
 * @summary List all customers
 */
export declare function useListCustomers<TData = Awaited<ReturnType<typeof listCustomers>>, TError = ErrorType<unknown>>(params?: ListCustomersParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listCustomers>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getCreateCustomerUrl: () => string;
/**
 * @summary Create a new customer
 */
export declare const createCustomer: (customerInput: CustomerInput, options?: RequestInit) => Promise<Customer>;
export declare const getCreateCustomerMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createCustomer>>, TError, {
        data: BodyType<CustomerInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createCustomer>>, TError, {
    data: BodyType<CustomerInput>;
}, TContext>;
export type CreateCustomerMutationResult = NonNullable<Awaited<ReturnType<typeof createCustomer>>>;
export type CreateCustomerMutationBody = BodyType<CustomerInput>;
export type CreateCustomerMutationError = ErrorType<unknown>;
/**
* @summary Create a new customer
*/
export declare const useCreateCustomer: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createCustomer>>, TError, {
        data: BodyType<CustomerInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createCustomer>>, TError, {
    data: BodyType<CustomerInput>;
}, TContext>;
export declare const getGetCustomerUrl: (id: number) => string;
/**
 * @summary Get customer by ID
 */
export declare const getCustomer: (id: number, options?: RequestInit) => Promise<Customer>;
export declare const getGetCustomerQueryKey: (id: number) => readonly [`/api/customers/${number}`];
export declare const getGetCustomerQueryOptions: <TData = Awaited<ReturnType<typeof getCustomer>>, TError = ErrorType<void>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getCustomer>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getCustomer>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetCustomerQueryResult = NonNullable<Awaited<ReturnType<typeof getCustomer>>>;
export type GetCustomerQueryError = ErrorType<void>;
/**
 * @summary Get customer by ID
 */
export declare function useGetCustomer<TData = Awaited<ReturnType<typeof getCustomer>>, TError = ErrorType<void>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getCustomer>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getUpdateCustomerUrl: (id: number) => string;
/**
 * @summary Update a customer
 */
export declare const updateCustomer: (id: number, customerUpdate: CustomerUpdate, options?: RequestInit) => Promise<Customer>;
export declare const getUpdateCustomerMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateCustomer>>, TError, {
        id: number;
        data: BodyType<CustomerUpdate>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateCustomer>>, TError, {
    id: number;
    data: BodyType<CustomerUpdate>;
}, TContext>;
export type UpdateCustomerMutationResult = NonNullable<Awaited<ReturnType<typeof updateCustomer>>>;
export type UpdateCustomerMutationBody = BodyType<CustomerUpdate>;
export type UpdateCustomerMutationError = ErrorType<unknown>;
/**
* @summary Update a customer
*/
export declare const useUpdateCustomer: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateCustomer>>, TError, {
        id: number;
        data: BodyType<CustomerUpdate>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateCustomer>>, TError, {
    id: number;
    data: BodyType<CustomerUpdate>;
}, TContext>;
export declare const getDeleteCustomerUrl: (id: number) => string;
/**
 * @summary Delete a customer
 */
export declare const deleteCustomer: (id: number, options?: RequestInit) => Promise<void>;
export declare const getDeleteCustomerMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteCustomer>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof deleteCustomer>>, TError, {
    id: number;
}, TContext>;
export type DeleteCustomerMutationResult = NonNullable<Awaited<ReturnType<typeof deleteCustomer>>>;
export type DeleteCustomerMutationError = ErrorType<unknown>;
/**
* @summary Delete a customer
*/
export declare const useDeleteCustomer: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteCustomer>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof deleteCustomer>>, TError, {
    id: number;
}, TContext>;
export declare const getGetCustomerProfileUrl: (id: number) => string;
/**
 * @summary Get full customer profile with jobs and invoices
 */
export declare const getCustomerProfile: (id: number, options?: RequestInit) => Promise<CustomerProfile>;
export declare const getGetCustomerProfileQueryKey: (id: number) => readonly [`/api/customers/${number}/profile`];
export declare const getGetCustomerProfileQueryOptions: <TData = Awaited<ReturnType<typeof getCustomerProfile>>, TError = ErrorType<unknown>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getCustomerProfile>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getCustomerProfile>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetCustomerProfileQueryResult = NonNullable<Awaited<ReturnType<typeof getCustomerProfile>>>;
export type GetCustomerProfileQueryError = ErrorType<unknown>;
/**
 * @summary Get full customer profile with jobs and invoices
 */
export declare function useGetCustomerProfile<TData = Awaited<ReturnType<typeof getCustomerProfile>>, TError = ErrorType<unknown>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getCustomerProfile>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getListJobsUrl: (params?: ListJobsParams) => string;
/**
 * @summary List all jobs
 */
export declare const listJobs: (params?: ListJobsParams, options?: RequestInit) => Promise<Job[]>;
export declare const getListJobsQueryKey: (params?: ListJobsParams) => readonly ["/api/jobs", ...ListJobsParams[]];
export declare const getListJobsQueryOptions: <TData = Awaited<ReturnType<typeof listJobs>>, TError = ErrorType<unknown>>(params?: ListJobsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listJobs>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listJobs>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListJobsQueryResult = NonNullable<Awaited<ReturnType<typeof listJobs>>>;
export type ListJobsQueryError = ErrorType<unknown>;
/**
 * @summary List all jobs
 */
export declare function useListJobs<TData = Awaited<ReturnType<typeof listJobs>>, TError = ErrorType<unknown>>(params?: ListJobsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listJobs>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getCreateJobUrl: () => string;
/**
 * @summary Create a new job
 */
export declare const createJob: (jobInput: JobInput, options?: RequestInit) => Promise<Job>;
export declare const getCreateJobMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createJob>>, TError, {
        data: BodyType<JobInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createJob>>, TError, {
    data: BodyType<JobInput>;
}, TContext>;
export type CreateJobMutationResult = NonNullable<Awaited<ReturnType<typeof createJob>>>;
export type CreateJobMutationBody = BodyType<JobInput>;
export type CreateJobMutationError = ErrorType<unknown>;
/**
* @summary Create a new job
*/
export declare const useCreateJob: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createJob>>, TError, {
        data: BodyType<JobInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createJob>>, TError, {
    data: BodyType<JobInput>;
}, TContext>;
export declare const getGetJobUrl: (id: number) => string;
/**
 * @summary Get job by ID
 */
export declare const getJob: (id: number, options?: RequestInit) => Promise<Job>;
export declare const getGetJobQueryKey: (id: number) => readonly [`/api/jobs/${number}`];
export declare const getGetJobQueryOptions: <TData = Awaited<ReturnType<typeof getJob>>, TError = ErrorType<unknown>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getJob>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getJob>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetJobQueryResult = NonNullable<Awaited<ReturnType<typeof getJob>>>;
export type GetJobQueryError = ErrorType<unknown>;
/**
 * @summary Get job by ID
 */
export declare function useGetJob<TData = Awaited<ReturnType<typeof getJob>>, TError = ErrorType<unknown>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getJob>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getUpdateJobUrl: (id: number) => string;
/**
 * @summary Update a job
 */
export declare const updateJob: (id: number, jobUpdate: JobUpdate, options?: RequestInit) => Promise<Job>;
export declare const getUpdateJobMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateJob>>, TError, {
        id: number;
        data: BodyType<JobUpdate>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateJob>>, TError, {
    id: number;
    data: BodyType<JobUpdate>;
}, TContext>;
export type UpdateJobMutationResult = NonNullable<Awaited<ReturnType<typeof updateJob>>>;
export type UpdateJobMutationBody = BodyType<JobUpdate>;
export type UpdateJobMutationError = ErrorType<unknown>;
/**
* @summary Update a job
*/
export declare const useUpdateJob: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateJob>>, TError, {
        id: number;
        data: BodyType<JobUpdate>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateJob>>, TError, {
    id: number;
    data: BodyType<JobUpdate>;
}, TContext>;
export declare const getDeleteJobUrl: (id: number) => string;
/**
 * @summary Delete a job
 */
export declare const deleteJob: (id: number, options?: RequestInit) => Promise<void>;
export declare const getDeleteJobMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteJob>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof deleteJob>>, TError, {
    id: number;
}, TContext>;
export type DeleteJobMutationResult = NonNullable<Awaited<ReturnType<typeof deleteJob>>>;
export type DeleteJobMutationError = ErrorType<unknown>;
/**
* @summary Delete a job
*/
export declare const useDeleteJob: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteJob>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof deleteJob>>, TError, {
    id: number;
}, TContext>;
export declare const getCompleteJobUrl: (id: number) => string;
/**
 * @summary Mark a job as completed
 */
export declare const completeJob: (id: number, options?: RequestInit) => Promise<Job>;
export declare const getCompleteJobMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof completeJob>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof completeJob>>, TError, {
    id: number;
}, TContext>;
export type CompleteJobMutationResult = NonNullable<Awaited<ReturnType<typeof completeJob>>>;
export type CompleteJobMutationError = ErrorType<unknown>;
/**
* @summary Mark a job as completed
*/
export declare const useCompleteJob: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof completeJob>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof completeJob>>, TError, {
    id: number;
}, TContext>;
export declare const getListInvoicesUrl: (params?: ListInvoicesParams) => string;
/**
 * @summary List all invoices
 */
export declare const listInvoices: (params?: ListInvoicesParams, options?: RequestInit) => Promise<Invoice[]>;
export declare const getListInvoicesQueryKey: (params?: ListInvoicesParams) => readonly ["/api/invoices", ...ListInvoicesParams[]];
export declare const getListInvoicesQueryOptions: <TData = Awaited<ReturnType<typeof listInvoices>>, TError = ErrorType<unknown>>(params?: ListInvoicesParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listInvoices>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listInvoices>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListInvoicesQueryResult = NonNullable<Awaited<ReturnType<typeof listInvoices>>>;
export type ListInvoicesQueryError = ErrorType<unknown>;
/**
 * @summary List all invoices
 */
export declare function useListInvoices<TData = Awaited<ReturnType<typeof listInvoices>>, TError = ErrorType<unknown>>(params?: ListInvoicesParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listInvoices>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getCreateInvoiceUrl: () => string;
/**
 * @summary Create a new invoice
 */
export declare const createInvoice: (invoiceInput: InvoiceInput, options?: RequestInit) => Promise<Invoice>;
export declare const getCreateInvoiceMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createInvoice>>, TError, {
        data: BodyType<InvoiceInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createInvoice>>, TError, {
    data: BodyType<InvoiceInput>;
}, TContext>;
export type CreateInvoiceMutationResult = NonNullable<Awaited<ReturnType<typeof createInvoice>>>;
export type CreateInvoiceMutationBody = BodyType<InvoiceInput>;
export type CreateInvoiceMutationError = ErrorType<unknown>;
/**
* @summary Create a new invoice
*/
export declare const useCreateInvoice: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createInvoice>>, TError, {
        data: BodyType<InvoiceInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createInvoice>>, TError, {
    data: BodyType<InvoiceInput>;
}, TContext>;
export declare const getGetInvoiceUrl: (id: number) => string;
/**
 * @summary Get invoice by ID
 */
export declare const getInvoice: (id: number, options?: RequestInit) => Promise<Invoice>;
export declare const getGetInvoiceQueryKey: (id: number) => readonly [`/api/invoices/${number}`];
export declare const getGetInvoiceQueryOptions: <TData = Awaited<ReturnType<typeof getInvoice>>, TError = ErrorType<unknown>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getInvoice>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getInvoice>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetInvoiceQueryResult = NonNullable<Awaited<ReturnType<typeof getInvoice>>>;
export type GetInvoiceQueryError = ErrorType<unknown>;
/**
 * @summary Get invoice by ID
 */
export declare function useGetInvoice<TData = Awaited<ReturnType<typeof getInvoice>>, TError = ErrorType<unknown>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getInvoice>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getUpdateInvoiceUrl: (id: number) => string;
/**
 * @summary Update an invoice
 */
export declare const updateInvoice: (id: number, invoiceUpdate: InvoiceUpdate, options?: RequestInit) => Promise<Invoice>;
export declare const getUpdateInvoiceMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateInvoice>>, TError, {
        id: number;
        data: BodyType<InvoiceUpdate>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateInvoice>>, TError, {
    id: number;
    data: BodyType<InvoiceUpdate>;
}, TContext>;
export type UpdateInvoiceMutationResult = NonNullable<Awaited<ReturnType<typeof updateInvoice>>>;
export type UpdateInvoiceMutationBody = BodyType<InvoiceUpdate>;
export type UpdateInvoiceMutationError = ErrorType<unknown>;
/**
* @summary Update an invoice
*/
export declare const useUpdateInvoice: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateInvoice>>, TError, {
        id: number;
        data: BodyType<InvoiceUpdate>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateInvoice>>, TError, {
    id: number;
    data: BodyType<InvoiceUpdate>;
}, TContext>;
export declare const getDeleteInvoiceUrl: (id: number) => string;
/**
 * @summary Delete an invoice
 */
export declare const deleteInvoice: (id: number, options?: RequestInit) => Promise<void>;
export declare const getDeleteInvoiceMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteInvoice>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof deleteInvoice>>, TError, {
    id: number;
}, TContext>;
export type DeleteInvoiceMutationResult = NonNullable<Awaited<ReturnType<typeof deleteInvoice>>>;
export type DeleteInvoiceMutationError = ErrorType<unknown>;
/**
* @summary Delete an invoice
*/
export declare const useDeleteInvoice: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteInvoice>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof deleteInvoice>>, TError, {
    id: number;
}, TContext>;
export declare const getPayInvoiceUrl: (id: number) => string;
/**
 * @summary Mark invoice as paid
 */
export declare const payInvoice: (id: number, options?: RequestInit) => Promise<Invoice>;
export declare const getPayInvoiceMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof payInvoice>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof payInvoice>>, TError, {
    id: number;
}, TContext>;
export type PayInvoiceMutationResult = NonNullable<Awaited<ReturnType<typeof payInvoice>>>;
export type PayInvoiceMutationError = ErrorType<unknown>;
/**
* @summary Mark invoice as paid
*/
export declare const usePayInvoice: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof payInvoice>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof payInvoice>>, TError, {
    id: number;
}, TContext>;
export declare const getGetSettingsUrl: () => string;
/**
 * @summary Get business settings
 */
export declare const getSettings: (options?: RequestInit) => Promise<Settings>;
export declare const getGetSettingsQueryKey: () => readonly ["/api/settings"];
export declare const getGetSettingsQueryOptions: <TData = Awaited<ReturnType<typeof getSettings>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getSettings>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getSettings>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetSettingsQueryResult = NonNullable<Awaited<ReturnType<typeof getSettings>>>;
export type GetSettingsQueryError = ErrorType<unknown>;
/**
 * @summary Get business settings
 */
export declare function useGetSettings<TData = Awaited<ReturnType<typeof getSettings>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getSettings>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getUpdateSettingsUrl: () => string;
/**
 * @summary Update business settings
 */
export declare const updateSettings: (settingsUpdate: SettingsUpdate, options?: RequestInit) => Promise<Settings>;
export declare const getUpdateSettingsMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateSettings>>, TError, {
        data: BodyType<SettingsUpdate>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateSettings>>, TError, {
    data: BodyType<SettingsUpdate>;
}, TContext>;
export type UpdateSettingsMutationResult = NonNullable<Awaited<ReturnType<typeof updateSettings>>>;
export type UpdateSettingsMutationBody = BodyType<SettingsUpdate>;
export type UpdateSettingsMutationError = ErrorType<unknown>;
/**
* @summary Update business settings
*/
export declare const useUpdateSettings: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateSettings>>, TError, {
        data: BodyType<SettingsUpdate>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateSettings>>, TError, {
    data: BodyType<SettingsUpdate>;
}, TContext>;
export declare const getVerifyPinUrl: () => string;
/**
 * @summary Verify PIN
 */
export declare const verifyPin: (pinVerify: PinVerify, options?: RequestInit) => Promise<PinVerifyResult>;
export declare const getVerifyPinMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof verifyPin>>, TError, {
        data: BodyType<PinVerify>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof verifyPin>>, TError, {
    data: BodyType<PinVerify>;
}, TContext>;
export type VerifyPinMutationResult = NonNullable<Awaited<ReturnType<typeof verifyPin>>>;
export type VerifyPinMutationBody = BodyType<PinVerify>;
export type VerifyPinMutationError = ErrorType<unknown>;
/**
* @summary Verify PIN
*/
export declare const useVerifyPin: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof verifyPin>>, TError, {
        data: BodyType<PinVerify>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof verifyPin>>, TError, {
    data: BodyType<PinVerify>;
}, TContext>;
export declare const getGetDashboardStatsUrl: () => string;
/**
 * @summary Get dashboard statistics
 */
export declare const getDashboardStats: (options?: RequestInit) => Promise<DashboardStats>;
export declare const getGetDashboardStatsQueryKey: () => readonly ["/api/dashboard/stats"];
export declare const getGetDashboardStatsQueryOptions: <TData = Awaited<ReturnType<typeof getDashboardStats>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getDashboardStats>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getDashboardStats>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetDashboardStatsQueryResult = NonNullable<Awaited<ReturnType<typeof getDashboardStats>>>;
export type GetDashboardStatsQueryError = ErrorType<unknown>;
/**
 * @summary Get dashboard statistics
 */
export declare function useGetDashboardStats<TData = Awaited<ReturnType<typeof getDashboardStats>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getDashboardStats>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getExportBackupUrl: () => string;
/**
 * @summary Export all data as JSON
 */
export declare const exportBackup: (options?: RequestInit) => Promise<BackupData>;
export declare const getExportBackupQueryKey: () => readonly ["/api/backup/export"];
export declare const getExportBackupQueryOptions: <TData = Awaited<ReturnType<typeof exportBackup>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof exportBackup>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof exportBackup>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ExportBackupQueryResult = NonNullable<Awaited<ReturnType<typeof exportBackup>>>;
export type ExportBackupQueryError = ErrorType<unknown>;
/**
 * @summary Export all data as JSON
 */
export declare function useExportBackup<TData = Awaited<ReturnType<typeof exportBackup>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof exportBackup>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getImportBackupUrl: () => string;
/**
 * @summary Import backup data
 */
export declare const importBackup: (backupData: BackupData, options?: RequestInit) => Promise<ImportResult>;
export declare const getImportBackupMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof importBackup>>, TError, {
        data: BodyType<BackupData>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof importBackup>>, TError, {
    data: BodyType<BackupData>;
}, TContext>;
export type ImportBackupMutationResult = NonNullable<Awaited<ReturnType<typeof importBackup>>>;
export type ImportBackupMutationBody = BodyType<BackupData>;
export type ImportBackupMutationError = ErrorType<unknown>;
/**
* @summary Import backup data
*/
export declare const useImportBackup: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof importBackup>>, TError, {
        data: BodyType<BackupData>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof importBackup>>, TError, {
    data: BodyType<BackupData>;
}, TContext>;
export {};
//# sourceMappingURL=api.d.ts.map