import { useState } from "react";
import {
  useListPanels, useCreatePanel, useUpdatePanel, useDeletePanel,
  useGetPanel, useAddPanelItem, useUpdatePanelItem, useDeletePanelItem,
  useListEquipment,
  getListPanelsQueryKey, getGetPanelQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Pencil, Search, ChevronDown, ChevronUp, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

type PanelFormData = { name: string; description?: string };
type PanelItemFormData = { equipment_id: string; quantity: number };

function PanelForm({
  defaultValues, onSubmit, isPending, submitLabel,
}: {
  defaultValues: PanelFormData;
  onSubmit: (data: PanelFormData) => void;
  isPending: boolean;
  submitLabel: string;
}) {
  const form = useForm<PanelFormData>({ defaultValues });
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-2">
        <FormField control={form.control} name="name" render={({ field }) => (
          <FormItem><FormLabel>نام تابلو</FormLabel><FormControl><Input {...field} required /></FormControl></FormItem>
        )} />
        <FormField control={form.control} name="description" render={({ field }) => (
          <FormItem><FormLabel>توضیحات</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
        )} />
        <div className="flex justify-end pt-2">
          <Button type="submit" disabled={isPending}>{isPending ? "در حال ثبت..." : submitLabel}</Button>
        </div>
      </form>
    </Form>
  );
}

