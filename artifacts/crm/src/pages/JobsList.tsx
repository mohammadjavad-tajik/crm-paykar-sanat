import { useState } from "react";
import { format as formatJalali } from "date-fns-jalali";
import {
  useListJobs, useCreateJob, useCompleteJob, useDeleteJob, useUpdateJob,
  getListJobsQueryKey, useListCustomers, useListInvoices,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Plus, Phone, Calendar, Clock, Trash2, Pencil, Check, FileText, FilePlus } from "lucide-react";
import { formatJalaliDate, formatJalaliTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type Job = {
  id: number; customer_id: number; customer_name?: string | null;
  description: string; status: string;
  scheduled_date?: string | null; scheduled_time?: string | null;
  created_at: string; completed_at?: string | null;
};

export default function JobsList() {
  const [activeTab, setActiveTab] = useState<"pending" | "completed">("pending");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editJob, setEditJob] = useState<Job | null>(null);
  const [completedJob, setCompletedJob] = useState<Job | null>(null);
  const [, setLocation] = useLocation();

  const { data: jobs, isLoading } = useListJobs({ status: activeTab });
  const { data: allJobs } = useListJobs();
  const { data: customers } = useListCustomers();
  const { data: allInvoices } = useListInvoices();

  const createJob = useCreateJob();
  const completeJob = useCompleteJob();
  const deleteJob = useDeleteJob();
  const updateJob = useUpdateJob();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const pendingCount = allJobs?.filter((j) => j.status === "pending").length ?? 0;
  const completedCount = allJobs?.filter((j) => j.status === "completed").length ?? 0;

  const invalidate = () => queryClient.invalidateQueries({ queryKey: getListJobsQueryKey() });

  const getInvoiceForJob = (jobId: number) =>
    allInvoices?.find((inv) => inv.job_id === jobId) ?? null;

  const getCustomerPhone = (customerId: number) =>
    customers?.find((c) => c.id === customerId)?.phone ?? null;

  const getTodayJalali = () => formatJalali(new Date(), "yyyy/MM/dd");
  const getNowTime = () => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  };
  const handleDateInput = (value: string, onChange: (v: string) => void) => {
    const digits = value.replace(/\D/g, "");
    let formatted = digits;
    if (digits.length > 4) formatted = digits.slice(0, 4) + "/" + digits.slice(4);
    if (digits.length > 6) formatted = digits.slice(0, 4) + "/" + digits.slice(4, 6) + "/" + digits.slice(6, 8);
    onChange(formatted);
  };

  const addForm = useForm({ defaultValues: { customer_id: "", description: "", scheduled_date: getTodayJalali(), scheduled_time: getNowTime() } });
  const editForm = useForm({ defaultValues: { description: "", scheduled_date: "", scheduled_time: "" } });

  const handleCreate = (data: { customer_id: string; description: string; scheduled_date: string; scheduled_time: string }) => {
    createJob.mutate(
      { data: { customer_id: Number(data.customer_id), description: data.description, scheduled_date: data.scheduled_date || undefined, scheduled_time: data.scheduled_time || undefined } },
      {
        onSuccess: () => {
          invalidate();
          setIsAddOpen(false);
          addForm.reset();
          toast({ title: "کار ثبت شد" });
        },
        onError: () => toast({ title: "خطا در ثبت کار", variant: "destructive" }),
      }
    );
  };

  const handleComplete = (job: Job) => {
    completeJob.mutate(
      { id: job.id },
      {
        onSuccess: () => {
          invalidate();
          setCompletedJob(job);
        },
      }
    );
  };

  const handleDelete = (id: number) => {
    if (!confirm("آیا از حذف این کار مطمئن هستید؟")) return;
    deleteJob.mutate({ id }, {
      onSuccess: () => { invalidate(); toast({ title: "کار حذف شد" }); },
      onError: () => toast({ title: "خطا در حذف کار", variant: "destructive" }),
    });
  };

  const openEdit = (job: Job) => {
    setEditJob(job);
    editForm.reset({ description: job.description, scheduled_date: job.scheduled_date || "", scheduled_time: job.scheduled_time || "" });
  };

  const handleUpdate = (data: { description: string; scheduled_date: string; scheduled_time: string }) => {
    if (!editJob) return;
    updateJob.mutate(
      { id: editJob.id, data: { description: data.description, scheduled_date: data.scheduled_date || undefined, scheduled_time: data.scheduled_time || undefined } },
      {
        onSuccess: () => { invalidate(); setEditJob(null); toast({ title: "کار ویرایش شد" }); },
        onError: () => toast({ title: "خطا در ویرایش کار", variant: "destructive" }),
      }
    );
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">کارها</h1>
          <p className="text-muted-foreground text-sm mt-0.5">مدیریت کارهای فنی</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-job">
              <Plus className="h-4 w-4 ml-1" /> ثبت کار جدید
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>ثبت کار جدید</DialogTitle></DialogHeader>
            <Form {...addForm}>
              <form onSubmit={addForm.handleSubmit(handleCreate)} className="space-y-4 mt-2">
                <FormField control={addForm.control} name="customer_id" render={({ field }) => (
                  <FormItem><FormLabel>مشتری</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="text-right"><SelectValue placeholder="انتخاب مشتری" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {customers?.map((c) => (
                          <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />
                <FormField control={addForm.control} name="description" render={({ field }) => (
                  <FormItem><FormLabel>شرح کار</FormLabel><FormControl><Input {...field} required /></FormControl></FormItem>
                )} />
                <div className="grid grid-cols-2 gap-3">
                  <FormField control={addForm.control} name="scheduled_date" render={({ field }) => (
                    <FormItem>
                      <FormLabel>تاریخ (سال/ماه/روز)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          inputMode="numeric"
                          placeholder="1405/01/15"
                          maxLength={10}
                          onChange={(e) => handleDateInput(e.target.value, field.onChange)}
                        />
                      </FormControl>
                    </FormItem>
                  )} />
                  <FormField control={addForm.control} name="scheduled_time" render={({ field }) => (
                    <FormItem>
                      <FormLabel>ساعت (HH:MM)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          inputMode="numeric"
                          placeholder="09:30"
                          maxLength={5}
                          className="dir-ltr"
                          onChange={(e) => {
                            const digits = e.target.value.replace(/\D/g, "");
                            let formatted = digits;
                            if (digits.length > 2) formatted = digits.slice(0, 2) + ":" + digits.slice(2, 4);
                            field.onChange(formatted);
                          }}
                        />
                      </FormControl>
                    </FormItem>
                  )} />
                </div>
                <div className="flex justify-end pt-2">
                  <Button type="submit" disabled={createJob.isPending}>
                    {createJob.isPending ? "در حال ثبت..." : "ثبت کار"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Post-complete dialog */}
      <Dialog open={!!completedJob} onOpenChange={(open) => { if (!open) setCompletedJob(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-600">
              <Check className="h-5 w-5" />
              کار انجام شد
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground mt-1">
            آیا می‌خواهید برای این کار فاکتور صادر کنید؟
          </p>
          <div className="flex gap-3 mt-4">
            <Button
              className="flex-1 gap-1.5"
              onClick={() => {
                if (!completedJob) return;
                setCompletedJob(null);
                setLocation(`/invoices/new?customer_id=${completedJob.customer_id}&job_id=${completedJob.id}`);
              }}
            >
              <FilePlus className="h-4 w-4" />
              بله، ثبت فاکتور
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setCompletedJob(null);
                setActiveTab("completed");
                toast({ title: "کار انجام شد", description: "می‌توانید بعداً فاکتور ثبت کنید." });
              }}
            >
              بعداً
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editJob} onOpenChange={(open) => !open && setEditJob(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>ویرایش کار</DialogTitle></DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleUpdate)} className="space-y-4 mt-2">
              <FormField control={editForm.control} name="description" render={({ field }) => (
                <FormItem><FormLabel>شرح کار</FormLabel><FormControl><Input {...field} required /></FormControl></FormItem>
              )} />
              <div className="grid grid-cols-2 gap-3">
                <FormField control={editForm.control} name="scheduled_date" render={({ field }) => (
                  <FormItem>
                    <FormLabel>تاریخ (سال/ماه/روز)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        inputMode="numeric"
                        placeholder="1405/01/15"
                        maxLength={10}
                        onChange={(e) => handleDateInput(e.target.value, field.onChange)}
                      />
                    </FormControl>
                  </FormItem>
                )} />
                <FormField control={editForm.control} name="scheduled_time" render={({ field }) => (
                  <FormItem>
                    <FormLabel>ساعت (HH:MM)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        inputMode="numeric"
                        placeholder="09:30"
                        maxLength={5}
                        className="dir-ltr"
                        onChange={(e) => {
                          const digits = e.target.value.replace(/\D/g, "");
                          let formatted = digits;
                          if (digits.length > 2) formatted = digits.slice(0, 2) + ":" + digits.slice(2, 4);
                          field.onChange(formatted);
                        }}
                      />
                    </FormControl>
                  </FormItem>
                )} />
              </div>
              <div className="flex justify-end pt-2">
                <Button type="submit" disabled={updateJob.isPending}>
                  {updateJob.isPending ? "در حال ذخیره..." : "ذخیره"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Tabs */}
      <div className="flex gap-2">
        {[
          { key: "pending" as const, label: "در انتظار", count: pendingCount },
          { key: "completed" as const, label: "انجام شده", count: completedCount },
        ].map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border transition-all",
              activeTab === key
                ? "bg-primary text-white border-primary"
                : "bg-card text-foreground border-border hover:border-primary hover:text-primary"
            )}
            data-testid={`tab-jobs-${key}`}
          >
            {label}
            <span className={cn(
              "text-xs rounded-full px-1.5 py-0.5 font-bold",
              activeTab === key ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
            )}>
              {count}
            </span>
          </button>
        ))}
      </div>

      {/* Job cards */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-52 rounded-xl" />)}
        </div>
      ) : jobs?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
          <Clock className="h-10 w-10 opacity-30" />
          <span className="text-sm">کاری یافت نشد</span>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {jobs?.map((job) => {
            const phone = getCustomerPhone(job.customer_id);
            const isCompleted = job.status === "completed";
            const invoice = isCompleted ? getInvoiceForJob(job.id) : null;

            return (
              <div
                key={job.id}
                className="bg-card rounded-xl border border-card-border shadow-sm p-4 flex flex-col gap-3 hover:shadow-md transition-shadow"
                data-testid={`card-job-${job.id}`}
              >
                {/* Header: customer + phone */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                    {job.customer_name || "—"}
                  </div>
                  {phone && (
                    <a
                      href={`tel:${phone}`}
                      className="flex items-center gap-1 text-xs text-primary hover:underline dir-ltr"
                      data-testid={`link-job-phone-${job.id}`}
                    >
                      <Phone className="h-3.5 w-3.5" />
                      {phone}
                    </a>
                  )}
                </div>

                {/* Description */}
                <div className="bg-muted/50 rounded-lg px-3 py-2 text-sm text-foreground min-h-[36px]">
                  {job.description}
                </div>

                {/* Date + time */}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {isCompleted && job.completed_at
                      ? formatJalaliTime(job.completed_at)
                      : (job.scheduled_time || formatJalaliTime(job.created_at))}
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {isCompleted && job.completed_at
                      ? formatJalaliDate(job.completed_at)
                      : (job.scheduled_date || formatJalaliDate(job.created_at))}
                  </div>
                </div>

                {/* Actions row: delete + edit + complete/invoice */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline" size="icon"
                    className="h-8 w-8 border-rose-200 bg-rose-50 text-rose-500 hover:bg-rose-100 hover:border-rose-400 shrink-0"
                    onClick={() => handleDelete(job.id)}
                    data-testid={`button-delete-job-${job.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline" size="icon"
                    className="h-8 w-8 shrink-0 border-blue-200 bg-blue-50 text-blue-500 hover:bg-blue-100 hover:border-blue-400"
                    onClick={() => openEdit(job as Job)}
                    data-testid={`button-edit-job-${job.id}`}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>

                  {!isCompleted ? (
                    <Button
                      className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white"
                      size="sm"
                      onClick={() => handleComplete(job as Job)}
                      disabled={completeJob.isPending}
                      data-testid={`button-complete-job-${job.id}`}
                    >
                      <Check className="h-4 w-4 ml-1" />
                      انجام شد
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className={cn(
                        "flex-1 gap-1.5 font-medium",
                        invoice
                          ? "border-indigo-200 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 hover:border-indigo-400"
                          : "border-amber-200 bg-amber-50 text-amber-600 hover:bg-amber-100 hover:border-amber-400"
                      )}
                      onClick={() =>
                        invoice
                          ? setLocation(`/invoices/${invoice.id}/edit`)
                          : setLocation(`/invoices/new?customer_id=${job.customer_id}&job_id=${job.id}`)
                      }
                      data-testid={`button-invoice-job-${job.id}`}
                    >
                      {invoice ? (
                        <>
                          <FileText className="h-4 w-4" />
                          ویرایش فاکتور
                        </>
                      ) : (
                        <>
                          <FilePlus className="h-4 w-4" />
                          ثبت فاکتور
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
