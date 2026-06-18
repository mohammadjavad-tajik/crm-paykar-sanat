import { useState } from "react";
import {
  useListEquipment, useCreateEquipment, useUpdateEquipment, useDeleteEquipment,
  useListEquipmentCategories, useCreateEquipmentCategory,
  useListSuppliers, useListEquipmentSuppliers, getListEquipmentSuppliersQueryKey,
  useAddEquipmentSupplier, useUpdateEquipmentSupplier, useDeleteEquipmentSupplier,
  getListEquipmentQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Pencil, Search, ChevronDown, ChevronUp, Tag, Link2, ChevronLeft } from "lucide-react";
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
  specs: SpecEntry[];
};
type SupplierLinkFormData = {
  supplier_id: string;
  brand?: string;
  purchase_price: number;
  sell_price: number;
  supplier_code?: string;
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
        <FormField control={form.control} name="brand" render={({ field }) => (
          <FormItem><FormLabel>برند / مدل</FormLabel><FormControl><Input {...field} placeholder="مثلاً: ABB, Siemens" /></FormControl></FormItem>
        )} />
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="purchase_price" render={({ field }) => (
            <FormItem>
              <FormLabel>قیمت خرید (تومان)</FormLabel>
              <FormControl>
                <Input type="number" className="dir-ltr text-right" {...field} onChange={(e) => field.onChange(Number(e.target.value))} />
              </FormControl>
            </FormItem>
          )} />
          <FormField control={form.control} name="sell_price" render={({ field }) => (
            <FormItem>
              <FormLabel>قیمت فروش (تومان)</FormLabel>
              <FormControl>
                <Input type="number" className="dir-ltr text-right" {...field} onChange={(e) => field.onChange(Number(e.target.value))} />
              </FormControl>
            </FormItem>
          )} />
        </div>
        <FormField control={form.control} name="supplier_code" render={({ field }) => (
          <FormItem><FormLabel>کد محصول نزد تامین‌کننده</FormLabel><FormControl><Input {...field} className="dir-ltr" /></FormControl></FormItem>
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

function EquipmentRow({ equipment, categories, suppliers, onEdit, onDelete }: {
  equipment: any;
  categories: Category[];
  suppliers: Array<{ id: number; name: string }>;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [isAddSupplierOpen, setIsAddSupplierOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: links, isLoading: linksLoading } = useListEquipmentSuppliers(equipment.id, {
    query: { enabled: expanded },
  });

  const addLink = useAddEquipmentSupplier();
  const deleteLink = useDeleteEquipmentSupplier();

  const invalidateEquipment = () => queryClient.invalidateQueries({ queryKey: getListEquipmentQueryKey() });

  const handleAddSupplier = (data: SupplierLinkFormData) => {
    addLink.mutate({
      id: equipment.id,
      data: {
        supplier_id: Number(data.supplier_id),
        brand: data.brand,
        purchase_price: data.purchase_price,
        sell_price: data.sell_price,
        supplier_code: data.supplier_code,
        is_default: data.is_default,
        notes: data.notes,
      },
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListEquipmentSuppliersQueryKey(equipment.id) });
        invalidateEquipment();
        setIsAddSupplierOpen(false);
        toast({ title: "تامین‌کننده اضافه شد" });
      },
      onError: () => toast({ title: "خطا", variant: "destructive" }),
    });
  };

  const handleDeleteLink = (linkId: number) => {
    if (!confirm("آیا این تامین‌کننده حذف شود؟")) return;
    deleteLink.mutate({ id: equipment.id, linkId }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListEquipmentSuppliersQueryKey(equipment.id) });
        invalidateEquipment();
        toast({ title: "حذف شد" });
      },
    });
  };

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
          <button
            className="flex items-center gap-2 font-medium hover:text-primary text-right"
            onClick={() => setExpanded((e) => !e)}
          >
            {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
            {equipment.name}
          </button>
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
          {equipment.min_sell_price != null ? (
            <span className="text-emerald-600 font-medium">{formatToman(equipment.min_sell_price)}</span>
          ) : <span className="text-muted-foreground">—</span>}
        </TableCell>
        <TableCell className="text-center">
          <div className="flex items-center justify-center gap-1">
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

      {expanded && (
        <TableRow>
          <TableCell colSpan={5} className="bg-muted/20 px-6 py-4">
            <div className="space-y-4">
              {specs.length > 0 && (
                <div>
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
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                    <Link2 className="h-3.5 w-3.5" /> تامین‌کنندگان این تجهیز
                  </p>
                  <Dialog open={isAddSupplierOpen} onOpenChange={setIsAddSupplierOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="h-7 text-xs">
                        <Plus className="h-3.5 w-3.5 ml-1" /> افزودن تامین‌کننده
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[440px]">
                      <DialogHeader><DialogTitle>افزودن تامین‌کننده به تجهیز</DialogTitle></DialogHeader>
                      <SupplierLinkForm
                        defaultValues={{ supplier_id: "", brand: "", purchase_price: 0, sell_price: 0, supplier_code: "", is_default: false, notes: "" }}
                        onSubmit={handleAddSupplier}
                        isPending={addLink.isPending}
                        submitLabel="ثبت"
                        suppliers={suppliers}
                      />
                    </DialogContent>
                  </Dialog>
                </div>
                {linksLoading ? (
                  <Skeleton className="h-10 w-full" />
                ) : !links || links.length === 0 ? (
                  <p className="text-sm text-muted-foreground">تامین‌کننده‌ای ثبت نشده</p>
                ) : (
                  <div className="space-y-2">
                    {links.map((link) => (
                      <div key={link.id} className="flex items-center justify-between bg-card border border-border rounded-lg px-4 py-2.5 text-sm">
                        <div className="flex items-center gap-4">
                          <span className="font-medium">{link.supplier_name || "—"}</span>
                          {link.brand && <Badge variant="outline" className="text-xs">{link.brand}</Badge>}
                          {link.is_default && <Badge className="text-xs bg-blue-100 text-blue-700 border-blue-200">پیش‌فرض</Badge>}
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-left">
                            <p className="text-xs text-muted-foreground">خرید: <span className="text-foreground font-medium">{formatToman(link.purchase_price)}</span></p>
                            <p className="text-xs text-muted-foreground">فروش: <span className="text-emerald-600 font-medium">{formatToman(link.sell_price)}</span></p>
                          </div>
                          <Button
                            variant="ghost" size="icon"
                            className="h-7 w-7 text-destructive hover:bg-destructive/10"
                            onClick={() => handleDeleteLink(link.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TableCell>
        </TableRow>
      )}
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
                defaultValues={{ name: "", category_id: "none", description: "", specs: [] }}
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
              <TableHead className="font-semibold text-center w-36">دسته</TableHead>
              <TableHead className="font-semibold text-center w-36">برند پیش‌فرض</TableHead>
              <TableHead className="font-semibold text-center w-36">قیمت فروش</TableHead>
              <TableHead className="font-semibold text-center w-24">عملیات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {[...Array(5)].map((_, j) => (
                    <TableCell key={j} className="text-center"><Skeleton className="h-5 w-24 mx-auto" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : (equipments?.length ?? 0) === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">تجهیزی یافت نشد</TableCell>
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
