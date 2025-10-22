import { useState, useMemo } from 'react';
import { Search, ArrowUpDown, Calendar, Filter } from 'lucide-react';

export default function Transactions() {
  const history = [
    { id: 1, type: "Deposit", amount: "$500", date: "2025-09-15" },
    { id: 2, type: "Withdraw", amount: "$200", date: "2025-09-20" },
    { id: 3, type: "Deposit", amount: "$1,000", date: "2025-09-22" },
    { id: 4, type: "Withdraw", amount: "$150", date: "2025-09-23" },
    { id: 5, type: "Deposit", amount: "$2,500", date: "2025-09-24" },
    { id: 6, type: "Deposit", amount: "$300", date: "2025-09-25" },
    { id: 7, type: "Withdraw", amount: "$100", date: "2025-09-26" },
    { id: 8, type: "Deposit", amount: "$750", date: "2025-09-27" },
    { id: 9, type: "Withdraw", amount: "$400", date: "2025-09-28" },
    { id: 10, type: "Deposit", amount: "$1,200", date: "2025-09-29" },
  ];

  // State for filters and search
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Filtered and sorted transactions
  const filteredTransactions = useMemo(() => {
    return history
      .filter(tx => {
        // Search filter
        const matchesSearch = search === '' ||
          tx.amount.toLowerCase().includes(search.toLowerCase()) ||
          tx.type.toLowerCase().includes(search.toLowerCase()) ||
          tx.date.includes(search);

        // Type filter
        const matchesType = typeFilter === 'all' ||
          tx.type.toLowerCase() === typeFilter.toLowerCase();

        // Date range filter
        const matchesDateRange = (!startDate || tx.date >= startDate) &&
          (!endDate || tx.date <= endDate);

        return matchesSearch && matchesType && matchesDateRange;
      })
      .sort((a, b) => {
        // Sort by date
        if (sortOrder === 'newest') {
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        }
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      });
  }, [search, typeFilter, sortOrder, startDate, endDate]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Transaction History</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')}
            className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border border-border hover:bg-muted transition-colors"
          >
            <ArrowUpDown size={16} />
            {sortOrder === 'newest' ? 'Newest First' : 'Oldest First'}
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="grid gap-4 md:grid-cols-4">
        {/* Search */}
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search transactions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-crypto-purple"
          />
        </div>

        {/* Type Filter */}
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-crypto-purple"
        >
          <option value="all">All Types</option>
          <option value="deposit">Deposits Only</option>
          <option value="withdraw">Withdrawals Only</option>
        </select>

        {/* Date Range */}
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-crypto-purple"
        />
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-crypto-purple"
        />
      </div>

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredTransactions.length} transactions
      </div>

      {/* Transactions Table */}
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="min-w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Type</th>
              <th className="px-4 py-3 text-left font-medium">Amount</th>
              <th className="px-4 py-3 text-left font-medium">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredTransactions.map((tx) => (
              <tr key={tx.id} className="hover:bg-muted/50 transition-colors">
                <td className="px-4 py-3">
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                    tx.type === 'Deposit' ? 'bg-green-500/10 text-green-500' : 'bg-blue-500/10 text-blue-500'
                  }`}>
                    {tx.type}
                  </span>
                </td>
                <td className="px-4 py-3">{tx.amount}</td>
                <td className="px-4 py-3">{new Date(tx.date).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
