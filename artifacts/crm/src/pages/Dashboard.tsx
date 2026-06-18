import { useState } from "react";
import { useGetDashboardStats, useCompleteJob, useDeleteJob, getListJobsQueryKey } from "@workspace/api-client-react";
import { Users, Briefcase, FileText, TrendingUp, Clock, Calendar, Phone, Trash2, Check, FilePlus, BarChart2, DollarSign } from "lucide-react";
import { formatPersianNumber, formatJalaliDate, formatJalaliTime } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function Dashboard() {
  const { data: stats, isLoading, refetch } = useGetDashboardStats();
  const completeJob = useCompleteJob();
  const deleteJob = useDeleteJob();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [completedJob, setCompletedJob] = useState<{ id: number; customer_id: number } | null>(null);

  const handleComplete = (job: { id: number; customer_id: number }) => {
    completeJob.mutate(
      { id: job.id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListJobsQueryKey() });
          refetch();
          setCompletedJob(job);
        },
      }
    );
  };

  const handleDelete = (id: number) => {
    if (!confirm("آیا از حذف این کار مطمئن هستید؟")) return;
    deleteJob.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListJobsQueryKey() });
          refetch();
          toast({ title: "کار حذف شد" });
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">داشبورد</h1>
        <p className="text-muted-foreground text-sm mt-1">خلاصه وضعیت سیستم</p>
      </div>

      {/* Stat cards - 2 col on mobile, 3 col on md, 6 col on desktop */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        <StatCard title="تعداد مشتریان" value={isLoading ? undefined : stats?.total_customers} icon={Users} iconBg="bg-blue-50" iconColor="text-blue-500" valueColor="text-blue-600" borderHover="hover:border-blue-300" isLoading={isLoading} />
        <StatCard title="فاکتور پرداخت‌نشده" value={isLoading ? undefined : stats?.total_unpaid_invoices} icon={FileText} iconBg="bg-red-50" iconColor="text-red-500" valueColor="text-red-600" borderHover="hover:border-red-300" isLoading={isLoading} />
        <StatCard title="مجموع مطالبات" value={isLoading ? undefined : stats?.total_unpaid_amount} icon={TrendingUp} iconBg="bg-orange-50" iconColor="text-orange-500" valueColor="text-green-600" borderHover="hover:border-orange-300" isLoading={isLoading} isCurrency />
        <StatCard title="کارهای در انتظار" value={isLoading ? undefined : stats?.total_pending_jobs} icon={Clock} iconBg="bg-teal-50" iconColor="text-teal-500" valueColor="text-teal-600" borderHover="hover:border-teal-300" isLoading={isLoading} />
        <StatCard title="فاکتور این ماه" value={isLoading ? undefined : stats?.monthly_invoice_count} icon={BarChart2} iconBg="bg-violet-50" iconColor="text-violet-500" valueColor="text-violet-600" borderHover="hover:border-violet-300" isLoading={isLoading} />
        <StatCard title="فروش این ماه" value={isLoading ? undefined : stats?.monthly_sales_amount} icon={DollarSign} iconBg="bg-emerald-50" iconColor="text-emerald-500" valueColor="text-emerald-600" borderHover="hover:border-emerald-300" isLoading={isLoading} isCurrency />
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
          <p className="text-sm text-muted-foreground mt-1">آیا می‌خواهید برای این کار فاکتور صادر کنید؟</p>
          <div className="flex gap-3 mt-4">
            <Button className="flex-1 gap-1.5" onClick={() => {
              if (!completedJob) return;
              setCompletedJob(null);
              setLocation(`/invoices/new?customer_id=${completedJob.customer_id}&job_id=${completedJob.id}`);
            }}>
              <FilePlus className="h-4 w-4" />
              بله، ثبت فاکتور
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => setCompletedJob(null)}>
              بعداً
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Pending jobs section */}
      <div className="bg-card rounded-xl border border-card-border shadow-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2 font-semibold text-foreground text-sm">
            <Clock className="h-4 w-4 text-primary" />
            کارهای در انتظار امروز
          </div>
          <Link href="/jobs" className="text-xs text-primary hover:underline font-medium" data-testid="link-view-all-jobs">
            مشاهده همه
          </Link>
        </div>

        <div className="p-4 space-y-3">
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-36 w-full rounded-xl" />
              <Skeleton className="h-36 w-full rounded-xl" />
            </div>
          ) : !stats?.recent_jobs || stats.recent_jobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-3">
              <Briefcase className="h-10 w-10 opacity-30" />
              <span className="text-sm">هیچ کاری در انتظار نیست</span>
            </div>
          ) : (
            stats.recent_jobs.map((job) => {
              const j = job as any;
              const displayDate = j.scheduled_date || formatJalaliDate(j.created_at);
              const displayTime = j.scheduled_time || formatJalaliTime(j.created_at);
              const phone: string | null = j.customer_phone ?? null;
              return (
                <div
                  key={j.id}
                  className="bg-card rounded-xl border border-card-border shadow-sm p-4 flex flex-col gap-3 hover:shadow-md transition-shadow"
                  data-testid={`card-dashboard-job-${j.id}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                      {j.customer_name || "—"}
                    </div>
                    {phone && (
                      <a href={`tel:${phone}`} className="flex items-center gap-1 text-xs text-primary hover:underline dir-ltr">
                        <Phone className="h-3.5 w-3.5" />
                        {phone}
                      </a>
                    )}
                  </div>

                  <div className="bg-muted/50 rounded-lg px-3 py-2 text-sm text-foreground min-h-[36px]">
                    {j.description}
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {displayTime}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {displayDate}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline" size="icon"
                      className="h-8 w-8 border-rose-200 bg-rose-50 text-rose-500 hover:bg-rose-100 hover:border-rose-400 shrink-0"
                      onClick={() => handleDelete(j.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <Button
                      className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white gap-1"
                      size="sm"
                      onClick={() => handleComplete({ id: j.id, customer_id: j.customer_id })}
                      disabled={completeJob.isPending}
                    >
                      <Check className="h-4 w-4 ml-1" />
                      انجام شد
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title, value, icon: Icon, iconBg, iconColor, valueColor, borderHover, isLoading, isCurrency = false,
}: {
  title: string; value: number | undefined; icon: React.ElementType;
  iconBg: string; iconColor: string; valueColor: string; borderHover: string;
  isLoading: boolean; isCurrency?: boolean;
}) {
  return (
    <div
      className={`bg-card rounded-xl border border-card-border shadow-sm p-3 sm:p-4 flex items-center gap-3 cursor-default transition-all duration-200 hover:scale-[1.03] hover:shadow-md ${borderHover}`}
      data-testid={`card-stat-${title}`}
    >
      <div className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}>
        <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${iconColor}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] sm:text-xs text-muted-foreground leading-tight truncate">{title}</p>
        {isLoading ? (
          <Skeleton className="h-5 sm:h-6 w-16 sm:w-20 mt-1.5" />
        ) : (
          <p className={`text-lg sm:text-xl font-bold mt-0.5 ${valueColor} leading-tight`}>
            {isCurrency
              ? (value ?? 0).toLocaleString("fa-IR") + " ت"
              : formatPersianNumber(value)}
          </p>
        )}
      </div>
    </div>
  );
}
