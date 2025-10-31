import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

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

export default function Approvals() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  useEffect(() => {
    const e = localStorage.getItem("fcab:expenses");
    const i = localStorage.getItem("fcab:invoices");
    setExpenses(e ? JSON.parse(e) : []);
    setInvoices(i ? JSON.parse(i) : []);
  }, []);

  useEffect(() => {
    localStorage.setItem("fcab:expenses", JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem("fcab:invoices", JSON.stringify(invoices));
  }, [invoices]);

  const pendingCounts = useMemo(
    () => ({
      expenses: expenses.filter((e) => e.status === "pending").length,
      invoices: invoices.filter((i) => i.status === "pending").length,
    }),
    [expenses, invoices],
  );

  const updateExpenseStatus = (id: string, status: Expense["status"]) => {
    setExpenses((prev) => prev.map((e) => (e.id === id ? { ...e, status } : e)));
  };

  const updateInvoiceStatus = (
    id: string,
    status: Invoice["status"],
  ) => {
    setInvoices((prev) => prev.map((e) => (e.id === id ? { ...e, status } : e)));
  };

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Expense Claims
              <Badge variant="secondary">{pendingCounts.expenses} pending</Badge>
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
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      No expenses yet. Add from the Dashboard.
                    </TableCell>
                  </TableRow>
                )}
                {expenses.map((e) => (
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
                    <TableCell className="space-x-2 text-right">
                      <Button size="sm" variant="outline" onClick={() => updateExpenseStatus(e.id, "approved")}>Approve</Button>
                      <Button size="sm" variant="ghost" onClick={() => updateExpenseStatus(e.id, "rejected")}>Reject</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Vendor Invoices
              <Badge variant="secondary">{pendingCounts.invoices} pending</Badge>
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
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      No invoices yet. Add from the Dashboard.
                    </TableCell>
                  </TableRow>
                )}
                {invoices.map((e) => (
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
                    <TableCell className="space-x-2 text-right">
                      <Button size="sm" variant="outline" onClick={() => updateInvoiceStatus(e.id, "paid")}>Mark Paid</Button>
                      <Button size="sm" variant="ghost" onClick={() => updateInvoiceStatus(e.id, "rejected")}>Reject</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      <Separator />
      <p className="text-sm text-muted-foreground">
        Managed locally. Connect a database to persist across sessions.
      </p>
    </div>
  );
}
