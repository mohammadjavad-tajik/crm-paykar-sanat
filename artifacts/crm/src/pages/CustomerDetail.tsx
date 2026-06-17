import { useRoute } from "wouter";
import { useGetCustomerProfile } from "@workspace/api-client-react";
import { formatToman, formatJalaliDate, formatPersianNumber } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { User, Phone, MapPin, FileText, Briefcase, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function CustomerDetail() {
  const [, params] = useRoute("/customers/:id");
  const customerId = Number(params?.id);
  
  const { data: profile, isLoading } = useGetCustomerProfile(customerId, {
    query: { enabled: !!customerId }
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-40 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!profile) return <div>مشتری یافت نشد</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">پروفایل مشتری</h1>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-2xl font-bold">{profile.customer.name}</h2>
              </div>
              <div className="flex items-center gap-4 text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Phone className="h-4 w-4" />
                  <span className="dir-ltr">{formatPersianNumber(profile.customer.phone)}</span>
                </div>
                {profile.customer.address && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    <span>{profile.customer.address}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg min-w-[200px] text-center">
              <p className="text-sm text-muted-foreground mb-1">مجموع بدهی</p>
              <p className={`text-2xl font-bold ${profile.total_debt > 0 ? "text-destructive" : ""}`}>
                {formatToman(profile.total_debt)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Jobs */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              کارهای مشتری
            </CardTitle>
            <Button size="sm" variant="outline" asChild>
              <Link href={`/jobs?customer_id=${customerId}`}>
                مشاهده همه
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {profile.jobs.length === 0 ? (
              <p className="text-center py-4 text-muted-foreground">کاری ثبت نشده است</p>
            ) : (
              <div className="space-y-4">
                {profile.jobs.slice(0, 5).map(job => (
                  <div key={job.id} className="flex justify-between items-center border-b pb-2 last:border-0 last:pb-0">
                    <div>
                      <p className="font-medium">{job.description}</p>
                      <p className="text-xs text-muted-foreground">{formatJalaliDate(job.created_at)}</p>
                    </div>
                    <Badge variant={job.status === "completed" ? "default" : "outline"} className={job.status === "completed" ? "bg-green-600" : "text-orange-600"}>
                      {job.status === "completed" ? "انجام شده" : "در حال انجام"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Invoices */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              فاکتورهای مشتری
            </CardTitle>
            <Button size="sm" variant="outline" asChild>
              <Link href={`/invoices/new?customer_id=${customerId}`}>
                <Plus className="h-4 w-4 mr-1" /> فاکتور جدید
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {profile.invoices.length === 0 ? (
              <p className="text-center py-4 text-muted-foreground">فاکتوری ثبت نشده است</p>
            ) : (
              <div className="space-y-4">
                {profile.invoices.slice(0, 5).map(invoice => (
                  <Link key={invoice.id} href={`/invoices/${invoice.id}`}>
                    <div className="flex justify-between items-center border-b pb-2 last:border-0 last:pb-0 hover:bg-muted/50 p-2 rounded cursor-pointer transition-colors">
                      <div>
                        <p className="font-medium">{invoice.title}</p>
                        <p className="text-xs text-muted-foreground">{formatJalaliDate(invoice.date)}</p>
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-sm">{formatToman(invoice.total_amount)}</p>
                        <Badge variant={invoice.status === "paid" ? "default" : "destructive"} className="mt-1 text-xs">
                          {invoice.status === "paid" ? "پرداخت شده" : "پرداخت نشده"}
                        </Badge>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
