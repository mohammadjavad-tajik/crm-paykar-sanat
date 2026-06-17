import { useEffect, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { format as formatJalali } from "date-fns-jalali";
import { useCreateInvoice, useUpdateInvoice, useGetInvoice, useListCustomers, getListInvoicesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm, useFieldArray } from "react-hook-form";
import { Plus, Trash2, ArrowRight, Pencil } from "lucide-react";
import { formatToman } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter, DrawerClose,
} from "@/components/ui/drawer";

type ItemDraft = { title: string; quantity: number; unit_price: number };

export default function InvoiceForm() {
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/invoices/:id/edit");
  const isEdit = match && params?.id;
  const invoiceId = Number(params?.id);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [itemDraft, setItemDraft] = useState<ItemDraft>({ title: "", quantity: 1, unit_price: 0 });

  const searchParams = new URLSearchParams(window.location.search);
  const defaultCustomerId = searchParams.get("customer_id");
  const defaultJobId = searchParams.get("job_id");

  const { data: invoice, isLoading: isInvoiceLoading } = useGetInvoice(invoiceId, {
    query: { enabled: !!isEdit },
  });
  const { data: customers } = useListCustomers();
  const createInvoice = useCreateInvoice();
  const updateInvoice = useUpdateInvoice();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const isoToDisplay = (iso: string) => iso.replace(/-/g, "/");
  const todayJalali = formatJalali(new Date(), "yyyy/MM/dd");

  const form = useForm({
    defaultValues: {
      title: "",
      customer_id: defaultCustomerId || "",
      date: todayJalali,
      discount: 0,
      notes: "",
      items: [{ title: "", quantity: 1, unit_price: 0 }],
    },
  });

  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: "items",
  });

  useEffect(() => {
    if (isEdit && invoice) {
      form.reset({
        title: invoice.title,
        customer_id: invoice.customer_id.toString(),
        date: isoToDisplay(invoice.date.split("T")[0]),
        discount: invoice.discount || 0,
        notes: invoice.notes || "",
        items: invoice.items,
      });
    }
  }, [isEdit, invoice, form]);

  const watchedItems = form.watch("items");
  const watchedDiscount = form.watch("discount") || 0;
  const subtotal = watchedItems.reduce(
    (sum, item) => sum + Number(item.quantity) * Number(item.unit_price),
    0
  );
  const total = subtotal - Number(watchedDiscount);

  const openAddDrawer = () => {
    setEditingIndex(null);
    setItemDraft({ title: "", quantity: 1, unit_price: 0 });
    setDrawerOpen(true);
  };

  const openEditDrawer = (index: number) => {
    setEditingIndex(index);
    const item = form.getValues(`items.${index}`);
    setItemDraft({ title: item.title, quantity: Number(item.quantity), unit_price: Number(item.unit_price) });
    setDrawerOpen(true);
  };

  const handleDrawerSave = () => {
    if (!itemDraft.title) return;
    if (editingIndex !== null) {
      update(editingIndex, itemDraft);
    } else {
      append(itemDraft);
    }
    setDrawerOpen(false);
  };

  const handleDateChange = (value: string, onChange: (v: string) => void) => {
    const digits = value.replace(/\D/g, "");
    let formatted = digits;
    if (digits.length > 4) formatted = digits.slice(0, 4) + "/" + digits.slice(4);
    if (digits.length > 6) formatted = digits.slice(0, 4) + "/" + digits.slice(4, 6) + "/" + digits.slice(6, 8);
    onChange(formatted);
  };

  const onSubmit = (data: any) => {
    const payload = {
      ...data,
      customer_id: Number(data.customer_id),
      job_id: null,
      date: data.date.replace(/\//g, "-"),
      discount: Number(data.discount),
      items: data.items.map((item: any) => ({
        ...item,
        quantity: Number(item.quantity),
        unit_price: Number(item.unit_price),
      })),
    };

    if (isEdit) {
      updateInvoice.mutate(
        { id: invoiceId, data: payload },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListInvoicesQueryKey() });
            toast({ title: "فاکتور ویرایش شد" });
            setLocation(`/invoices/${invoiceId}`);
          },
        }
      );
    } else {
      createInvoice.mutate(
        { data: payload },
        {
          onSuccess: (newInvoice) => {
            queryClient.invalidateQueries({ queryKey: getListInvoicesQueryKey() });
            toast({ title: "فاکتور ایجاد شد" });
            setLocation(`/invoices/${newInvoice.id}`);
          },
        }
      );
    }
  };

  if (isEdit && isInvoiceLoading) return <div>در حال بارگذاری...</div>;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => window.history.back()}>
          <ArrowRight className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">
          {isEdit ? "ویرایش فاکتور" : "فاکتور جدید"}
        </h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField control={form.control} name="title" render={({ field }) => (
                <FormItem>
                  <FormLabel>عنوان فاکتور</FormLabel>
                  <FormControl><Input {...field} required /></FormControl>
                </FormItem>
              )} />
              <FormField control={form.control} name="date" render={({ field }) => (
                <FormItem>
                  <FormLabel>تاریخ (سال/ماه/روز)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      inputMode="numeric"
                      placeholder="1403/01/15"
                      className="dir-ltr text-right"
                      maxLength={10}
                      onChange={(e) => handleDateChange(e.target.value, field.onChange)}
                      required
                    />
                  </FormControl>
                </FormItem>
              )} />
              <FormField control={form.control} name="customer_id" render={({ field }) => (
                <FormItem>
                  <FormLabel>مشتری</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="dir-rtl"><SelectValue placeholder="انتخاب مشتری" /></SelectTrigger>
                    </FormControl>
                    <SelectContent className="dir-rtl">
                      {customers?.map((c) => (
                        <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )} />
            </CardContent>
          </Card>

          {/* Items section */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-base font-bold">اقلام فاکتور</h3>
                {/* Desktop add button */}
                <Button
                  type="button" variant="outline" size="sm"
                  className="hidden md:flex"
                  onClick={() => append({ title: "", quantity: 1, unit_price: 0 })}
                  data-testid="button-add-item-desktop"
                >
                  <Plus className="h-4 w-4 ml-1" /> افزودن ردیف
                </Button>
                {/* Mobile add button → opens drawer */}
                <Button
                  type="button" variant="outline" size="sm"
                  className="md:hidden"
                  onClick={openAddDrawer}
                  data-testid="button-add-item-mobile"
                >
                  <Plus className="h-4 w-4 ml-1" /> افزودن ردیف
                </Button>
              </div>

              {/* Desktop: table */}
              <div className="hidden md:block">
                <div className="grid grid-cols-12 gap-4 mb-2 font-medium text-sm text-muted-foreground">
                  <div className="col-span-5 text-right">شرح کالا / خدمات</div>
                  <div className="col-span-2 text-center">تعداد</div>
                  <div className="col-span-3 text-center">فی (تومان)</div>
                  <div className="col-span-2 text-center">عملیات</div>
                </div>
                {fields.map((field, index) => (
                  <div key={field.id} className="grid grid-cols-12 gap-3 items-center mb-3">
                    <div className="col-span-5">
                      <Input {...form.register(`items.${index}.title`)} required placeholder="شرح کالا" />
                    </div>
                    <div className="col-span-2">
                      <Input type="number" min="1" className="dir-ltr text-center" {...form.register(`items.${index}.quantity`)} required />
                    </div>
                    <div className="col-span-3">
                      <Input type="number" className="dir-ltr text-center" {...form.register(`items.${index}.unit_price`)} required />
                    </div>
                    <div className="col-span-2 flex justify-center">
                      <Button
                        type="button" variant="ghost" size="icon"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => remove(index)}
                        disabled={fields.length === 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Mobile: cards */}
              <div className="md:hidden space-y-3">
                {fields.length === 0 && (
                  <p className="text-center text-sm text-muted-foreground py-4">هنوز ردیفی اضافه نشده</p>
                )}
                {fields.map((field, index) => {
                  const item = watchedItems[index];
                  return (
                    <div
                      key={field.id}
                      className="flex items-center gap-3 bg-muted/40 rounded-lg px-4 py-3 border border-border"
                      data-testid={`item-card-${index}`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{item?.title || "—"}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {Number(item?.quantity)} عدد × {Number(item?.unit_price).toLocaleString("fa-IR")} تومان
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          type="button" variant="ghost" size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-primary"
                          onClick={() => openEditDrawer(index)}
                          data-testid={`button-edit-item-${index}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button" variant="ghost" size="icon"
                          className="h-8 w-8 text-destructive hover:bg-destructive/10"
                          onClick={() => remove(index)}
                          disabled={fields.length === 1}
                          data-testid={`button-remove-item-${index}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Totals & Notes */}
          <Card>
            <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-8">
              <FormField control={form.control} name="notes" render={({ field }) => (
                <FormItem>
                  <FormLabel>توضیحات فاکتور</FormLabel>
                  <FormControl>
                    <Textarea {...field} className="min-h-[100px]" placeholder="شرایط پرداخت و ..." />
                  </FormControl>
                </FormItem>
              )} />
              <div className="space-y-4 bg-muted/50 p-5 rounded-lg">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">جمع کل:</span>
                  <span className="font-medium">{formatToman(subtotal)}</span>
                </div>
                <FormField control={form.control} name="discount" render={({ field }) => (
                  <FormItem className="flex items-center justify-between space-y-0">
                    <FormLabel className="text-muted-foreground font-normal text-sm">تخفیف (تومان):</FormLabel>
                    <FormControl>
                      <Input type="number" className="w-32 dir-ltr text-right" {...field} onChange={(e) => field.onChange(Number(e.target.value))} />
                    </FormControl>
                  </FormItem>
                )} />
                <div className="border-t pt-3 flex justify-between items-center font-bold text-base">
                  <span>مبلغ قابل پرداخت:</span>
                  <span className="text-primary">{formatToman(Math.max(0, total))}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => window.history.back()}>
              انصراف
            </Button>
            <Button type="submit" disabled={createInvoice.isPending || updateInvoice.isPending}>
              {isEdit ? "ذخیره ویرایش" : "ثبت فاکتور"}
            </Button>
          </div>
        </form>
      </Form>

      {/* Mobile item drawer */}
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent>
          <div className="mx-auto w-full max-w-sm">
            <DrawerHeader>
              <DrawerTitle>{editingIndex !== null ? "ویرایش ردیف" : "افزودن ردیف"}</DrawerTitle>
            </DrawerHeader>
            <div className="px-4 pb-4 space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">شرح کالا / خدمات</label>
                <Input
                  value={itemDraft.title}
                  onChange={(e) => setItemDraft((d) => ({ ...d, title: e.target.value }))}
                  placeholder="نام محصول یا خدمات"
                  data-testid="input-drawer-title"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">تعداد</label>
                <Input
                  type="number"
                  min="1"
                  className="dir-ltr text-center"
                  value={itemDraft.quantity}
                  onChange={(e) => setItemDraft((d) => ({ ...d, quantity: Number(e.target.value) }))}
                  data-testid="input-drawer-quantity"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">فی (تومان)</label>
                <Input
                  type="number"
                  className="dir-ltr text-center"
                  value={itemDraft.unit_price}
                  onChange={(e) => setItemDraft((d) => ({ ...d, unit_price: Number(e.target.value) }))}
                  data-testid="input-drawer-price"
                />
              </div>
              {itemDraft.quantity > 0 && itemDraft.unit_price > 0 && (
                <p className="text-sm text-muted-foreground text-center">
                  جمع: {(itemDraft.quantity * itemDraft.unit_price).toLocaleString("fa-IR")} تومان
                </p>
              )}
            </div>
            <DrawerFooter>
              <Button onClick={handleDrawerSave} disabled={!itemDraft.title} data-testid="button-drawer-save">
                {editingIndex !== null ? "ذخیره تغییرات" : "افزودن ردیف"}
              </Button>
              <DrawerClose asChild>
                <Button variant="outline">انصراف</Button>
              </DrawerClose>
            </DrawerFooter>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
