import { useState } from "react";
import {
  useListSuppliers, useCreateSupplier, useUpdateSupplier, useDeleteSupplier,
  getListSuppliersQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Trash2, Pencil, Phone, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

type SupplierFormData = {
  name: string;
  contact_person?: string;
  phone?: string;
  address?: string;
  description?: string;
};

type Supplier = {
  id: number;
  name: string;
  contact_person?: string | null;
  phone?: string | null;
  address?: string | null;
  description?: string | null;
  created_at: string;
};

function SupplierForm({
  defaultValues, onSubmit, isPending, submitLabel,
}: {
  defaultValues: SupplierFormData;
  onSubmit: (data: SupplierFormData) => void;
  isPending: boolean;
  submitLabel: string;
}) {
  const form = useForm<SupplierFormData>({ defaultValues });
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-2">
        <FormField control={form.control} name="name" render={({ field }) => (
          <FormItem><FormLabel>نام شرکت / تامین‌کننده</FormLabel><FormControl><Input {...field} required /></FormControl></FormItem>
        )} />
        <FormField control={form.control} name="contact_person" render={({ field }) => (
          <FormItem><FormLabel>نام نماینده</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
        )} />
        <FormField control={form.control} name="phone" render={({ field }) => (
          <FormItem><FormLabel>شماره تماس</FormLabel><FormControl><Input {...field} className="dir-ltr text-right" /></FormControl></FormItem>
        )} />
        <FormField control={form.control} name="address" render={({ field }) => (
          <FormItem><FormLabel>آدرس</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
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

export default function SuppliersList() {
  const [search, setSearch] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editSupplier, setEditSupplier] = useState<Supplier | null>(null);

  const { data: suppliers, isLoading } = useListSuppliers({ search });
  const createSupplier = useCreateSupplier();
  const updateSupplier = useUpdateSupplier();
  const deleteSupplier = useDeleteSupplier();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const invalidate = () => queryClient.invalidateQueries({ queryKey: getListSuppliersQueryKey() });

  const handleCreate = (data: SupplierFormData) => {
    createSupplier.mutate({ data }, {
      onSuccess: () => { invalidate(); setIsAddOpen(false); toast({ title: "تامین‌کننده اضافه شد" }); },
      onError: () => toast({ title: "خطا در افزودن", variant: "destructive" }),
    });
  };

  const handleUpdate = (data: SupplierFormData) => {
    if (!editSupplier) return;
    updateSupplier.mutate({ id: editSupplier.id, data }, {
      onSuccess: () => { invalidate(); setEditSupplier(null); toast({ title: "تامین‌کننده ویرایش شد" }); },
      onError: () => toast({ title: "خطا در ویرایش", variant: "destructive" }),
    });
  };

  const handleDelete = (id: number, name: string) => {
    if (!confirm(`آیا از حذف "${name}" مطمئن هستید؟`)) return;
    deleteSupplier.mutate({ id }, {
      onSuccess: () => { invalidate(); toast({ title: "تامین‌کننده حذف شد" }); },
      onError: () => toast({ title: "خطا در حذف", variant: "destructive" }),
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">تامین‌کنندگان</h1>
          <p className="text-muted-foreground text-sm mt-0.5">مدیریت تامین‌کنندگان و شرکای تجاری</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 ml-1" /> افزودن تامین‌کننده</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[440px]">
            <DialogHeader><DialogTitle>تامین‌کننده جدید</DialogTitle></DialogHeader>
            <SupplierForm
              defaultValues={{ name: "", contact_person: "", phone: "", address: "", description: "" }}
              onSubmit={handleCreate}
              isPending={createSupplier.isPending}
              submitLabel="ثبت تامین‌کننده"
            />
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={!!editSupplier} onOpenChange={(open) => !open && setEditSupplier(null)}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader><DialogTitle>ویرایش تامین‌کننده</DialogTitle></DialogHeader>
          {editSupplier && (
            <SupplierForm
              defaultValues={{
                name: editSupplier.name,
                contact_person: editSupplier.contact_person ?? "",
                phone: editSupplier.phone ?? "",
                address: editSupplier.address ?? "",
                description: editSupplier.description ?? "",
              }}
              onSubmit={handleUpdate}
              isPending={updateSupplier.isPending}
              submitLabel="ذخیره تغییرات"
            />
          )}
        </DialogContent>
      </Dialog>

      <div className="flex items-center relative max-w-sm">
        <Search className="absolute right-3 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="جستجوی تامین‌کننده..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pr-9"
        />
      </div>

      <div className="rounded-xl border border-card-border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead className="font-semibold text-right pr-4">نام شرکت</TableHead>
              <TableHead className="font-semibold text-center w-40">نماینده</TableHead>
              <TableHead className="font-semibold text-center w-40">شماره تماس</TableHead>
              <TableHead className="font-semibold text-center w-24">عملیات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  {[...Array(4)].map((_, j) => (
                    <TableCell key={j} className="text-center"><Skeleton className="h-5 w-24 mx-auto" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : (suppliers?.length ?? 0) === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">تامین‌کننده‌ای یافت نشد</TableCell>
              </TableRow>
            ) : (
              suppliers?.map((supplier) => (
                <TableRow key={supplier.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="pr-4 font-medium">{supplier.name}</TableCell>
                  <TableCell className="text-center">
                    {supplier.contact_person ? (
                      <span className="inline-flex items-center gap-1 text-sm">
                        <User className="h-3.5 w-3.5 text-muted-foreground" />
                        {supplier.contact_person}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {supplier.phone ? (
                      <a href={`tel:${supplier.phone}`} className="text-primary hover:underline inline-flex items-center gap-1 dir-ltr text-sm">
                        <Phone className="h-3.5 w-3.5" />
                        {supplier.phone}
                      </a>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        variant="outline" size="icon"
                        className="h-8 w-8 border-blue-200 bg-blue-50 text-blue-500 hover:bg-blue-100 hover:border-blue-400"
                        onClick={() => setEditSupplier(supplier as Supplier)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline" size="icon"
                        className="h-8 w-8 border-rose-200 bg-rose-50 text-rose-500 hover:bg-rose-100 hover:border-rose-400"
                        onClick={() => handleDelete(supplier.id, supplier.name)}
                      >
                        <Trash2 className="h-4 w-4" />
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
