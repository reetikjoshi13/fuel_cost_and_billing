import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { Fuel, IndianRupee, TrendingDown, TrendingUp } from "lucide-react";

// Types
export type FuelLog = {
  id: string;
  busId: string;
  driver: string;
  station: string;
  liters: number;
  pricePerLiter: number;
  totalCost: number;
  odometer: number;
  date: string; // ISO
};

export type Expense = {
  id: string;
  driver: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  status: "pending" | "approved" | "rejected";
};

export type Invoice = {
  id: string;
  vendor: string;
  invoiceNumber: string;
  amount: number;
  dueDate: string;
  status: "pending" | "paid" | "rejected";
};

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

export default function Index() {
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  // Load from localStorage
  useEffect(() => {
    const f = localStorage.getItem("fcab:fuelLogs");
    const e = localStorage.getItem("fcab:expenses");
    const i = localStorage.getItem("fcab:invoices");
    setFuelLogs(f ? JSON.parse(f) : sampleFuelLogs());
    setExpenses(e ? JSON.parse(e) : []);
    setInvoices(i ? JSON.parse(i) : []);
  }, []);

  // Persist
  useEffect(() => {
    localStorage.setItem("fcab:fuelLogs", JSON.stringify(fuelLogs));
  }, [fuelLogs]);
  useEffect(() => {
    localStorage.setItem("fcab:expenses", JSON.stringify(expenses));
  }, [expenses]);
  useEffect(() => {
    localStorage.setItem("fcab:invoices", JSON.stringify(invoices));
  }, [invoices]);

  // Derived metrics
  const totals = useMemo(() => {
    const totalFuelSpend = fuelLogs.reduce((sum, l) => sum + l.totalCost, 0);
    const vendorSpendMap = fuelLogs.reduce<Record<string, number>>((acc, l) => {
      acc[l.station] = (acc[l.station] || 0) + l.totalCost;
      return acc;
    }, {});

    const mileagePoints: { busId: string; date: string; km: number; liters: number; mileage: number }[] = [];
    const byBus = fuelLogs
      .slice()
      .sort((a, b) => a.odometer - b.odometer)
      .reduce<Record<string, FuelLog[]>>((acc, l) => {
        (acc[l.busId] ||= []).push(l);
        return acc;
      }, {});
    Object.values(byBus).forEach((logs) => {
      logs.sort((a, b) => a.odometer - b.odometer);
      for (let i = 1; i < logs.length; i++) {
        const prev = logs[i - 1];
        const curr = logs[i];
        const km = Math.max(0, curr.odometer - prev.odometer);
        const liters = prev.liters;
        if (liters > 0 && km > 0) {
          mileagePoints.push({ busId: curr.busId, date: curr.date, km, liters, mileage: km / liters });
        }
      }
    });
    const avgMileage =
      mileagePoints.length > 0
        ? mileagePoints.reduce((s, p) => s + p.mileage, 0) / mileagePoints.length
        : 0;
    const totalKm = mileagePoints.reduce((s, p) => s + p.km, 0);
    const costPerKm = totalKm > 0 ? totalFuelSpend / totalKm : 0;

    const busMileage = Object.entries(
      mileagePoints.reduce<Record<string, { sum: number; count: number }>>((acc, p) => {
        const e = (acc[p.busId] ||= { sum: 0, count: 0 });
        e.sum += p.mileage;
        e.count += 1;
        return acc;
      }, {}),
    ).map(([busId, v]) => ({ busId, mileage: v.sum / v.count }));

    const vendorSpend = Object.entries(vendorSpendMap)
      .map(([vendor, amount]) => ({ vendor, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 6);

    const baseline = avgMileage || 4.5; // km/l
    const alerts = mileagePoints
      .filter((p) => p.mileage < baseline * 0.8)
      .slice(-5)
      .map((p) => ({
        id: `${p.busId}-${p.date}`,
        type: "mileage_drop" as const,
        message: `Mileage drop on ${p.busId}: ${(p.mileage).toFixed(2)} km/l (< ${(baseline * 0.8).toFixed(1)} km/l)`,
        severity: p.mileage < baseline * 0.6 ? "high" : "medium",
        date: p.date,
      }));

    return { totalFuelSpend, costPerKm, avgMileage, busMileage, vendorSpend, alerts };
  }, [fuelLogs]);

  // Form state
  const [openLog, setOpenLog] = useState(false);
  const [openExpense, setOpenExpense] = useState(false);
  const [openInvoice, setOpenInvoice] = useState(false);

  // Handlers
  function addFuelLog(form: Omit<FuelLog, "id" | "totalCost">) {
    const totalCost = form.liters * form.pricePerLiter;
    setFuelLogs((prev) => [...prev, { ...form, id: uid(), totalCost }]);
    setOpenLog(false);
  }
  function addExpense(form: Omit<Expense, "id" | "status">) {
    setExpenses((prev) => [...prev, { ...form, id: uid(), status: "pending" }]);
    setOpenExpense(false);
  }
  function addInvoice(form: Omit<Invoice, "id" | "status">) {
    setInvoices((prev) => [...prev, { ...form, id: uid(), status: "pending" }]);
    setOpenInvoice(false);
  }

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <div className="rounded-xl border bg-gradient-to-br from-brand-ink/5 to-brand-teal/5 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Fuel className="h-4 w-4" /> Team 3
            </div>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">
              Fuel, Costs & Billing
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Every rupee justified, every drop accountable.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Dialog open={openLog} onOpenChange={setOpenLog}>
              <DialogTrigger asChild>
                <Button>Log Refuel</Button>
              </DialogTrigger>
              <FuelLogDialog onSubmit={addFuelLog} />
            </Dialog>
            <Dialog open={openExpense} onOpenChange={setOpenExpense}>
              <DialogTrigger asChild>
                <Button variant="outline">New Expense</Button>
              </DialogTrigger>
              <ExpenseDialog onSubmit={addExpense} />
            </Dialog>
            <Dialog open={openInvoice} onOpenChange={setOpenInvoice}>
              <DialogTrigger asChild>
                <Button variant="ghost">New Invoice</Button>
              </DialogTrigger>
              <InvoiceDialog onSubmit={addInvoice} />
            </Dialog>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <KpiCard title="Total Fuel Spend" value={`₹ ${totals.totalFuelSpend.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`} trendIcon={<TrendingUp className="h-4 w-4 text-brand-amber" />} />
        <KpiCard title="Avg Cost / km" value={`₹ ${totals.costPerKm.toFixed(2)}`} trendIcon={<IndianRupee className="h-4 w-4 text-muted-foreground" />} />
        <KpiCard title="Avg Mileage" value={`${totals.avgMileage.toFixed(2)} km/l`} trendIcon={<TrendingDown className="h-4 w-4 text-muted-foreground" />} />
        <KpiCard title="Pending Approvals" value={`${expenses.filter((e) => e.status === "pending").length + invoices.filter((i) => i.status === "pending").length}`} trendIcon={<Badge variant="secondary">live</Badge>} />
      </div>

      <div className="grid gap-4 md:grid-cols-7">
        <Card className="md:col-span-4">
          <CardHeader>
            <CardTitle>Mileage per Bus</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{ mileage: { label: "Mileage (km/l)", color: "hsl(var(--brand-teal))" } }}
            >
              <BarChart data={totals.busMileage}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="busId" tickLine={false} axisLine={false} />
                <YAxis tickFormatter={(v) => `${v.toFixed(1)}`} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="mileage" fill="var(--color-mileage)" radius={6} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>Vendor Spend</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{ amount: { label: "Amount", color: "hsl(var(--brand-ink))" } }}>
              <LineChart data={totals.vendorSpend}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="vendor" tickLine={false} axisLine={false} interval={0} angle={-20} textAnchor="end" height={60} />
                <YAxis tickFormatter={(v) => `₹${v / 1000}k`} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="amount" stroke="var(--color-amount)" strokeWidth={2} dot={false} />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-7">
        <Card className="md:col-span-4">
          <CardHeader>
            <CardTitle>Recent Fuel Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bus</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead>Station</TableHead>
                  <TableHead className="text-right">Liters</TableHead>
                  <TableHead className="text-right">₹/L</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                  <TableHead>Odometer</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fuelLogs
                  .slice()
                  .sort((a, b) => +new Date(b.date) - +new Date(a.date))
                  .slice(0, 8)
                  .map((l) => (
                    <TableRow key={l.id}>
                      <TableCell>{l.busId}</TableCell>
                      <TableCell>{l.driver}</TableCell>
                      <TableCell>{l.station}</TableCell>
                      <TableCell className="text-right">{l.liters.toFixed(1)}</TableCell>
                      <TableCell className="text-right">{l.pricePerLiter.toFixed(2)}</TableCell>
                      <TableCell className="text-right">₹ {l.totalCost.toFixed(0)}</TableCell>
                      <TableCell>{l.odometer.toLocaleString()}</TableCell>
                      <TableCell>{new Date(l.date).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">Alerts
              <Badge variant="secondary">{totals.alerts.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {totals.alerts.length === 0 && (
                <p className="text-sm text-muted-foreground">No alerts. All good.</p>
              )}
              {totals.alerts.map((a) => (
                <div
                  key={a.id}
                  className="rounded-md border bg-card p-3 text-sm"
                >
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{a.message}</div>
                    <Badge variant={a.severity === "high" ? "destructive" : "outline"}>
                      {a.severity}
                    </Badge>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {new Date(a.date).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="expenses">
        <TabsList>
          <TabsTrigger value="expenses">Expense Claims</TabsTrigger>
          <TabsTrigger value="invoices">Vendor Invoices</TabsTrigger>
        </TabsList>
        <TabsContent value="expenses">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Expense Claims
                <Badge variant="secondary">{expenses.filter((e) => e.status === "pending").length} pending</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Driver</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Amount (₹)</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        No expenses yet.
                      </TableCell>
                    </TableRow>
                  )}
                  {expenses.slice(0, 6).map((e) => (
                    <TableRow key={e.id}>
                      <TableCell>{e.driver}</TableCell>
                      <TableCell>{e.category}</TableCell>
                      <TableCell className="text-right">{e.amount.toLocaleString("en-IN")}</TableCell>
                      <TableCell>{new Date(e.date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            e.status === "pending"
                              ? "outline"
                              : e.status === "approved"
                              ? "default"
                              : "destructive"
                          }
                        >
                          {e.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="invoices">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Vendor Invoices
                <Badge variant="secondary">{invoices.filter((i) => i.status === "pending").length} pending</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Invoice #</TableHead>
                    <TableHead className="text-right">Amount (₹)</TableHead>
                    <TableHead>Due</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        No invoices yet.
                      </TableCell>
                    </TableRow>
                  )}
                  {invoices.slice(0, 6).map((e) => (
                    <TableRow key={e.id}>
                      <TableCell>{e.vendor}</TableCell>
                      <TableCell>{e.invoiceNumber}</TableCell>
                      <TableCell className="text-right">{e.amount.toLocaleString("en-IN")}</TableCell>
                      <TableCell>{new Date(e.dueDate).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            e.status === "pending"
                              ? "outline"
                              : e.status === "paid"
                              ? "default"
                              : "destructive"
                          }
                        >
                          {e.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Separator />
      <p className="text-sm text-muted-foreground">
        Data is stored in your browser for now.
      </p>
    </div>
  );
}

function KpiCard({ title, value, trendIcon }: { title: string; value: string; trendIcon?: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="text-2xl font-semibold">{value}</div>
          {trendIcon}
        </div>
      </CardContent>
    </Card>
  );
}

function FuelLogDialog({ onSubmit }: { onSubmit: (data: Omit<FuelLog, "id" | "totalCost">) => void }) {
  const [form, setForm] = useState({
    busId: "BUS-101",
    driver: "Amit",
    station: "HPCL",
    liters: 50,
    pricePerLiter: 99.5,
    odometer: 120000,
    date: new Date().toISOString().slice(0, 10),
  });
  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Log Refuel</DialogTitle>
      </DialogHeader>
      <div className="grid gap-4 py-2 md:grid-cols-2">
        <Field label="Bus ID" value={form.busId} onChange={(v) => setForm({ ...form, busId: v })} />
        <Field label="Driver" value={form.driver} onChange={(v) => setForm({ ...form, driver: v })} />
        <Field label="Station" value={form.station} onChange={(v) => setForm({ ...form, station: v })} />
        <Field label="Liters" type="number" value={String(form.liters)} onChange={(v) => setForm({ ...form, liters: Number(v) })} />
        <Field label="Price/L" type="number" value={String(form.pricePerLiter)} onChange={(v) => setForm({ ...form, pricePerLiter: Number(v) })} />
        <Field label="Odometer" type="number" value={String(form.odometer)} onChange={(v) => setForm({ ...form, odometer: Number(v) })} />
        <Field label="Date" type="date" value={form.date} onChange={(v) => setForm({ ...form, date: v })} />
      </div>
      <DialogFooter>
        <Button onClick={() => onSubmit({ ...form, date: new Date(form.date).toISOString() })}>Save</Button>
      </DialogFooter>
    </DialogContent>
  );
}

function ExpenseDialog({ onSubmit }: { onSubmit: (data: Omit<Expense, "id" | "status">) => void }) {
  const [form, setForm] = useState({
    driver: "Amit",
    amount: 500,
    category: "Meals",
    description: "Lunch on route",
    date: new Date().toISOString().slice(0, 10),
  });
  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>New Expense</DialogTitle>
      </DialogHeader>
      <div className="grid gap-4 py-2 md:grid-cols-2">
        <Field label="Driver" value={form.driver} onChange={(v) => setForm({ ...form, driver: v })} />
        <Field label="Amount (₹)" type="number" value={String(form.amount)} onChange={(v) => setForm({ ...form, amount: Number(v) })} />
        <Field label="Category" value={form.category} onChange={(v) => setForm({ ...form, category: v })} />
        <div className="md:col-span-2">
          <Label className="mb-1 block">Description</Label>
          <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <Field label="Date" type="date" value={form.date} onChange={(v) => setForm({ ...form, date: v })} />
      </div>
      <DialogFooter>
        <Button onClick={() => onSubmit({ ...form, date: new Date(form.date).toISOString() })}>Save</Button>
      </DialogFooter>
    </DialogContent>
  );
}

function InvoiceDialog({ onSubmit }: { onSubmit: (data: Omit<Invoice, "id" | "status">) => void }) {
  const [form, setForm] = useState({
    vendor: "HPCL",
    invoiceNumber: "INV-001",
    amount: 12000,
    dueDate: new Date().toISOString().slice(0, 10),
  });
  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>New Invoice</DialogTitle>
      </DialogHeader>
      <div className="grid gap-4 py-2 md:grid-cols-2">
        <Field label="Vendor" value={form.vendor} onChange={(v) => setForm({ ...form, vendor: v })} />
        <Field label="Invoice #" value={form.invoiceNumber} onChange={(v) => setForm({ ...form, invoiceNumber: v })} />
        <Field label="Amount (₹)" type="number" value={String(form.amount)} onChange={(v) => setForm({ ...form, amount: Number(v) })} />
        <Field label="Due Date" type="date" value={form.dueDate} onChange={(v) => setForm({ ...form, dueDate: v })} />
      </div>
      <DialogFooter>
        <Button onClick={() => onSubmit({ ...form, dueDate: new Date(form.dueDate).toISOString() })}>Save</Button>
      </DialogFooter>
    </DialogContent>
  );
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <Label className="mb-1 block">{label}</Label>
      <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function sampleFuelLogs(): FuelLog[] {
  const now = new Date();
  const daysAgo = (n: number) => new Date(now.getTime() - n * 86400000).toISOString();
  const rows: FuelLog[] = [
    { id: uid(), busId: "BUS-101", driver: "Amit", station: "HPCL", liters: 55, pricePerLiter: 98.7, totalCost: 5429, odometer: 120000, date: daysAgo(12) },
    { id: uid(), busId: "BUS-102", driver: "Ravi", station: "IOCL", liters: 60, pricePerLiter: 99.2, totalCost: 5952, odometer: 98000, date: daysAgo(11) },
    { id: uid(), busId: "BUS-101", driver: "Amit", station: "BPCL", liters: 50, pricePerLiter: 99.9, totalCost: 4995, odometer: 120210, date: daysAgo(9) },
    { id: uid(), busId: "BUS-103", driver: "Neha", station: "HPCL", liters: 65, pricePerLiter: 98.3, totalCost: 6389, odometer: 75210, date: daysAgo(8) },
    { id: uid(), busId: "BUS-102", driver: "Ravi", station: "Reliance", liters: 58, pricePerLiter: 97.8, totalCost: 5672, odometer: 98220, date: daysAgo(7) },
    { id: uid(), busId: "BUS-101", driver: "Amit", station: "HPCL", liters: 52, pricePerLiter: 98.4, totalCost: 5117, odometer: 120430, date: daysAgo(5) },
    { id: uid(), busId: "BUS-103", driver: "Neha", station: "IOCL", liters: 62, pricePerLiter: 99.1, totalCost: 6144, odometer: 75410, date: daysAgo(3) },
    { id: uid(), busId: "BUS-102", driver: "Ravi", station: "BPCL", liters: 59, pricePerLiter: 99.6, totalCost: 5886, odometer: 98410, date: daysAgo(2) },
    { id: uid(), busId: "BUS-101", driver: "Amit", station: "Reliance", liters: 51, pricePerLiter: 98.2, totalCost: 5008, odometer: 120640, date: daysAgo(1) },
  ];
  return rows;
}
