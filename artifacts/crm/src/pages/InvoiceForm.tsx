import { useEffect, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { format as formatJalali } from "date-fns-jalali";
import {
  useCreateInvoice, useUpdateInvoice, useGetInvoice, useListCustomers,
  useListEquipment, useListEquipmentSuppliers, useListPanels, useGetPanel,
  getListInvoicesQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm, useFieldArray } from "react-hook-form";
import { Plus, Trash2, ArrowRight, Pencil, Cpu, PanelTop, Search } from "lucide-react";
import { formatToman } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useManagerAccess } from "@/hooks/useManagerAccess";
import {
  Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter, DrawerClose,
} from "@/components/ui/drawer";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

type ItemDraft = {
  title: string;
  quantity: number;
  unit_price: number;
  brand?: string | null;
  equipment_id?: number | null;
  supplier_id?: number | null;
  purchase_price?: number | null;
};

function EquipmentPickerDialog({
  open, onClose, onSelect,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (eq: any, supplierLink: any | null) => void;
}) {
  const [search, setSearch] = useState("");
  const [selectedEq, setSelectedEq] = useState<any | null>(null);

  const { data: equipments } = useListEquipment({ search: search || undefined });
  const { data: supplierLinks } = useListEquipmentSuppliers(selectedEq?.id ?? 0, {
    query: { enabled: !!selectedEq },
  });

  const handleConfirm = (link: any | null) => {
    onSelect(selectedEq, link);
    setSelectedEq(null);
    setSearch("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { setSelectedEq(null); setSearch(""); onClose(); } }}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Cpu className="h-4 w-4" /> انتخاب تجهیز از کاتالوگ
          </DialogTitle>
        </DialogHeader>

        {!selectedEq ? (
          <div className="flex-1 overflow-hidden flex flex-col gap-3">
            <div className="relative">
              <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="جستجو (نام، دسته، برند، مشخصات)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pr-9"
                autoFocus
              />
            </div>
            <div className="overflow-y-auto flex-1 max-h-[50vh] space-y-1.5">
              {(equipments ?? []).length === 0 ? (
                <p className="text-center text-muted-foreground text-sm py-6">تجهیزی یافت نشد</p>
              ) : (
                (equipments ?? []).map((eq) => (
                  <button
                    key={eq.id}
                    className="w-full text-right rounded-lg border border-border px-4 py-3 hover:bg-muted/50 transition-colors"
                    onClick={() => setSelectedEq(eq)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{eq.name}</span>
                      {(eq as any).category_name && (
                        <Badge variant="secondary" className="text-xs">{(eq as any).category_name}</Badge>
                      )}
                    </div>
                    {(eq as any).default_brand && (
                      <p className="text-xs text-muted-foreground mt-0.5">برند پیش‌فرض: {(eq as any).default_brand}</p>
                    )}
                    {(eq as any).min_sell_price != null && (
                      <p className="text-xs text-emerald-600 mt-0.5">از {formatToman((eq as any).min_sell_price)}</p>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 space-y-4">
            <div className="bg-muted/40 rounded-lg p-3">
              <p className="font-medium">{selectedEq.name}</p>
              {(selectedEq as any).category_name && (
                <p className="text-xs text-muted-foreground">{(selectedEq as any).category_name}</p>
              )}
            </div>

            <div>
              <p className="text-sm font-medium mb-2">انتخاب تامین‌کننده و برند:</p>
              {(!supplierLinks || supplierLinks.length === 0) ? (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">تامین‌کننده‌ای ثبت نشده</p>
                  <Button className="w-full" onClick={() => handleConfirm(null)}>
                    افزودن بدون تامین‌کننده
                  </Button>
                </div>
              ) : (
                <div className="space-y-2 max-h-52 overflow-y-auto">
                  {supplierLinks.map((link) => (
                    <button
                      key={link.id}
                      className="w-full text-right rounded-lg border border-border px-4 py-3 hover:bg-muted/50 transition-colors"
                      onClick={() => handleConfirm(link)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-medium text-sm">{link.supplier_name || "—"}</span>
                          {link.brand && <span className="text-xs text-muted-foreground mr-2">({link.brand})</span>}
                          {link.is_default && (
                            <Badge className="mr-2 text-xs bg-blue-100 text-blue-700 border-blue-200">پیش‌فرض</Badge>
                          )}
                        </div>
                        <div className="text-left text-xs">
                          <p>فروش: <span className="text-emerald-600 font-medium">{formatToman(link.sell_price)}</span></p>
                          <p>خرید: <span className="font-medium">{formatToman(link.purchase_price)}</span></p>
                        </div>
                      </div>
                    </button>
                  ))}
                  <button
                    className="w-full text-right rounded-lg border border-dashed border-border px-4 py-2.5 text-sm text-muted-foreground hover:bg-muted/30 transition-colors"
                    onClick={() => handleConfirm(null)}
                  >
                    بدون انتخاب تامین‌کننده
                  </button>
                </div>
              )}
            </div>

            <Button variant="outline" className="w-full" onClick={() => setSelectedEq(null)}>
              ← برگشت به لیست
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function PanelPickerDialog({
  open, onClose, onSelect,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (items: ItemDraft[]) => void;
}) {
  const [selectedPanelId, setSelectedPanelId] = useState<number | null>(null);
  const { data: panels } = useListPanels();
  const { data: panel } = useGetPanel(selectedPanelId ?? 0, {
    query: { enabled: !!selectedPanelId },
  });

  const handleConfirm = () => {
    if (!panel) return;
    const items: ItemDraft[] = ((panel as any).items ?? []).map((item: any) => ({
      title: item.equipment_name || `تجهیز ${item.equipment_id}`,
      quantity: Number(item.quantity),
      unit_price: 0,
      brand: item.brand ?? null,
      equipment_id: item.equipment_id,
      supplier_id: null,
      purchase_price: null,
    }));
    onSelect(items);
    setSelectedPanelId(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { setSelectedPanelId(null); onClose(); } }}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PanelTop className="h-4 w-4" /> افزودن از تابلو
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 mt-2">
          <p className="text-sm text-muted-foreground">
            تابلویی انتخاب کنید تا اقلام آن به فاکتور اضافه شود:
          </p>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {(panels ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">تابلویی ثبت نشده</p>
            ) : (
              (panels ?? []).map((p) => (
                <button
                  key={p.id}
                  className={`w-full text-right rounded-lg border px-4 py-3 transition-colors ${
                    selectedPanelId === p.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-muted/50"
                  }`}
                  onClick={() => setSelectedPanelId(p.id)}
                >
                  <p className="font-medium text-sm">{p.name}</p>
                  {p.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{p.description}</p>
                  )}
                </button>
              ))
            )}
          </div>
          {selectedPanelId && panel && (
            <div className="bg-muted/40 rounded-lg p-3 text-sm">
              <p className="font-medium mb-1">اقلام این تابلو:</p>
              <ul className="space-y-0.5 text-muted-foreground text-xs">
                {((panel as any).items ?? []).map((item: any, i: number) => (
                  <li key={i}>{item.equipment_name || "—"} × {item.quantity}</li>
                ))}
              </ul>
            </div>
          )}
          <div className="flex gap-2 pt-1">
            <Button variant="outline" className="flex-1" onClick={onClose}>انصراف</Button>
            <Button className="flex-1" disabled={!selectedPanelId} onClick={handleConfirm}>
              افزودن به فاکتور
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function InvoiceForm() {
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/invoices/:id/edit");
  const isEdit = match && params?.id;
  const invoiceId = Number(params?.id);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [itemDraft, setItemDraft] = useState<ItemDraft>({
    title: "", quantity: 1, unit_price: 0, brand: "", equipment_id: null, supplier_id: null, purchase_price: null,
  });
  const [eqPickerOpen, setEqPickerOpen] = useState(false);
  const [eqPickerForIndex, setEqPickerForIndex] = useState<number | null>(null);
  const [panelPickerOpen, setPanelPickerOpen] = useState(false);

  const searchParams = new URLSearchParams(window.location.search);
  const defaultCustomerId = searchParams.get("customer_id");

  const { data: invoice, isLoading: isInvoiceLoading } = useGetInvoice(invoiceId, {
    query: { enabled: !!isEdit },
  });
  const { data: customers } = useListCustomers();
  const createInvoice = useCreateInvoice();
  const updateInvoice = useUpdateInvoice();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const todayJalali = formatJalali(new Date(), "yyyy/MM/dd");
  const isoToDisplay = (iso: string) => iso.replace(/-/g, "/");

  const form = useForm({
    defaultValues: {
      title: "",
      customer_id: defaultCustomerId || "",
      date: todayJalali,
      discount: 0,
      notes: "",
      items: [] as ItemDraft[],
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
        items: invoice.items.map((i) => ({
          title: i.title,
          quantity: i.quantity,
          unit_price: i.unit_price,
          brand: (i as any).brand ?? null,
          equipment_id: (i as any).equipment_id ?? null,
          supplier_id: (i as any).supplier_id ?? null,
          purchase_price: (i as any).purchase_price ?? null,
        })),
      });
    }
  }, [isEdit, invoice]);

  const watchedItems = form.watch("items");
  const watchedDiscount = form.watch("discount") || 0;
  const subtotal = watchedItems.reduce(
    (sum, item) => sum + Number(item.quantity) * Number(item.unit_price),
    0
  );
  const totalPurchase = watchedItems.reduce(
    (sum, item) =>
      sum + (item.purchase_price != null ? Number(item.purchase_price) * Number(item.quantity) : 0),
    0
  );
  const hasAnyPurchase = watchedItems.some(
    (i) => i.purchase_price != null && Number(i.purchase_price) > 0
  );
  const total = subtotal - Number(watchedDiscount);
  const profit = total - totalPurchase;
  const isManager = useManagerAccess();

  const openAddDrawer = () => {
    setEditingIndex(null);
    setItemDraft({ title: "", quantity: 1, unit_price: 0, brand: "", equipment_id: null, supplier_id: null, purchase_price: null });
    setDrawerOpen(true);
  };

  const openEditDrawer = (index: number) => {
    const item = form.getValues(`items.${index}`) as any;
    setEditingIndex(index);
    setItemDraft({
      title: item.title,
      quantity: Number(item.quantity),
      unit_price: Number(item.unit_price),
      brand: item.brand ?? "",
      equipment_id: item.equipment_id ?? null,
      supplier_id: item.supplier_id ?? null,
      purchase_price: item.purchase_price ?? null,
    });
    setDrawerOpen(true);
  };

  const handleDrawerSave = () => {
    if (!itemDraft.title) return;
    const payload: ItemDraft = {
      title: itemDraft.title,
      quantity: itemDraft.quantity,
      unit_price: itemDraft.unit_price,
      brand: itemDraft.brand || null,
      equipment_id: itemDraft.equipment_id ?? null,
      supplier_id: itemDraft.supplier_id ?? null,
      purchase_price: itemDraft.purchase_price ?? null,
    };
    if (editingIndex !== null) {
      update(editingIndex, payload);
    } else {
      append(payload);
    }
    setDrawerOpen(false);
  };

  const handleEqPickFromDrawer = (eq: any, link: any | null) => {
    setItemDraft((d) => ({
      ...d,
      title: eq.name,
      equipment_id: eq.id,
      brand: link?.brand ?? (eq as any).default_brand ?? d.brand ?? "",
      unit_price: link?.sell_price ? Number(link.sell_price) : d.unit_price,
      purchase_price: link?.purchase_price ? Number(link.purchase_price) : d.purchase_price,
      supplier_id: link?.supplier_id ?? d.supplier_id ?? null,
    }));
    setDrawerOpen(true);
  };

  const handleEqPickForDesktop = (index: number, eq: any, link: any | null) => {
    update(index, {
      title: eq.name,
      quantity: form.getValues(`items.${index}`).quantity,
      unit_price: link?.sell_price ? Number(link.sell_price) : form.getValues(`items.${index}`).unit_price,
      brand: link?.brand ?? (eq as any).default_brand ?? null,
      equipment_id: eq.id,
      supplier_id: link?.supplier_id ?? null,
      purchase_price: link?.purchase_price ? Number(link.purchase_price) : null,
    });
  };

  const handlePanelPick = (newItems: ItemDraft[]) => {
    newItems.forEach((item) => append(item));
    toast({ title: `${newItems.length} قطعه از تابلو اضافه شد` });
  };

  const handleDateChange = (value: string, onChange: (v: string) => void) => {
    const digits = value.replace(/\D/g, "");
    let formatted = digits;
    if (digits.length > 4) formatted = digits.slice(0, 4) + "/" + digits.slice(4);
    if (digits.length > 6)
      formatted = digits.slice(0, 4) + "/" + digits.slice(4, 6) + "/" + digits.slice(6, 8);
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
        title: item.title,
        quantity: Number(item.quantity),
        unit_price: Number(item.unit_price),
        brand: item.brand || null,
        equipment_id: item.equipment_id ?? null,
        supplier_id: item.supplier_id ?? null,
        purchase_price: item.purchase_price != null ? Number(item.purchase_price) : null,
      })),
    };

    if (!payload.customer_id) {
      toast({ title: "لطفاً مشتری را انتخاب کنید", variant: "destructive" });
      return;
    }
    if (payload.items.length === 0) {
      toast({ title: "حداقل یک قلم به فاکتور اضافه کنید", variant: "destructive" });
      return;
    }

    if (isEdit) {
      updateInvoice.mutate(
        { id: invoiceId, data: payload },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListInvoicesQueryKey() });
            toast({ title: "فاکتور ویرایش شد" });
            setLocation(`/invoices/${invoiceId}`);
          },
          onError: (err: any) => {
            toast({ title: "خطا در ویرایش فاکتور", description: err?.message ?? "مشکلی پیش آمد", variant: "destructive" });
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
          onError: (err: any) => {
            toast({ title: "خطا در ثبت فاکتور", description: err?.message ?? "مشکلی پیش آمد", variant: "destructive" });
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
          {/* Header fields */}
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

          {/* Items */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex justify-between items-center flex-wrap gap-2">
                <h3 className="text-base font-bold">اقلام فاکتور</h3>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    type="button" variant="outline" size="sm"
                    onClick={() => setPanelPickerOpen(true)}
                  >
                    <PanelTop className="h-4 w-4 ml-1" /> از تابلو
                  </Button>
                  {/* Equipment picker - desktop */}
                  <Button
                    type="button" variant="outline" size="sm"
                    className="hidden md:flex border-primary/40 text-primary hover:bg-primary/10"
                    onClick={() => { setEqPickerForIndex(-1); setEqPickerOpen(true); }}
                  >
                    <Cpu className="h-4 w-4 ml-1" /> از کاتالوگ
                  </Button>
                  {/* Equipment picker - mobile */}
                  <Button
                    type="button" variant="outline" size="sm"
                    className="md:hidden border-primary/40 text-primary hover:bg-primary/10"
                    onClick={() => { setEqPickerForIndex(null); setEqPickerOpen(true); }}
                  >
                    <Cpu className="h-4 w-4 ml-1" /> از کاتالوگ
                  </Button>
                  {/* Desktop add row */}
                  <Button
                    type="button" variant="outline" size="sm"
                    className="hidden md:flex"
                    onClick={() =>
                      append({ title: "", quantity: 1, unit_price: 0, brand: null, equipment_id: null, supplier_id: null, purchase_price: null })
                    }
                  >
                    <Plus className="h-4 w-4 ml-1" /> افزودن ردیف
                  </Button>
                  {/* Mobile add row */}
                  <Button
                    type="button" variant="outline" size="sm"
                    className="md:hidden"
                    onClick={openAddDrawer}
                  >
                    <Plus className="h-4 w-4 ml-1" /> افزودن ردیف
                  </Button>
                </div>
              </div>

              {/* ─── Desktop table ─── */}
              <div className="hidden md:block">
                <div className="grid grid-cols-12 gap-2 mb-2 text-xs font-medium text-muted-foreground">
                  <div className="col-span-6 text-right">شرح کالا / خدمات</div>
                  <div className="col-span-1 text-center">تعداد</div>
                  <div className="col-span-3 text-center">فی (تومان)</div>
                  <div className="col-span-2 text-center">عملیات</div>
                </div>
                {fields.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">هنوز ردیفی اضافه نشده</p>
                )}
                {fields.map((field, index) => (
                  <div key={field.id} className="grid grid-cols-12 gap-2 items-center mb-3">
                    <div className="col-span-6">
                      <Input
                        {...form.register(`items.${index}.title`)}
                        required
                        placeholder="شرح کالا"
                      />
                    </div>
                    <div className="col-span-1">
                      <Input
                        type="number" min="1"
                        className="dir-ltr text-center"
                        {...form.register(`items.${index}.quantity`)}
                        required
                      />
                    </div>
                    <div className="col-span-3">
                      <Input
                        type="number"
                        className="dir-ltr text-center"
                        {...form.register(`items.${index}.unit_price`)}
                        required
                      />
                    </div>
                    <div className="col-span-2 flex justify-center gap-1">
                      <Button
                        type="button" variant="outline" size="icon"
                        className="h-8 w-8 text-primary hover:bg-primary/10 border-primary/30"
                        title="انتخاب از کاتالوگ"
                        onClick={() => {
                          setEqPickerForIndex(index);
                          setEqPickerOpen(true);
                        }}
                      >
                        <Cpu className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button" variant="ghost" size="icon"
                        className="h-8 w-8 text-destructive hover:bg-destructive/10"
                        onClick={() => remove(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* ─── Mobile cards ─── */}
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
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button" variant="ghost" size="icon"
                          className="h-8 w-8 text-destructive hover:bg-destructive/10"
                          onClick={() => remove(index)}
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
                      <Input
                        type="number"
                        className="w-32 dir-ltr text-right"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                  </FormItem>
                )} />
                {hasAnyPurchase && isManager && (
                  <div className="flex justify-between text-sm border-t pt-2">
                    <span className="text-muted-foreground">سود خالص:</span>
                    <span className={profit >= 0 ? "font-medium text-emerald-600" : "font-medium text-rose-600"}>
                      {formatToman(Math.abs(profit))} {profit < 0 ? "(ضرر)" : ""}
                    </span>
                  </div>
                )}
                <div className="border-t pt-3 flex justify-between items-center font-bold text-base">
                  <span>مبلغ قابل پرداخت:</span>
                  <span className="text-primary">{formatToman(Math.max(0, total))}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => window.history.back()}>انصراف</Button>
            <Button type="submit" disabled={createInvoice.isPending || updateInvoice.isPending}>
              {isEdit ? "ذخیره ویرایش" : "ثبت فاکتور"}
            </Button>
          </div>
        </form>
      </Form>

      {/* ─── Equipment Picker Dialog ─── */}
      <EquipmentPickerDialog
        open={eqPickerOpen}
        onClose={() => { setEqPickerOpen(false); setEqPickerForIndex(null); }}
        onSelect={(eq, link) => {
          if (eqPickerForIndex === -1) {
            // append new row
            append({
              title: eq.name,
              quantity: 1,
              unit_price: link?.sell_price ? Number(link.sell_price) : 0,
              brand: link?.brand ?? (eq as any).default_brand ?? null,
              equipment_id: eq.id,
              supplier_id: link?.supplier_id ?? null,
              purchase_price: link?.purchase_price ? Number(link.purchase_price) : null,
            });
            setEqPickerForIndex(null);
          } else if (eqPickerForIndex !== null) {
            handleEqPickForDesktop(eqPickerForIndex, eq, link);
            setEqPickerForIndex(null);
          } else {
            handleEqPickFromDrawer(eq, link);
          }
        }}
      />

      {/* ─── Panel Picker Dialog ─── */}
      <PanelPickerDialog
        open={panelPickerOpen}
        onClose={() => setPanelPickerOpen(false)}
        onSelect={handlePanelPick}
      />

      {/* ─── Mobile Item Drawer ─── */}
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent>
          <div className="mx-auto w-full max-w-sm">
            <DrawerHeader>
              <DrawerTitle>{editingIndex !== null ? "ویرایش ردیف" : "افزودن ردیف"}</DrawerTitle>
            </DrawerHeader>
            <div className="px-4 pb-4 space-y-4">
              <Button
                type="button" variant="outline" className="w-full gap-2"
                onClick={() => { setDrawerOpen(false); setEqPickerForIndex(null); setEqPickerOpen(true); }}
              >
                <Cpu className="h-4 w-4" /> انتخاب از کاتالوگ تجهیزات
              </Button>
              <div>
                <label className="text-sm font-medium mb-1 block">شرح کالا / خدمات</label>
                <Input
                  value={itemDraft.title}
                  onChange={(e) => setItemDraft((d) => ({ ...d, title: e.target.value }))}
                  placeholder="نام محصول یا خدمات"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">تعداد</label>
                <Input
                  type="number" min="1"
                  className="dir-ltr text-center"
                  value={itemDraft.quantity}
                  onChange={(e) => setItemDraft((d) => ({ ...d, quantity: Number(e.target.value) }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">فی (تومان)</label>
                <Input
                  type="number"
                  className="dir-ltr text-center"
                  value={itemDraft.unit_price}
                  onChange={(e) => setItemDraft((d) => ({ ...d, unit_price: Number(e.target.value) }))}
                />
              </div>
              {itemDraft.quantity > 0 && itemDraft.unit_price > 0 && (
                <p className="text-sm text-muted-foreground text-center">
                  جمع: {(itemDraft.quantity * itemDraft.unit_price).toLocaleString("fa-IR")} تومان
                </p>
              )}
            </div>
            <DrawerFooter>
              <Button onClick={handleDrawerSave} disabled={!itemDraft.title}>
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
