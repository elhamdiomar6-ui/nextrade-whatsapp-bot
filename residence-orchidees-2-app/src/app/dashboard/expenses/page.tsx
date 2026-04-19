import { prisma } from "@/lib/prisma";
import { ExpensesClient } from "./ExpensesClient";
import { getAttachmentMap } from "@/lib/attachments";

export default async function ExpensesPage() {
  const [expenses, categories] = await Promise.all([
    prisma.expense.findMany({ orderBy: { date: "desc" }, include: { category: true } }),
    prisma.expenseCategory.findMany({ orderBy: { nameFr: "asc" } }),
  ]);

  const attMap = await getAttachmentMap("expense", expenses.map((e) => e.id));

  const totalByCategory = categories.map((cat) => ({
    id: cat.id, nameFr: cat.nameFr, nameAr: cat.nameAr,
    total: expenses.filter((e) => e.categoryId === cat.id).reduce((acc, e) => acc + e.amount, 0),
    count: expenses.filter((e) => e.categoryId === cat.id).length,
  }));

  return (
    <ExpensesClient
      expenses={expenses.map((e) => ({
        id: e.id, title: e.title, amount: e.amount,
        date: e.date.toISOString(), description: e.description,
        categoryId: e.categoryId,
        categoryNameFr: e.category.nameFr,
        categoryNameAr: e.category.nameAr ?? e.category.nameFr,
        attachments: attMap[e.id] ?? [],
      }))}
      totalByCategory={totalByCategory}
      grandTotal={expenses.reduce((acc, e) => acc + e.amount, 0)}
      categories={categories.map((c) => ({ id: c.id, nameFr: c.nameFr, nameAr: c.nameAr }))}
    />
  );
}
