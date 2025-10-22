import { ArrowDownCircle, ArrowUpCircle, Clock, PlusCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from 'react';
import FlashMessage from '@/components/FlashMessage';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function Overview() {
  const [flash, setFlash] = useState<string | null>(null);

  useEffect(() => {
    try {
  const justRegistered = sessionStorage.getItem('justRegistered');
  const justLoggedIn = sessionStorage.getItem('justLoggedIn');
  const depositMessage = sessionStorage.getItem('depositMessage');
  const withdrawMessage = sessionStorage.getItem('withdrawMessage');

      if (justRegistered) {
        const data = JSON.parse(justRegistered);
        setFlash(`Registration successful, welcome ${data.username}`);
        sessionStorage.removeItem('justRegistered');
      } else if (justLoggedIn) {
        const data = JSON.parse(justLoggedIn);
        setFlash(`Welcome back ${data.username}`);
        sessionStorage.removeItem('justLoggedIn');
      } else if (depositMessage) {
        const data = JSON.parse(depositMessage);
        setFlash(data.message);
        sessionStorage.removeItem('depositMessage');
      } else if (withdrawMessage) {
        const data = JSON.parse(withdrawMessage);
        setFlash(data.message);
        sessionStorage.removeItem('withdrawMessage');
      }
    } catch (err) {
      // ignore parse errors
    }
  }, []);

  return (
    <div className="space-y-6">
      {flash && <FlashMessage message={flash} onClose={() => setFlash(null)} duration={10000} />}
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Overview</h1>
        <p className="text-muted-foreground">
          Welcome to your investment dashboard. Get a snapshot of your balances,
          deposits, withdrawals, and recent activity.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <div className="rounded-xl border border-border bg-card p-4">
          <h2 className="text-sm font-medium text-muted-foreground">Total Balance</h2>
          <p className="mt-2 text-2xl font-bold text-primary">$12,540</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <h2 className="text-sm font-medium text-muted-foreground">Active Investments</h2>
          <p className="mt-2 text-2xl font-bold">5</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <h2 className="text-sm font-medium text-muted-foreground">Pending Withdrawals</h2>
          <p className="mt-2 text-2xl font-bold text-destructive">$1,200</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <h2 className="text-sm font-medium text-muted-foreground">Total Deposits</h2>
          <p className="mt-2 text-2xl font-bold text-green-500">$8,400</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <h2 className="text-sm font-medium text-muted-foreground">Total Withdrawals</h2>
          <p className="mt-2 text-2xl font-bold text-blue-500">$4,600</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Link
          to="/dashboard/deposit"
          className="flex items-center justify-center gap-2 rounded-xl border border-green-500/20 bg-green-500/10 p-4 text-sm font-medium text-green-500 transition hover:bg-green-500/20"
        >
          <ArrowDownCircle size={18} /> Deposit Now
        </Link>
        <Link
          to="/dashboard/withdraw"
          className="flex items-center justify-center gap-2 rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-sm font-medium text-destructive transition hover:bg-destructive/20"
        >
          <ArrowUpCircle size={18} /> Withdraw Now
        </Link>
        <Link
          to="/dashboard/transactions"
          className="flex items-center justify-center gap-2 rounded-xl border border-blue-500/20 bg-blue-500/10 p-4 text-sm font-medium text-blue-500 transition hover:bg-blue-500/20"
        >
          <Clock size={18} /> View Transactions
        </Link>
      </div>

      {/* Recent Transactions */}
      <div className="rounded-xl border border-border bg-card p-4">
        <h2 className="text-lg font-semibold mb-4">Recent Transactions</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-muted-foreground text-left border-b border-border">
              <tr>
                <th className="py-2">Type</th>
                <th className="py-2">Date</th>
                <th className="py-2">Status</th>
                <th className="py-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border">
                <td className="py-2">Deposit</td>
                <td className="py-2">Sep 20, 2025</td>
                <td className="py-2 text-green-500">Completed</td>
                <td className="py-2 text-right">$500</td>
              </tr>
              <tr className="border-b border-border">
                <td className="py-2">Withdrawal</td>
                <td className="py-2">Sep 18, 2025</td>
                <td className="py-2 text-yellow-500">Pending</td>
                <td className="py-2 text-right">$200</td>
              </tr>
              <tr>
                <td className="py-2">Deposit</td>
                <td className="py-2">Sep 15, 2025</td>
                <td className="py-2 text-green-500">Completed</td>
                <td className="py-2 text-right">$1,000</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Investment Performance Chart */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold mb-4">Investment Performance</h2>
        <div className="h-[300px]">
          <Line
            data={{
              labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'],
              datasets: [
                {
                  label: 'Portfolio Value',
                  data: [10000, 11200, 10800, 12400, 12000, 13200, 15000, 14800, 16000],
                  borderColor: 'rgb(124, 58, 237)', // crypto-purple
                  backgroundColor: 'rgba(124, 58, 237, 0.1)',
                  tension: 0.4,
                  fill: true,
                },
                {
                  label: 'Profit/Loss',
                  data: [0, 1200, -400, 1600, -400, 1200, 1800, -200, 1200],
                  borderColor: 'rgb(34, 197, 94)', // green-500
                  backgroundColor: 'rgba(34, 197, 94, 0.1)',
                  tension: 0.4,
                  fill: true,
                }
              ],
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                y: {
                  beginAtZero: true,
                  grid: {
                    color: 'rgba(255, 255, 255, 0.1)',
                  },
                  ticks: {
                    callback: (value) => '$' + value.toLocaleString(),
                  },
                },
                x: {
                  grid: {
                    color: 'rgba(255, 255, 255, 0.1)',
                  },
                },
              },
              plugins: {
                legend: {
                  position: 'top' as const,
                  labels: {
                    padding: 20,
                  },
                },
                tooltip: {
                  callbacks: {
                    label: (context) => {
                      let label = context.dataset.label || '';
                      if (label) {
                        label += ': ';
                      }
                      if (context.parsed.y !== null) {
                        label += '$' + context.parsed.y.toLocaleString();
                      }
                      return label;
                    },
                  },
                },
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}
