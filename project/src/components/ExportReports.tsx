import { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { Download, FileText, FileSpreadsheet } from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export const ExportReports = () => {
  const { transactions, categories, wallets } = useData();
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  const [exporting, setExporting] = useState(false);

  const filteredTransactions = transactions.filter((t) => {
    const transactionDate = new Date(t.date);
    return transactionDate >= new Date(startDate) && transactionDate <= new Date(endDate);
  });

  const exportToPDF = () => {
    setExporting(true);
    try {
      const doc = new jsPDF();

      doc.setFontSize(20);
      doc.text('Expense Report', 14, 20);

      doc.setFontSize(10);
      doc.text(`Period: ${format(new Date(startDate), 'MMM dd, yyyy')} - ${format(new Date(endDate), 'MMM dd, yyyy')}`, 14, 30);
      doc.text(`Generated: ${format(new Date(), 'MMM dd, yyyy HH:mm')}`, 14, 36);

      const totalIncome = filteredTransactions
        .filter((t) => t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const totalExpenses = filteredTransactions
        .filter((t) => t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      doc.text(`Total Income: ₹${totalIncome.toFixed(2)}`, 14, 46);
      doc.text(`Total Expenses: ₹${totalExpenses.toFixed(2)}`, 14, 52);
      doc.text(`Net: ₹${(totalIncome - totalExpenses).toFixed(2)}`, 14, 58);

      const tableData = filteredTransactions.map((t) => {
        const category = categories.find((c) => c.id === t.category_id);
        const wallet = wallets.find((w) => w.id === t.wallet_id);
        return [
          format(new Date(t.date), 'MMM dd, yyyy'),
          t.type === 'expense' ? 'Expense' : 'Income',
          category?.name || 'Unknown',
          wallet?.name || 'Unknown',
          `₹${Number(t.amount).toFixed(2)}`,
          t.notes || '-',
        ];
      });

      autoTable(doc, {
        head: [['Date', 'Type', 'Category', 'Wallet', 'Amount', 'Notes']],
        body: tableData,
        startY: 65,
        theme: 'striped',
        headStyles: { fillColor: [16, 185, 129] },
      });

      doc.save(`expense-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    } finally {
      setExporting(false);
    }
  };

  const exportToExcel = () => {
    setExporting(true);
    try {
      const data = filteredTransactions.map((t) => {
        const category = categories.find((c) => c.id === t.category_id);
        const wallet = wallets.find((w) => w.id === t.wallet_id);
        return {
          Date: format(new Date(t.date), 'yyyy-MM-dd'),
          Type: t.type === 'expense' ? 'Expense' : 'Income',
          Category: category?.name || 'Unknown',
          Wallet: wallet?.name || 'Unknown',
          Amount: Number(t.amount),
          Notes: t.notes || '',
        };
      });

      const totalIncome = filteredTransactions
        .filter((t) => t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const totalExpenses = filteredTransactions
        .filter((t) => t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const summary = [
        {},
        { Date: 'Summary' },
        { Date: 'Total Income', Amount: totalIncome },
        { Date: 'Total Expenses', Amount: totalExpenses },
        { Date: 'Net', Amount: totalIncome - totalExpenses },
      ];

      const ws = XLSX.utils.json_to_sheet([...data, ...summary]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Transactions');

      XLSX.writeFile(wb, `expense-report-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Export Reports</h2>

      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Date Range</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-sm text-gray-600 mb-1">Transactions</p>
              <p className="text-2xl font-bold text-gray-900">{filteredTransactions.length}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Income</p>
              <p className="text-2xl font-bold text-emerald-600">
                ₹
                {filteredTransactions
                  .filter((t) => t.type === 'income')
                  .reduce((sum, t) => sum + Number(t.amount), 0)
                  .toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Expenses</p>
              <p className="text-2xl font-bold text-red-600">
                ₹
                {filteredTransactions
                  .filter((t) => t.type === 'expense')
                  .reduce((sum, t) => sum + Number(t.amount), 0)
                  .toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={exportToPDF}
            disabled={exporting || filteredTransactions.length === 0}
            className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileText className="w-5 h-5" />
            Export as PDF
          </button>

          <button
            onClick={exportToExcel}
            disabled={exporting || filteredTransactions.length === 0}
            className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileSpreadsheet className="w-5 h-5" />
            Export as Excel
          </button>
        </div>

        {filteredTransactions.length === 0 && (
          <p className="text-center text-gray-500 mt-4">No transactions found in the selected date range</p>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <Download className="w-6 h-6 text-blue-600 mt-1" />
          <div>
            <h4 className="font-semibold text-blue-900 mb-2">About Reports</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• PDF reports include a summary and detailed transaction table</li>
              <li>• Excel reports can be opened in Microsoft Excel, Google Sheets, or any spreadsheet software</li>
              <li>• All reports include transaction date, type, category, wallet, amount, and notes</li>
              <li>• Perfect for sharing with accountants or for personal record-keeping</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
