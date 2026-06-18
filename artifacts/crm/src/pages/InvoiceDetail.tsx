import { useState } from "react";
import { useRoute, useLocation, Link } from "wouter";
import {
  useGetInvoice, usePayInvoice, useDeleteInvoice, useGetSettings,
  getListInvoicesQueryKey, getGetInvoiceQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Printer, CheckCircle2, Edit, Trash2, Lock } from "lucide-react";
import { formatToman, formatJalaliDate, formatPersianNumber } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useManagerAccess } from "@/hooks/useManagerAccess";

export default function InvoiceDetail() {
  const [, params] = useRoute("/invoices/:id");
  const [, setLocation] = useLocation();
  const invoiceId = Number(params?.id);

  const { data: invoice, isLoading } = useGetInvoice(invoiceId, {
    query: { enabled: !!invoiceId },
  });
  const { data: settings } = useGetSettings();

  const payInvoice = usePayInvoice();
  const deleteInvoice = useDeleteInvoice();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const isManager = useManagerAccess();

  const handlePay = () => {
    payInvoice.mutate(
      { id: invoiceId },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetInvoiceQueryKey(invoiceId) });
          queryClient.invalidateQueries({ queryKey: getListInvoicesQueryKey() });
          toast({ title: "فاکتور پرداخت شد" });
        },
      }
    );
  };

  const handleDelete = () => {
    if (confirm("آیا از حذف این فاکتور مطمئن هستید؟")) {
      deleteInvoice.mutate(
        { id: invoiceId },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListInvoicesQueryKey() });
            toast({ title: "فاکتور حذف شد" });
            setLocation("/invoices");
          },
        }
      );
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!invoice) return <div>فاکتور یافت نشد</div>;

  const subtotal = invoice.items.reduce((s, i) => s + i.quantity * i.unit_price, 0);

  const totalPurchase = invoice.items.reduce((s, i) => {
    const pp = (i as any).purchase_price;
    return s + (pp != null ? Number(pp) * i.quantity : 0);
  }, 0);

  const hasAnyPurchasePrice = invoice.items.some((i) => (i as any).purchase_price != null);
  const profit = subtotal - (invoice.discount ?? 0) - totalPurchase;

  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #invoice-print-area, #invoice-print-area * { visibility: visible !important; }
          #invoice-print-area {
            position: fixed !important;
            top: 0; left: 0;
            width: 100%;
            margin: 0;
            padding: 0;
          }
        }
      `}</style>

      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="print:hidden flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => window.history.back()}>
              <ArrowRight className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold tracking-tight">جزئیات فاکتور</h1>
          </div>

          <div className="flex flex-wrap gap-2">
            {invoice.status === "unpaid" && (
              <Button
                onClick={handlePay}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                disabled={payInvoice.isPending}
              >
                <CheckCircle2 className="ml-2 h-4 w-4" /> پرداخت شد
              </Button>
            )}
            <Button onClick={handlePrint} variant="outline">
              <Printer className="ml-2 h-4 w-4" /> چاپ / PDF
            </Button>
            <Button asChild variant="outline">
              <Link href={`/invoices/${invoiceId}/edit`}>
                <Edit className="ml-2 h-4 w-4" /> ویرایش
              </Link>
            </Button>
            <Button
              onClick={handleDelete}
              variant="outline"
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Profit summary card (screen only, manager only) */}
        {hasAnyPurchasePrice && isManager && (
          <div className="print:hidden bg-card border border-card-border rounded-xl p-4 flex items-center gap-6 flex-wrap">
            <div className="text-sm">
              <span className="text-muted-foreground">قیمت تمام‌شده: </span>
              <span className="font-medium">{formatToman(totalPurchase)}</span>
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">سود خالص: </span>
              <span className={profit >= 0 ? "font-bold text-emerald-600" : "font-bold text-rose-600"}>
                {formatToman(Math.abs(profit))} {profit < 0 ? "(ضرر)" : ""}
              </span>
            </div>
          </div>
        )}
        {hasAnyPurchasePrice && !isManager && (
          <div className="print:hidden bg-muted/40 border border-border rounded-xl p-3 flex items-center gap-2 text-sm text-muted-foreground">
            <Lock className="h-4 w-4 shrink-0" />
            <span>برای مشاهده اطلاعات سود و قیمت خرید، ابتدا وارد شوید (PIN)</span>
          </div>
        )}

        {/* Invoice content */}
        <div id="invoice-print-area">
          <div
            className="bg-white text-black rounded-xl border border-card-border shadow-sm p-8 min-h-[700px]"
            dir="rtl"
            style={{ fontFamily: "Vazirmatn, sans-serif" }}
          >
            {/* Header */}
            <div className="flex justify-between items-start border-b-2 border-gray-200 pb-8 mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-1">
                  {settings?.business_name || "صورتحساب فروش"}
                </h1>
                {settings?.owner_name && (
                  <p className="text-gray-600 text-sm">{settings.owner_name}</p>
                )}
                {settings?.phone && (
                  <p className="text-gray-600 text-sm dir-ltr text-right">
                    {formatPersianNumber(settings.phone)}
                  </p>
                )}
              </div>
              <div className="text-left space-y-1">
                <h2 className="text-xl font-bold text-gray-800">فاکتور</h2>
                <p className="text-gray-600 text-sm">
                  شماره: {formatPersianNumber(invoice.id)}
                </p>
                <p className="text-gray-600 text-sm">
                  تاریخ: {formatJalaliDate(invoice.date)}
                </p>
                <span
                  className={`inline-block mt-1 px-3 py-0.5 rounded-full text-xs font-medium ${
                    invoice.status === "paid"
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {invoice.status === "paid" ? "پرداخت شده" : "پرداخت نشده"}
                </span>
              </div>
            </div>

            {/* Customer */}
            <div className="mb-8">
              <h3 className="text-base font-bold text-gray-800 mb-3 border-b pb-2">
                مشخصات خریدار
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-500 text-xs mb-1">نام خریدار:</p>
                  <p className="font-medium text-gray-900">{invoice.customer_name}</p>
                </div>
                {invoice.job_id && (
                  <div>
                    <p className="text-gray-500 text-xs mb-1">بابت کار:</p>
                    <p className="font-medium text-gray-900">
                      کد {formatPersianNumber(invoice.job_id)}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Items table */}
            <div className="mb-8">
              <table className="w-full text-right border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-100 text-gray-700">
                    <th className="py-2.5 px-4 rounded-r-lg font-medium">ردیف</th>
                    <th className="py-2.5 px-4 font-medium">شرح کالا / خدمات</th>
                    <th className="py-2.5 px-4 text-center font-medium">تعداد</th>
                    <th className="py-2.5 px-4 text-center font-medium">فی (تومان)</th>
                    <th className="py-2.5 px-4 text-left rounded-l-lg font-medium">
                      مبلغ کل (تومان)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y border-b">
                  {invoice.items.map((item, idx) => (
                    <tr key={idx} className="text-gray-700">
                      <td className="py-3 px-4">{formatPersianNumber(idx + 1)}</td>
                      <td className="py-3 px-4">{item.title}</td>
                      <td className="py-3 px-4 text-center dir-ltr">
                        {formatPersianNumber(item.quantity)}
                      </td>
                      <td className="py-3 px-4 text-center dir-ltr">
                        {item.unit_price.toLocaleString("fa-IR")}
                      </td>
                      <td className="py-3 px-4 text-left dir-ltr">
                        {(item.quantity * item.unit_price).toLocaleString("fa-IR")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="flex justify-end">
              <div className="w-72 space-y-3 text-gray-800">
                <div className="flex justify-between border-b pb-2 text-sm">
                  <span>جمع کل:</span>
                  <span className="dir-ltr">{subtotal.toLocaleString("fa-IR")}</span>
                </div>
                {invoice.discount && invoice.discount > 0 && (
                  <div className="flex justify-between border-b pb-2 text-sm text-red-600">
                    <span>تخفیف:</span>
                    <span className="dir-ltr">
                      {invoice.discount.toLocaleString("fa-IR")}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-1 text-lg font-bold">
                  <span>مبلغ نهایی:</span>
                  <span className="text-indigo-600 dir-ltr">
                    {formatToman(invoice.total_amount)}
                  </span>
                </div>
              </div>
            </div>

            {/* Notes */}
            {invoice.notes && (
              <div className="mt-10 pt-6 border-t text-gray-600 text-sm">
                <h4 className="font-bold text-gray-800 mb-1">توضیحات:</h4>
                <p className="whitespace-pre-wrap">{invoice.notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
