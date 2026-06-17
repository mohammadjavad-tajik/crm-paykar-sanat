import { useState } from "react";
import {
  useListInvoices, useDeleteInvoice, usePayInvoice,
  getListInvoicesQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Plus, Search, Trash2, Pencil, Eye } from "lucide-react";
import { formatJalaliDate, formatToman, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

export default function InvoicesList() {
  const [statusFilter, setStatusFilter] = useState<"all" | "paid" | "unpaid">("all");
  const [search, setSearch] = useState("");

  const { data: invoices, isLoading } = useListInvoices(
    statusFilter !== "all" ? { status: statusFilter } : undefined
  );
  const deleteInvoice = useDeleteInvoice();
  const payInvoice = usePayInvoice();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const invalidate = () => queryClient.invalidateQueries({ queryKey: getListInvoicesQueryKey() });

  const filtered = invoices?.filter((inv) =>
    !search ||
    inv.title?.toLowerCase().includes(search.toLowerCase()) ||
    inv.customer_name?.toLowerCase().includes(search.toLowerCase())
  );

  const totalUnpaid = invoices
    ?.filter((inv) => inv.status === "unpaid")
    .reduce((sum, inv) => sum + (inv.total_amount ?? 0), 0) ?? 0;

  const handleDelete = (id: number) => {
    if (!confirm("آیا از حذف این فاکتور مطمئن هستید؟")) return;
    deleteInvoice.mutate({ id }, {
      onSuccess: () => { invalidate(); toast({ title: "فاکتور حذف شد" }); },
      onError: () => toast({ title: "خطا در حذف فاکتور", variant: "destructive" }),
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">فاکتورها</h1>
          <p className="text-muted-foreground text-sm mt-0.5">مدیریت صورت‌حساب‌ها</p>
        </div>
        <Button asChild data-testid="button-new-invoice">
          <Link href="/invoices/new"><Plus className="h-4 w-4 ml-1" /> فاکتور جدید</Link>
        </Button>
      </div>

      {/* Summary bar */}
      <div className="flex items-center justify-between bg-rose-50 border border-rose-100 rounded-xl px-5 py-3">
        <span className="text-rose-700 font-bold text-base" data-testid="text-total-unpaid">
          {totalUnpaid.toLocaleString("fa-IR")} تومان
        </span>
        <span className="text-rose-600 text-sm font-medium">مجموع مطالبات پرداخت‌نشده</span>
      </div>

      {/* Filter + Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="flex gap-2">
          {[
            { key: "all" as const, label: "همه" },
            { key: "unpaid" as const, label: "پرداخت‌نشده" },
            { key: "paid" as const, label: "پرداخت‌شده" },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setStatusFilter(key)}
              className={cn(
                "px-4 py-1.5 rounded-full text-sm font-medium border transition-all",
                statusFilter === key
                  ? "bg-primary text-white border-primary"
                  : "bg-card text-foreground border-border hover:border-primary hover:text-primary"
              )}
              data-testid={`filter-invoices-${key}`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex items-center relative flex-1 max-w-xs mr-auto">
          <Search className="absolute right-3 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="جستجو در فاکتورها..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-9"
            data-testid="input-search-invoices"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-card-border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead className="font-semibold text-right pr-4 whitespace-nowrap w-32">مشتری</TableHead>
              <TableHead className="font-semibold text-right">عنوان</TableHead>
              <TableHead className="font-semibold text-center whitespace-nowrap w-32">تاریخ</TableHead>
              <TableHead className="font-semibold text-center whitespace-nowrap w-32">مبلغ کل</TableHead>
              <TableHead className="font-semibold text-center whitespace-nowrap w-28">وضعیت</TableHead>
              <TableHead className="font-semibold text-center whitespace-nowrap w-28">عملیات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  {[...Array(6)].map((_, j) => (
                    <TableCell key={j} className="text-center"><Skeleton className="h-5 w-20 mx-auto" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : filtered?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">فاکتوری یافت نشد</TableCell>
              </TableRow>
            ) : (
              filtered?.map((invoice) => (
                <TableRow key={invoice.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="pr-4 whitespace-nowrap">
                    <span className="text-primary font-medium">{invoice.customer_name || "—"}</span>
                  </TableCell>
                  <TableCell className="font-medium">{invoice.title}</TableCell>
                  <TableCell className="text-center whitespace-nowrap text-muted-foreground">{formatJalaliDate(invoice.date)}</TableCell>
                  <TableCell className="text-center whitespace-nowrap font-semibold">
                    {(invoice.total_amount ?? 0).toLocaleString("fa-IR")} ت
                  </TableCell>
                  <TableCell className="text-center whitespace-nowrap">
                    <span className={cn(
                      "inline-block px-2.5 py-0.5 rounded-full text-xs font-medium border",
                      invoice.status === "paid"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-rose-50 text-rose-700 border-rose-200"
                    )}>
                      {invoice.status === "paid" ? "پرداخت شده" : "پرداخت نشده"}
                    </span>
                  </TableCell>
                  <TableCell className="text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        variant="outline" size="icon"
                        className="h-8 w-8 border-rose-200 bg-rose-50 text-rose-500 hover:bg-rose-100 hover:border-rose-400"
                        onClick={() => handleDelete(invoice.id)}
                        data-testid={`button-delete-invoice-${invoice.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline" size="icon"
                        className="h-8 w-8 border-blue-200 bg-blue-50 text-blue-500 hover:bg-blue-100 hover:border-blue-400"
                        asChild
                        data-testid={`button-edit-invoice-${invoice.id}`}
                      >
                        <Link href={`/invoices/${invoice.id}/edit`}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="outline" size="icon"
                        className="h-8 w-8 border-indigo-200 bg-indigo-50 text-indigo-500 hover:bg-indigo-100 hover:border-indigo-400"
                        asChild
                        data-testid={`button-view-invoice-${invoice.id}`}
                      >
                        <Link href={`/invoices/${invoice.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