function PanelDetail({ panelId, equipments }: { panelId: number; equipments: Array<{ id: number; name: string }> }) {
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [editingQty, setEditingQty] = useState<number>(1);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: panel, isLoading } = useGetPanel(panelId);
  const addItem = useAddPanelItem();
  const updateItem = useUpdatePanelItem();
  const deleteItem = useDeletePanelItem();

  const form = useForm<PanelItemFormData>({ defaultValues: { equipment_id: "", quantity: 1 } });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: getGetPanelQueryKey(panelId) });

  const handleAddItem = (data: PanelItemFormData) => {
    addItem.mutate({
      id: panelId,
      data: { equipment_id: Number(data.equipment_id), quantity: data.quantity },
    }, {
      onSuccess: () => { invalidate(); setIsAddItemOpen(false); form.reset(); toast({ title: "قطعه اضافه شد" }); },
      onError: () => toast({ title: "خطا", variant: "destructive" }),
    });
  };

  const handleDeleteItem = (itemId: number) => {
    if (!confirm("حذف این قطعه؟")) return;
    deleteItem.mutate({ id: panelId, itemId }, {
      onSuccess: () => { invalidate(); toast({ title: "قطعه حذف شد" }); },
    });
  };

  const startEditQty = (item: any) => {
    setEditingItemId(item.id);
    setEditingQty(Number(item.quantity));
  };

  const saveEditQty = (itemId: number) => {
    if (editingQty < 1) return;
    updateItem.mutate({ id: panelId, itemId, data: { quantity: editingQty } }, {
      onSuccess: () => { invalidate(); setEditingItemId(null); toast({ title: "تعداد به‌روز شد" }); },
      onError: () => toast({ title: "خطا در ذخیره", variant: "destructive" }),
    });
  };

  if (isLoading) return <Skeleton className="h-24 w-full" />;

  const items = (panel as any)?.items ?? [];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
          <Package className="h-3.5 w-3.5" /> اقلام تابلو ({items.length} قطعه)
        </p>
        <Dialog open={isAddItemOpen} onOpenChange={setIsAddItemOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="h-7 text-xs">
              <Plus className="h-3.5 w-3.5 ml-1" /> افزودن قطعه
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[380px]">
            <DialogHeader><DialogTitle>افزودن قطعه به تابلو</DialogTitle></DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleAddItem)} className="space-y-4 mt-2">
                <FormField control={form.control} name="equipment_id" render={({ field }) => (
                  <FormItem>
                    <FormLabel>تجهیز</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="dir-rtl"><SelectValue placeholder="انتخاب تجهیز" /></SelectTrigger>
                      </FormControl>
                      <SelectContent className="dir-rtl">
                        {equipments.map((e) => (
                          <SelectItem key={e.id} value={String(e.id)}>{e.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />
                <FormField control={form.control} name="quantity" render={({ field }) => (
                  <FormItem>
                    <FormLabel>تعداد</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} className="dir-ltr text-center w-28" {...field} onChange={(e) => field.onChange(Number(e.target.value))} />
                    </FormControl>
                  </FormItem>
                )} />
                <div className="flex justify-end">
                  <Button type="submit" disabled={addItem.isPending}>افزودن</Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">هنوز قطعه‌ای اضافه نشده</p>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="text-right py-2 px-4 font-medium">نام تجهیز</th>
                <th className="text-center py-2 px-4 font-medium w-32">تعداد</th>
                <th className="text-center py-2 px-4 font-medium w-20">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map((item: any) => (
                <tr key={item.id} className="hover:bg-muted/20">
                  <td className="py-2.5 px-4">{item.equipment_name ?? "—"}</td>
                  <td className="py-2 px-4 text-center">
                    {editingItemId === item.id ? (
                      <div className="flex items-center justify-center gap-1">
                        <Input
                          type="number"
                          min={1}
                          value={editingQty}
                          onChange={(e) => setEditingQty(Number(e.target.value))}
                          className="h-7 w-16 dir-ltr text-center text-sm px-1"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveEditQty(item.id);
                            if (e.key === "Escape") setEditingItemId(null);
                          }}
                        />
                        <Button
                          variant="ghost" size="icon"
                          className="h-7 w-7 text-emerald-600 hover:bg-emerald-50"
                          onClick={() => saveEditQty(item.id)}
                          disabled={updateItem.isPending}
                        >
                          ✓
                        </Button>
                      </div>
                    ) : (
                      <button
                        className="dir-ltr inline-flex items-center gap-1 px-2 py-0.5 rounded hover:bg-muted/60 text-sm font-medium transition-colors group"
                        onClick={() => startEditQty(item)}
                        title="کلیک برای ویرایش تعداد"
                      >
                        {item.quantity}
                        <Pencil className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    )}
                  </td>
                  <td className="py-2.5 px-4 text-center">
                    <Button
                      variant="ghost" size="icon"
                      className="h-7 w-7 text-destructive hover:bg-destructive/10"
                      onClick={() => handleDeleteItem(item.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function PanelRow({ panel, equipments, onEdit, onDelete }: {
  panel: any;
  equipments: Array<{ id: number; name: string }>;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <TableRow className="hover:bg-muted/30 transition-colors">
        <TableCell className="pr-4">
          <button
            className="flex items-center gap-2 font-medium hover:text-primary text-right"
            onClick={() => setExpanded((e) => !e)}
          >
            {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
            {panel.name}
          </button>
        </TableCell>
        <TableCell className="text-center text-sm text-muted-foreground">
          {panel.description || "—"}
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
          <TableCell colSpan={3} className="bg-muted/20 px-6 py-4">
            <PanelDetail panelId={panel.id} equipments={equipments} />
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

export default function PanelsList() {
  const [search, setSearch] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editPanel, setEditPanel] = useState<any | null>(null);

  const { data: panels, isLoading } = useListPanels({ search: search || undefined });
  const { data: equipments } = useListEquipment();
  const createPanel = useCreatePanel();
  const updatePanel = useUpdatePanel();
  const deletePanel = useDeletePanel();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const invalidate = () => queryClient.invalidateQueries({ queryKey: getListPanelsQueryKey() });

  const handleCreate = (data: PanelFormData) => {
    createPanel.mutate({ data }, {
      onSuccess: () => { invalidate(); setIsAddOpen(false); toast({ title: "تابلو اضافه شد" }); },
      onError: () => toast({ title: "خطا", variant: "destructive" }),
    });
  };

  const handleUpdate = (data: PanelFormData) => {
    if (!editPanel) return;
    updatePanel.mutate({ id: editPanel.id, data }, {
      onSuccess: () => { invalidate(); setEditPanel(null); toast({ title: "تابلو ویرایش شد" }); },
    });
  };

  const handleDelete = (id: number, name: string) => {
    if (!confirm(`حذف تابلو "${name}"؟`)) return;
    deletePanel.mutate({ id }, {
      onSuccess: () => { invalidate(); toast({ title: "تابلو حذف شد" }); },
    });
  };

  const eqs = (equipments ?? []).map((e) => ({ id: e.id, name: e.name }));

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">تابلوهای آماده</h1>
          <p className="text-muted-foreground text-sm mt-0.5">الگوهای تابلوی برق با لیست اقلام مرتبط</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 ml-1" /> تابلوی جدید</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[440px]">
            <DialogHeader><DialogTitle>تابلوی جدید</DialogTitle></DialogHeader>
            <PanelForm
              defaultValues={{ name: "", description: "" }}
              onSubmit={handleCreate}
              isPending={createPanel.isPending}
              submitLabel="ثبت تابلو"
            />
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={!!editPanel} onOpenChange={(open) => !open && setEditPanel(null)}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader><DialogTitle>ویرایش تابلو</DialogTitle></DialogHeader>
          {editPanel && (
            <PanelForm
              defaultValues={{ name: editPanel.name, description: editPanel.description ?? "" }}
              onSubmit={handleUpdate}
              isPending={updatePanel.isPending}
              submitLabel="ذخیره تغییرات"
            />
          )}
        </DialogContent>
      </Dialog>

      <div className="flex items-center relative max-w-sm">
        <Search className="absolute right-3 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="جستجوی تابلو..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pr-9"
        />
      </div>

      <div className="rounded-xl border border-card-border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead className="font-semibold text-right pr-4">نام تابلو</TableHead>
              <TableHead className="font-semibold text-center">توضیحات</TableHead>
              <TableHead className="font-semibold text-center w-24">عملیات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  {[...Array(3)].map((_, j) => (
                    <TableCell key={j} className="text-center"><Skeleton className="h-5 w-24 mx-auto" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : (panels?.length ?? 0) === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-10 text-muted-foreground">تابلویی یافت نشد</TableCell>
              </TableRow>
            ) : (
              panels?.map((panel) => (
                <PanelRow
                  key={panel.id}
                  panel={panel}
                  equipments={eqs}
                  onEdit={() => setEditPanel(panel)}
                  onDelete={() => handleDelete(panel.id, panel.name)}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
