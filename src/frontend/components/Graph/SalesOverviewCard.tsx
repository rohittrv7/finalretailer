import { Download } from "lucide-react";
import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export default function SalesOverviewCard() {
  const [data, setData] = useState(
    MONTH_LABELS.map((m) => ({ month: m, sales: 0, profit: 0 }))
  );

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res: any = await window.electronAPI.dashboard.get();
        if (!mounted) return;
        if (res && res.success && res.data && Array.isArray(res.data.months)) {
          const months = res.data.months.map((m: any) => ({
            month: MONTH_LABELS[Number(m.month) - 1] || m.month,
            sales: Number(m.sales || 0),
            profit: Number(m.profit || 0),
          }));
          // Ensure length 12
          const filled = MONTH_LABELS.map((label) => {
            const found = months.find((x) => x.month === label);
            return found || { month: label, sales: 0, profit: 0 };
          });
          setData(filled);
        }
      } catch (err) {
        // ignore — keep zeros
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
          Sales Overview
        </h3>
        <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
          <Download className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#e5e7eb"
              className="dark:stroke-slate-700"
            />
            <XAxis dataKey="month" tick={{ fill: "#6b7280" }} className="text-xs dark:text-gray-400" />
            <YAxis tick={{ fill: "#6b7280" }} className="text-xs dark:text-gray-400" />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(255, 255, 255, 0.95)",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              }}
              labelStyle={{ color: "#374151", fontWeight: "bold" }}
              wrapperStyle={{ backgroundColor: "transparent", borderRadius: "8px" }}
            />

            <Legend wrapperStyle={{ paddingTop: "20px" }} iconType="line" />
            <Line type="monotone" dataKey="sales" stroke="#3b82f6" strokeWidth={3} dot={{ fill: "#3b82f6", r: 5 }} activeDot={{ r: 7 }} name="Sales" animationDuration={1500} />
            <Line type="monotone" dataKey="profit" stroke="#8b5cf6" strokeWidth={3} dot={{ fill: "#8b5cf6", r: 5 }} activeDot={{ r: 7 }} name="Profit" animationDuration={1500} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
