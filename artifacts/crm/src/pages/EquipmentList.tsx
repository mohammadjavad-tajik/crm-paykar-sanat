import { useState } from "react";
import {
  useListEquipment, useCreateEquipment, useUpdateEquipment, useDeleteEquipment,
  useListEquipmentCategories, useCreateEquipmentCategory,
  useListSuppliers, useListEquipmentSuppliers, getListEquipmentSuppliersQueryKey,
  useAddEquipmentSupplier, useUpdateEquipmentSupplier, useDeleteEquipmentSupplier,
  getListEquipmentQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Plus, Trash2, Pencil, Search, ChevronDown, ChevronUp,
  Tag, ChevronLeft, Building2, ExternalLink,
} from "lucide-react";
import { formatToman } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { useForm, useFieldArray } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

type SpecEntry = { key: string; value: string };
type EquipmentFormData = {
  name: string;
  category_id?: string;
  description?: string;
  default_brand?: string;
  website_price?: number | null;
  product_link?: string;
  specs: SpecEntry[];
};
type SupplierLinkFormData = {
  supplier_id: string;
  purchase_price: number;
  is_default: boolean;
  notes?: string;
};

type Category = { id: number; name: string; parent_id?: number | null; created_at: string };

function buildCategoryTree(cats: Category[]): Array<Category & { depth: number }> {
  const result: Array<Category & { depth: number }> = [];
  const roots = cats.filter((c) => !c.parent_id);

  function addBranch(cat: Category, depth: number) {
    result.push({ ...cat, depth });
    const children = cats
      .filter((c) => c.parent_id === cat.id)
      .sort((a, b) => a.name.localeCompare(b.name));
    children.forEach((child) => addBranch(child, depth + 1));
  }

  roots.sort((a, b) => a.name.localeCompare(b.name));
  roots.forEach((r) => addBranch(r, 0));

  const orphans = cats.filter((c) => c.parent_id && !cats.find((p) => p.id === c.parent_id));
  orphans.forEach((o) => result.push({ ...o, depth: 0 }));

  return result;
}

function getSubtreeIds(catId: number, cats: Category[]): number[] {
  const ids: number[] = [catId];
  cats.filter((c) => c.parent_id === catId).forEach((child) => {
    ids.push(...getSubtreeIds(child.id, cats));
  });
  return ids;
}

function TreeSelectItems({ cats, allowNone = true }: { cats: Category[]; allowNone?: boolean }) {
  const tree = buildCategoryTree(cats);
  return (
    <>
      {allowNone && <SelectItem value="none">بدون دسته</SelectItem>}
      {tree.map((c) => (
        <SelectItem key={c.id} value={String(c.id)}>
          <span style={{ paddingRight: `${c.depth * 14}px` }} className="inline-flex items-center gap-1">
            {c.depth > 0 && <ChevronLeft className="h-3 w-3 text-muted-foreground shrink-0" />}
            {c.name}
          </span>
        </SelectItem>
      ))}
    </>
  );
}

