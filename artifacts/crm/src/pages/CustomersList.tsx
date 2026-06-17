import { useState } from "react";
import {
  useListCustomers, useCreateCustomer, useUpdateCustomer, useDeleteCustomer,
  getListCustomersQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Plus, Search, Trash2, Pencil, Phone } from "lucide-react";
import { formatToman, formatPersianNumber } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type CustomerFormData = {
  name: string; phone: string; address?: string;
  description?: string; initial_balance?: number;
};

type Customer = { id: number; name: string; phone: string; address?: string | null; description?: string | null; initial_balance: number; created_at: string; };

function CustomerForm({
  defaultValues,
  onSubmit,
  isPending,
  submitLabel,
}: {
  defaultValues: CustomerFormData;
  onSubmit: (data: CustomerFormData) => void;
  isPending: boolean;
  submitLabel: string;
}) {
  const form = useForm<CustomerFormData>({ defaultValues });
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-2">
        <FormField control={form.control} name="name" render={({ field }) => (
          <FormItem><FormLabel>نام و نام خانوادگی</FormLabel><FormControl><Input {...field} required /></FormControl></FormItem>
        )} />
        <FormField control={form.control} name="phone" render={({ field }) => (
          <FormItem><FormLabel>شماره تماس</FormLabel><FormControl><Input {...field} className="dir-ltr text-right" required /></FormControl></FormItem>
        )} />
        <FormField control={form.control} name="address" render={({ field }) => (
          <FormItem><FormLabel>آدرس</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
        )} />
        <FormField control={form.control} name="description" render={({ field }) => (
          <FormItem><FormLabel>توضیحات</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
        )} />
        <FormField control={form.control} name="initial_balance" render={({ field }) => (
          <FormItem><FormLabel>تراز اولیه (تومان)</FormLabel><FormControl>
            <Input type="number" className="dir-ltr text-right" {...field} onChange={(e) => field.onChange(Number(e.target.value))} />
          </FormControl></FormItem>
        )} />
        <div className="flex justify-end pt-2">
          <Button type="submit" disabled={isPending}>{isPending ? "در حال ثبت..." : submitLabel}</Button>
        </div>
      </form>
    </Form>
  );
}

export default function CustomersList() {
  const [search, setSearch] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);

  const { data: customers, isLoading } = useListCustomers({ search });
  const createCustomer = useCreateCustomer();
  const updateCustomer = useUpdateCustomer();
  const deleteCustomer = useDeleteCustomer();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const invalidate = () => queryClient.invalidateQueries({ queryKey: getListCustomersQueryKey() });

  const handleCreate = (data: CustomerFormData) => {
    createCustomer.mutate({ data }, {
      onSuccess: () => { invalidate(); setIsAddOpen(false); toast({ title: "مشتری اضافه شد" }); },
      onError: () => toast({ title: "خطا در افزودن مشتری", variant: "destructive" }),
    });
  };

  const handleUpdate = (data: CustomerFormData) => {
    if (!editCustomer) return;
    updateCustomer.mutate({ id: editCustomer.id, data }, {
      onSuccess: () => { invalidate(); setEditCustomer(null); toast({ title: "مشتری ویرایش شد" }); },
      onError: () => toast({ title: "خطا در ویرایش مشتری", variant: "destructive" }),
    });
  };

  const handleDelete = (id: number, name: string) => {
    if (!confirm(`آیا از حذف "${name}" مطمئن هستید؟`)) return;
    deleteCustomer.mutate({ id }, {
      onSuccess: () => { invalidate(); toast({ title: "مشتری حذف شد" }); },
      onError: () => toast({ title: "خطا در حذف مشتری", variant: "destructive" }),
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">مشتریان</h1>
          <p className="text-muted-foreground text-sm mt-0.5">مدیریت اطلاعات مشتریان</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-customer"><Plus className="h-4 w-4 ml-1" /> افزودن مشتری</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[440px]">
            <DialogHeader><DialogTitle>مشتری جدید</DialogTitle></DialogHeader>
            <CustomerForm
              defaultValues={{ name: "", phone: "", address: "", description: "", initial_balance: 0 }}
              onSubmit={handleCreate}
              isPending={createCustomer.isPending}
              submitLabel="ثبت مشتری"
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit dialog */}
      <Dialog open={!!editCustomer} onOpenChange={(open) => !open && setEditCustomer(null)}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader><DialogTitle>ویرایش مشتری</DialogTitle></DialogHeader>
          {editCustomer && (
            <CustomerForm
              defaultValues={{
                name: editCustomer.name, phone: editCustomer.phone,
                address: editCustomer.address ?? "", description: editCustomer.description ?? "",
                initial_balance: editCustomer.initial_balance,
              }}
              onSubmit={handleUpdate}
              isPending={updateCustomer.isPending}
              submitLabel="ذخیره تغییرات"
            />
          )}
        </DialogContent>
      </Dialog>

      <div className="flex items-center relative max-w-sm">
        <Search className="absolute right-3 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="جستجوی مشتری..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pr-9"
          data-testid="input-search-customer"
        />
      </div>

      <div className="rounded-xl border border-card-border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead className="font-semibold text-right pr-4">نام</TableHead>
              <TableHead className="font-semibold text-center whitespace-nowrap w-40">شماره تماس</TableHead>
              <TableHead className="font-semibold text-center whitespace-nowrap w-36">موجودی / بدهی</TableHead>
              <TableHead className="font-semibold text-center whitespace-nowrap w-24">عملیات</TableHead>
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
            ) : customers?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">مشتری یافت نشد</TableCell>
              </TableRow>
            ) : (
              customers?.map((customer) => {
                const debt = customer.initial_balance ?? 0;
                return (
                  <TableRow key={customer.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="pr-4">
                      <Link
                        href={`/customers/${customer.id}`}
                        className="text-primary font-medium hover:underline"
                        data-testid={`link-customer-${customer.id}`}
                      >
                        {customer.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-center whitespace-nowrap">
                      <a
                        href={`tel:${customer.phone}`}
                        className="text-primary hover:underline inline-flex items-center gap-1 dir-ltr"
                        data-testid={`link-phone-${customer.id}`}
                      >
                        <Phone className="h-3.5 w-3.5 shrink-0" />
                        {customer.phone}
                      </a>
                    </TableCell>
                    <TableCell className="text-center whitespace-nowrap">
                      <span className={cn(
                        "font-medium",
                        debt === 0 ? "text-emerald-600" : "text-rose-600"
                      )}>
                        {debt === 0 ? "تسویه" : formatToman(debt)}
                      </span>
                    </TableCell>
                    <TableCell className="text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="outline" size="icon"
                          className="h-8 w-8 border-blue-200 bg-blue-50 text-blue-500 hover:bg-blue-100 hover:border-blue-400"
                          onClick={() => setEditCustomer(customer as Customer)}
                          data-testid={`button-edit-customer-${customer.id}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline" size="icon"
                          className="h-8 w-8 border-rose-200 bg-rose-50 text-rose-500 hover:bg-rose-100 hover:border-rose-400"
                          onClick={() => handleDelete(customer.id, customer.name)}
                          data-testid={`button-delete-customer-${customer.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
