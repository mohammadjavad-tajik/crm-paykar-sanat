import { useState, useRef } from "react";
import { useGetSettings, useUpdateSettings, useExportBackup, useImportBackup, getGetSettingsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Save, Download, Upload, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormDescription } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import JSZip from "jszip";
import { format } from "date-fns-jalali";

export default function Settings() {
  const { data: settings, isLoading } = useGetSettings();
  const updateSettings = useUpdateSettings();
  const exportBackup = useExportBackup();
  const importBackup = useImportBackup();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm({
    values: {
      business_name: settings?.business_name || "",
      owner_name: settings?.owner_name || "",
      phone: settings?.phone || "",
      new_pin: "",
      auto_lock_minutes: settings?.auto_lock_minutes || 15,
    },
  });

  const onSubmit = (data: any) => {
    const payload: any = {
      business_name: data.business_name,
      owner_name: data.owner_name,
      phone: data.phone,
      auto_lock_minutes: Number(data.auto_lock_minutes),
    };
    
    if (data.new_pin) {
      payload.pin_hash = data.new_pin; // Backend hashes this
    }

    updateSettings.mutate(
      { data: payload },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetSettingsQueryKey() });
          toast({ title: "تنظیمات با موفقیت ذخیره شد" });
          form.setValue("new_pin", "");
        },
      }
    );
  };

  const handleExportBackup = async () => {
    try {
      const data = await exportBackup.mutateAsync();
      const zip = new JSZip();
      zip.file("crm-backup.json", JSON.stringify(data, null, 2));
      const blob = await zip.generateAsync({ type: "blob" });
      
      const dateStr = format(new Date(), "yyyy-MM-dd");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `crm-backup-${dateStr}.zip`;
      a.click();
      URL.revokeObjectURL(url);
      
      toast({ title: "بکاپ با موفقیت ایجاد شد" });
    } catch (error) {
      toast({ title: "خطا در ایجاد بکاپ", variant: "destructive" });
    }
  };

  const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm("اخطار: بازگردانی بکاپ تمام اطلاعات فعلی شما را پاک می‌کند. آیا ادامه می‌دهید؟")) {
      e.target.value = "";
      return;
    }

    try {
      const zip = await JSZip.loadAsync(file);
      const jsonFile = zip.file("crm-backup.json");
      if (!jsonFile) throw new Error("فایل crm-backup.json در فایل zip یافت نشد");
      
      const jsonStr = await jsonFile.async("string");
      const backupData = JSON.parse(jsonStr);
      
      await importBackup.mutateAsync({ data: backupData });
      toast({ title: "بکاپ با موفقیت بازگردانی شد. لطفا صفحه را رفرش کنید." });
      setTimeout(() => window.location.reload(), 2000);
    } catch (error) {
      toast({ title: "خطا در بازگردانی بکاپ", variant: "destructive" });
      console.error(error);
    }
    
    e.target.value = "";
  };

  if (isLoading) return <div className="space-y-6 max-w-2xl"><Skeleton className="h-64 w-full" /></div>;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">تنظیمات</h1>
        <p className="text-muted-foreground mt-2">تنظیمات سیستم و اطلاعات کسب و کار</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>اطلاعات کسب و کار</CardTitle>
              <CardDescription>این اطلاعات در فاکتورها نمایش داده می‌شود.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="business_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>نام کسب و کار</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="owner_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>نام مدیریت</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>شماره تماس کسب و کار</FormLabel>
                    <FormControl>
                      <Input {...field} className="dir-ltr text-right" />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                امنیت سیستم
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="new_pin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>پین کد جدید (فقط اعداد)</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        maxLength={4} 
                        {...field} 
                        className="dir-ltr text-center tracking-widest text-lg" 
                        placeholder={settings?.pin_hash ? "تغییر پین فعلی..." : "پین ۴ رقمی"}
                      />
                    </FormControl>
                    <FormDescription>اگر می‌خواهید پین تغییر نکند، این فیلد را خالی بگذارید.</FormDescription>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="auto_lock_minutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>قفل خودکار (دقیقه)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min={1} 
                        max={120} 
                        {...field} 
                        className="dir-ltr text-right" 
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" disabled={updateSettings.isPending}>
              <Save className="w-4 h-4 mr-2" /> ذخیره تنظیمات
            </Button>
          </div>
        </form>
      </Form>

      <Card>
        <CardHeader>
          <CardTitle>پشتیبان‌گیری و بازگردانی</CardTitle>
          <CardDescription>از تمام اطلاعات سیستم بکاپ بگیرید یا آنها را بازگردانی کنید.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-4">
          <Button variant="outline" onClick={handleExportBackup} disabled={exportBackup.isPending}>
            <Download className="w-4 h-4 mr-2" /> خروجی بکاپ (Zip)
          </Button>
          
          <div className="relative">
            <input 
              type="file" 
              accept=".zip" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleImportBackup} 
            />
            <Button 
              variant="outline" 
              onClick={() => fileInputRef.current?.click()} 
              disabled={importBackup.isPending}
              className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Upload className="w-4 h-4 mr-2" /> ورود بکاپ
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
