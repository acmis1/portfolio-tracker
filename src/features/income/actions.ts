'use server'

import { prisma } from "@/lib/db";
import { CashTransactionType } from "@prisma/client";

export async function getIncomeHistory() {
  try {
    const transactions = await prisma.cashTransaction.findMany({
      where: {
        type: {
          in: [CashTransactionType.DIVIDEND, CashTransactionType.INTEREST],
        },
      },
      orderBy: { date: "asc" },
    });

    if (transactions.length === 0) {
      return {
        history: [],
        summary: {
          totalYTD: 0,
          totalAllTime: 0,
          avgMonthly: 0,
        },
        recent: [],
      };
    }

    // Aggregate by month
    const monthlyData: Record<string, { dividend: number; interest: number; date: Date }> = {};
    
    // Find absolute first and last months to fill gaps
    const firstDate = new Date(transactions[0].date);
    firstDate.setDate(1);
    firstDate.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setDate(1);
    today.setHours(0, 0, 0, 0);

    // Initialize all months with zero
    let current = new Date(firstDate);
    while (current <= today) {
      const key = current.toLocaleString('default', { month: 'short', year: 'numeric' });
      monthlyData[key] = { dividend: 0, interest: 0, date: new Date(current) };
      current.setMonth(current.getMonth() + 1);
    }

    let totalAllTime = 0;
    let totalYTD = 0;
    const currentYear = new Date().getFullYear();

    transactions.forEach((tx: any) => {
      const d = new Date(tx.date);
      const key = d.toLocaleString('default', { month: 'short', year: 'numeric' });
      
      if (monthlyData[key]) {
        if (tx.type === CashTransactionType.DIVIDEND) {
          monthlyData[key].dividend += tx.amount;
        } else if (tx.type === CashTransactionType.INTEREST) {
          monthlyData[key].interest += tx.amount;
        }
      }
      
      totalAllTime += tx.amount;
      if (d.getFullYear() === currentYear) {
        totalYTD += tx.amount;
      }
    });

    const history = Object.entries(monthlyData).map(([name, data]: [string, any]) => ({
      name,
      dividend: data.dividend,
      interest: data.interest,
      total: data.dividend + data.interest,
      rawDate: data.date
    }));

    // Average monthly (trailing 12 months)
    const trailing12 = history.slice(-12);
    const avgMonthly = trailing12.reduce((acc: number, curr: any) => acc + curr.total, 0) / (trailing12.length || 1);

    // Recent 10
    const recent = await prisma.cashTransaction.findMany({
      where: {
        type: {
          in: [CashTransactionType.DIVIDEND, CashTransactionType.INTEREST],
        },
      },
      orderBy: { date: "desc" },
      take: 10,
    });

    return {
      history,
      summary: {
        totalYTD,
        totalAllTime,
        avgMonthly,
      },
      recent,
    };
  } catch (error: any) {
    console.error("Failed to fetch income history:", error);
    return {
      history: [],
      summary: { totalYTD: 0, totalAllTime: 0, avgMonthly: 0 },
      recent: [],
    };
  }
}