function EquipmentForm({
  defaultValues, onSubmit, isPending, submitLabel, categories,
}: {
  defaultValues: EquipmentFormData;
  onSubmit: (data: EquipmentFormData) => void;
  isPending: boolean;
  submitLabel: string;
  categories: Category[];
}) {
  const form = useForm<EquipmentFormData>({ defaultValues });
  const { fields, append, remove } = useFieldArray({ control: form.control, name: "specs" });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-2">
        <FormField control={form.control} name="name" render={({ field }) => (
          <FormItem><FormLabel>نام تجهیز</FormLabel><FormControl><Input {...field} required /></FormControl></FormItem>
        )} />
        <FormField control={form.control} name="category_id" render={({ field }) => (
          <FormItem>
            <FormLabel>دسته‌بندی</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger className="dir-rtl"><SelectValue placeholder="انتخاب دسته" /></SelectTrigger>
              </FormControl>
              <SelectContent className="dir-rtl">
                <TreeSelectItems cats={categories} />
              </SelectContent>
            </Select>
          </FormItem>
        )} />
        <FormField control={form.control} name="description" render={({ field }) => (
          <FormItem><FormLabel>توضیحات</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
        )} />

        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="default_brand" render={({ field }) => (
            <FormItem><FormLabel>برند</FormLabel><FormControl><Input {...field} placeholder="مثلاً: ABB, Siemens" /></FormControl></FormItem>
          )} />
          <FormField control={form.control} name="website_price" render={({ field }) => (
            <FormItem>
              <FormLabel>قیمت سایت (تومان)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  className="dir-ltr text-right"
                  placeholder="۰"
                  value={field.value ?? ""}
                  onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                />
              </FormControl>
            </FormItem>
          )} />
        </div>

        <FormField control={form.control} name="product_link" render={({ field }) => (
          <FormItem>
            <FormLabel>لینک محصول</FormLabel>
            <FormControl>
              <Input {...field} className="dir-ltr" placeholder="https://..." type="url" />
            </FormControl>
          </FormItem>
        )} />

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-medium leading-none">مشخصات فنی</label>
            <Button type="button" variant="outline" size="sm" onClick={() => append({ key: "", value: "" })}>
              <Plus className="h-3.5 w-3.5 ml-1" /> افزودن مشخصه
            </Button>
          </div>
          {fields.map((f, i) => (
            <div key={f.id} className="flex gap-2 mb-2">
              <Input {...form.register(`specs.${i}.key`)} placeholder="نام مشخصه (مثلاً: توان)" className="flex-1" />
              <Input {...form.register(`specs.${i}.value`)} placeholder="مقدار (مثلاً: ۱.۵ کیلووات)" className="flex-1" />
              <Button type="button" variant="ghost" size="icon" className="text-destructive" onClick={() => remove(i)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        <div className="flex justify-end pt-2">
          <Button type="submit" disabled={isPending}>{isPending ? "در حال ثبت..." : submitLabel}</Button>
        </div>
      </form>
    </Form>
  );
}

function SupplierLinkForm({
  defaultValues, onSubmit, isPending, submitLabel, suppliers,
}: {
  defaultValues: SupplierLinkFormData;
  onSubmit: (data: SupplierLinkFormData) => void;
  isPending: boolean;
  submitLabel: string;
  suppliers: Array<{ id: number; name: string }>;
}) {
  const form = useForm<SupplierLinkFormData>({ defaultValues });
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-2">
        <FormField control={form.control} name="supplier_id" render={({ field }) => (
          <FormItem>
            <FormLabel>تامین‌کننده</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger className="dir-rtl"><SelectValue placeholder="انتخاب تامین‌کننده" /></SelectTrigger>
              </FormControl>
              <SelectContent className="dir-rtl">
                {suppliers.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormItem>
        )} />
        <FormField control={form.control} name="purchase_price" render={({ field }) => (
          <FormItem>
            <FormLabel>قیمت خرید (تومان)</FormLabel>
            <FormControl>
              <Input type="number" className="dir-ltr text-right" {...field} onChange={(e) => field.onChange(Number(e.target.value))} />
            </FormControl>
          </FormItem>
        )} />
        <FormField control={form.control} name="notes" render={({ field }) => (
          <FormItem><FormLabel>یادداشت</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
        )} />
        <div className="flex justify-end pt-2">
          <Button type="submit" disabled={isPending}>{isPending ? "در حال ثبت..." : submitLabel}</Button>
        </div>
      </form>
    </Form>
  );
}

function SuppliersDialog({
  open, onClose, equipment, suppliers,
}: {
  open: boolean;
  onClose: () => void;
  equipment: any;
  suppliers: Array<{ id: number; name: string }>;
}) {
  const [addOpen, setAddOpen] = useState(false);
  const [editLink, setEditLink] = useState<any | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: links, isLoading } = useListEquipmentSuppliers(equipment?.id ?? 0, {
    query: { enabled: open && !!equipment },
  });

  const addLinkMutation = useAddEquipmentSupplier();
  const updateLinkMutation = useUpdateEquipmentSupplier();
  const deleteLinkMutation = useDeleteEquipmentSupplier();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: getListEquipmentSuppliersQueryKey(equipment.id) });
    queryClient.invalidateQueries({ queryKey: getListEquipmentQueryKey() });
  };

  const handleAdd = (data: SupplierLinkFormData) => {
    addLinkMutation.mutate({
      id: equipment.id,
      data: {
        supplier_id: Number(data.supplier_id),
        purchase_price: data.purchase_price,
        sell_price: 0,
        is_default: data.is_default,
        notes: data.notes,
      },
    }, {
      onSuccess: () => {
        invalidate();
        setAddOpen(false);
        toast({ title: "تامین‌کننده اضافه شد" });
      },
      onError: () => toast({ title: "خطا در افزودن", variant: "destructive" }),
    });
  };

  const handleEdit = (data: SupplierLinkFormData) => {
    if (!editLink) return;
    updateLinkMutation.mutate({
      id: equipment.id,
      linkId: editLink.id,
      data: {
        purchase_price: data.purchase_price,
        sell_price: editLink.sell_price,
        is_default: data.is_default,
        notes: data.notes,
      },
    }, {
      onSuccess: () => {
        invalidate();
        setEditLink(null);
        toast({ title: "تامین‌کننده ویرایش شد" });
      },
      onError: () => toast({ title: "خطا در ویرایش", variant: "destructive" }),
    });
  };

  const handleDelete = (linkId: number) => {
    if (!confirm("آیا این تامین‌کننده حذف شود؟")) return;
    deleteLinkMutation.mutate({ id: equipment.id, linkId }, {
      onSuccess: () => {
        invalidate();
        toast({ title: "حذف شد" });
      },
    });
  };

  if (!equipment) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            تامین‌کنندگان: {equipment.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              {links?.length ? `${links.length} تامین‌کننده ثبت شده` : "تامین‌کننده‌ای ثبت نشده"}
            </p>
            <Button variant="outline" size="sm" onClick={() => setAddOpen(true)}>
              <Plus className="h-3.5 w-3.5 ml-1" /> افزودن تامین‌کننده
            </Button>
          </div>

          {isLoading ? (
            <Skeleton className="h-20 w-full" />
          ) : !links || links.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm bg-muted/30 rounded-lg">
              هنوز تامین‌کننده‌ای برای این تجهیز ثبت نشده
            </div>
          ) : (
            <div className="space-y-2">
              {links.map((link) => (
                <div key={link.id} className="bg-card border border-border rounded-lg px-4 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <a
                          href={`/suppliers`}
                          className="font-medium text-sm text-blue-600 hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {link.supplier_name || "—"}
                        </a>
                        {(link as any).supplier_phone && (
                          <a
                            href={`tel:${(link as any).supplier_phone}`}
                            className="text-xs text-emerald-600 hover:underline flex items-center gap-0.5"
                            onClick={(e) => e.stopPropagation()}
                          >
                            📞 {(link as any).supplier_phone}
                          </a>
                        )}
                        {link.is_default && <Badge className="text-xs bg-blue-100 text-blue-700 border-blue-200">پیش‌فرض</Badge>}
                      </div>
                      <div className="flex gap-4 text-xs text-muted-foreground">
                        <span>خرید: <span className="text-foreground font-medium">{formatToman(link.purchase_price)}</span></span>
                      </div>
                      {link.notes && <p className="text-xs text-muted-foreground">{link.notes}</p>}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button
                        variant="outline" size="icon"
                        className="h-7 w-7 border-blue-200 bg-blue-50 text-blue-500 hover:bg-blue-100"
                        onClick={() => setEditLink(link)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost" size="icon"
                        className="h-7 w-7 text-destructive hover:bg-destructive/10"
                        onClick={() => handleDelete(link.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>

      <Dialog open={addOpen} onOpenChange={(o) => !o && setAddOpen(false)}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader><DialogTitle>افزودن تامین‌کننده</DialogTitle></DialogHeader>
          <SupplierLinkForm
            defaultValues={{ supplier_id: "", purchase_price: 0, is_default: false, notes: "" }}
            onSubmit={handleAdd}
            isPending={addLinkMutation.isPending}
            submitLabel="ثبت"
            suppliers={suppliers}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editLink} onOpenChange={(o) => !o && setEditLink(null)}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader><DialogTitle>ویرایش تامین‌کننده</DialogTitle></DialogHeader>
          {editLink && (
            <SupplierLinkForm
              defaultValues={{
                supplier_id: String(editLink.supplier_id),
                purchase_price: editLink.purchase_price,
                is_default: editLink.is_default,
                notes: editLink.notes ?? "",
              }}
              onSubmit={handleEdit}
              isPending={updateLinkMutation.isPending}
              submitLabel="ذخیره تغییرات"
              suppliers={suppliers}
            />
          )}
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}

function EquipmentRow({ equipment, categories, suppliers, onEdit, onDelete }: {
  equipment: any;
  categories: Category[];
  suppliers: Array<{ id: number; name: string }>;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [suppliersOpen, setSuppliersOpen] = useState(false);

  const specs = (equipment.specs as SpecEntry[]) ?? [];

  const parentCat = categories.find((c) => c.id === equipment.category_id);
  const grandParentCat = parentCat?.parent_id ? categories.find((c) => c.id === parentCat.parent_id) : null;
  const categoryLabel = grandParentCat
    ? `${grandParentCat.name} / ${parentCat?.name}`
    : equipment.category_name;

  return (
    <>
      <TableRow className="hover:bg-muted/30 transition-colors">
        <TableCell className="pr-4">
          <div className="flex items-center gap-2">
            {specs.length > 0 && (
              <button onClick={() => setExpanded((e) => !e)} className="text-muted-foreground hover:text-foreground">
                {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
            )}
            <div>
              <span className="font-medium">{equipment.name}</span>
              {equipment.product_link && (
                <a
                  href={equipment.product_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mr-2 text-blue-500 hover:text-blue-600 inline-flex items-center"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
          </div>
        </TableCell>
        <TableCell className="text-center">
          {categoryLabel ? (
            <Badge variant="secondary" className="text-xs">{categoryLabel}</Badge>
          ) : <span className="text-muted-foreground text-sm">—</span>}
        </TableCell>
        <TableCell className="text-center text-sm">
          {equipment.default_brand || <span className="text-muted-foreground">—</span>}
        </TableCell>
        <TableCell className="text-center text-sm">
          {equipment.website_price != null ? (
            <span className="text-blue-600 font-medium">{formatToman(Number(equipment.website_price))}</span>
          ) : <span className="text-muted-foreground">—</span>}
        </TableCell>
        <TableCell className="text-center text-sm">
          {equipment.min_purchase_price != null ? (
            <span className="text-amber-600 font-medium">{formatToman(equipment.min_purchase_price)}</span>
          ) : <span className="text-muted-foreground">—</span>}
        </TableCell>
        <TableCell className="text-center text-sm">
          {equipment.min_sell_price != null ? (
            <span className="text-emerald-600 font-medium">{formatToman(equipment.min_sell_price)}</span>
          ) : <span className="text-muted-foreground">—</span>}
        </TableCell>
        <TableCell className="text-center">
          <div className="flex items-center justify-center gap-1">
            <Button
              variant="outline" size="sm"
              className="h-8 px-2 text-xs border-purple-200 bg-purple-50 text-purple-600 hover:bg-purple-100"
              onClick={() => setSuppliersOpen(true)}
            >
              <Building2 className="h-3.5 w-3.5 ml-1" /> تامین‌کنندگان
            </Button>
            <Button
              variant="outline" size="icon"
              className="h-8 w-8 border-blue-200 bg-blue-50 text-blue-500 hover:bg-blue-100"
              onClick={onEdit}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="outline" size="icon"
              className="h-8 w-8 border-rose-200 bg-rose-50 text-rose-500 hover:bg-rose-100"
              onClick={onDelete}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </TableCell>
      </TableRow>

      {expanded && specs.length > 0 && (
        <TableRow>
          <TableCell colSpan={7} className="bg-muted/20 px-6 py-3">
            <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
              <Tag className="h-3.5 w-3.5" /> مشخصات فنی
            </p>
            <div className="flex flex-wrap gap-2">
              {specs.map((s, i) => (
                <div key={i} className="bg-card border border-border rounded-lg px-3 py-1.5 text-sm">
                  <span className="text-muted-foreground">{s.key}: </span>
                  <span className="font-medium">{s.value}</span>
                </div>
              ))}
            </div>
          </TableCell>
        </TableRow>
      )}

      <SuppliersDialog
        open={suppliersOpen}
        onClose={() => setSuppliersOpen(false)}
        equipment={equipment}
        suppliers={suppliers}
      />
    </>
  );
}

export default function EquipmentList() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editEquipment, setEditEquipment] = useState<any | null>(null);
  const [isCatOpen, setIsCatOpen] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatParentId, setNewCatParentId] = useState<string>("none");

  const { data: categories } = useListEquipmentCategories();
  const cats: Category[] = (categories ?? []) as Category[];

  const filterCategoryIds =
    categoryFilter && categoryFilter !== "all"
      ? getSubtreeIds(Number(categoryFilter), cats)
      : undefined;

  const { data: allEquipments, isLoading } = useListEquipment({
    search: search || undefined,
  });

  const equipments = allEquipments?.filter((eq) => {
    if (!filterCategoryIds) return true;
    return filterCategoryIds.includes((eq as any).category_id ?? -1);
  });

  const { data: suppliers } = useListSuppliers();

  const createEquipment = useCreateEquipment();
  const updateEquipment = useUpdateEquipment();
  const deleteEquipment = useDeleteEquipment();
  const createCategory = useCreateEquipmentCategory();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const invalidate = () => queryClient.invalidateQueries({ queryKey: getListEquipmentQueryKey() });

  const parseForm = (data: EquipmentFormData) => ({
    name: data.name,
    category_id: data.category_id && data.category_id !== "none" ? Number(data.category_id) : null,
    description: data.description,
    specs: data.specs.filter((s) => s.key.trim()),
    default_brand: data.default_brand || null,
    website_price: data.website_price ?? null,
    product_link: data.product_link || null,
  });

  const handleCreate = (data: EquipmentFormData) => {
    createEquipment.mutate({ data: parseForm(data) }, {
      onSuccess: () => { invalidate(); setIsAddOpen(false); toast({ title: "تجهیز اضافه شد" }); },
      onError: () => toast({ title: "خطا در افزودن", variant: "destructive" }),
    });
  };

  const handleUpdate = (data: EquipmentFormData) => {
    if (!editEquipment) return;
    updateEquipment.mutate({ id: editEquipment.id, data: parseForm(data) }, {
      onSuccess: () => { invalidate(); setEditEquipment(null); toast({ title: "تجهیز ویرایش شد" }); },
      onError: () => toast({ title: "خطا در ویرایش", variant: "destructive" }),
    });
  };

  const handleDelete = (id: number, name: string) => {
    if (!confirm(`آیا از حذف "${name}" مطمئن هستید؟`)) return;
    deleteEquipment.mutate({ id }, {
      onSuccess: () => { invalidate(); toast({ title: "تجهیز حذف شد" }); },
    });
  };

  const handleAddCategory = () => {
    if (!newCatName.trim()) return;
    createCategory.mutate({
      data: {
        name: newCatName.trim(),
        parent_id: newCatParentId && newCatParentId !== "none" ? Number(newCatParentId) : null,
      },
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["listEquipmentCategories"] });
        setNewCatName("");
        setNewCatParentId("none");
        setIsCatOpen(false);
        toast({ title: "دسته‌بندی اضافه شد" });
      },
    });
  };

  const sups = suppliers ?? [];
  const treeForFilter = buildCategoryTree(cats);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">تجهیزات</h1>
          <p className="text-muted-foreground text-sm mt-0.5">کاتالوگ اینورتر، PLC، HMI و سایر تجهیزات</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isCatOpen} onOpenChange={setIsCatOpen}>
            <DialogTrigger asChild>
              <Button variant="outline"><Tag className="h-4 w-4 ml-1" /> دسته‌بندی جدید</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[380px]">
              <DialogHeader><DialogTitle>دسته‌بندی جدید</DialogTitle></DialogHeader>
              <div className="space-y-4 mt-2">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">نام دسته</label>
                  <Input placeholder="مثلاً: اینورتر" value={newCatName} onChange={(e) => setNewCatName(e.target.value)} />
                </div>
                {cats.length > 0 && (
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">زیردسته‌ی (اختیاری)</label>
                    <Select value={newCatParentId} onValueChange={setNewCatParentId}>
                      <SelectTrigger className="dir-rtl">
                        <SelectValue placeholder="دسته والد" />
                      </SelectTrigger>
                      <SelectContent className="dir-rtl">
                        <SelectItem value="none">سطح اول (بدون والد)</SelectItem>
                        {treeForFilter.map((c) => (
                          <SelectItem key={c.id} value={String(c.id)}>
                            <span style={{ paddingRight: `${c.depth * 14}px` }} className="inline-flex items-center gap-1">
                              {c.depth > 0 && <ChevronLeft className="h-3 w-3 text-muted-foreground shrink-0" />}
                              {c.name}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="flex justify-end">
                  <Button onClick={handleAddCategory} disabled={createCategory.isPending || !newCatName.trim()}>ثبت</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 ml-1" /> افزودن تجهیز</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>تجهیز جدید</DialogTitle></DialogHeader>
              <EquipmentForm
                defaultValues={{ name: "", category_id: "none", description: "", default_brand: "", website_price: null, product_link: "", specs: [] }}
                onSubmit={handleCreate}
                isPending={createEquipment.isPending}
                submitLabel="ثبت تجهیز"
                categories={cats}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Dialog open={!!editEquipment} onOpenChange={(open) => !open && setEditEquipment(null)}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>ویرایش تجهیز</DialogTitle></DialogHeader>
          {editEquipment && (
            <EquipmentForm
              defaultValues={{
                name: editEquipment.name,
                category_id: editEquipment.category_id ? String(editEquipment.category_id) : "none",
                description: editEquipment.description ?? "",
                default_brand: editEquipment.default_brand ?? "",
                website_price: editEquipment.website_price != null ? Number(editEquipment.website_price) : null,
                product_link: editEquipment.product_link ?? "",
                specs: editEquipment.specs ?? [],
              }}
              onSubmit={handleUpdate}
              isPending={updateEquipment.isPending}
              submitLabel="ذخیره تغییرات"
              categories={cats}
            />
          )}
        </DialogContent>
      </Dialog>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex items-center relative max-w-sm flex-1">
          <Search className="absolute right-3 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="جستجو در نام، دسته، مشخصات..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-9"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-56 dir-rtl"><SelectValue placeholder="همه دسته‌ها" /></SelectTrigger>
          <SelectContent className="dir-rtl">
            <SelectItem value="all">همه دسته‌ها</SelectItem>
            {treeForFilter.map((c) => (
              <SelectItem key={c.id} value={String(c.id)}>
                <span style={{ paddingRight: `${c.depth * 14}px` }} className="inline-flex items-center gap-1">
                  {c.depth > 0 && <ChevronLeft className="h-3 w-3 text-muted-foreground shrink-0" />}
                  {c.name}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-xl border border-card-border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead className="font-semibold text-right pr-4">نام تجهیز</TableHead>
              <TableHead className="font-semibold text-center w-32">دسته</TableHead>
              <TableHead className="font-semibold text-center w-28">برند</TableHead>
              <TableHead className="font-semibold text-center w-28">قیمت سایت</TableHead>
              <TableHead className="font-semibold text-center w-28">قیمت خرید</TableHead>
              <TableHead className="font-semibold text-center w-28">قیمت فروش</TableHead>
              <TableHead className="font-semibold text-center w-44">عملیات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {[...Array(7)].map((_, j) => (
                    <TableCell key={j} className="text-center"><Skeleton className="h-5 w-24 mx-auto" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : (equipments?.length ?? 0) === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">تجهیزی یافت نشد</TableCell>
              </TableRow>
            ) : (
              equipments?.map((eq) => (
                <EquipmentRow
                  key={eq.id}
                  equipment={eq}
                  categories={cats}
                  suppliers={sups}
                  onEdit={() => setEditEquipment(eq)}
                  onDelete={() => handleDelete(eq.id, eq.name)}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
