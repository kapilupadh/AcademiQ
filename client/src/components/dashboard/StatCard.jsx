import { motion } from "framer-motion";

export default function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  trendUp,
  color,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 bg-white rounded-xl border border-zinc-200 shadow-sm dark:bg-zinc-900 dark:border-zinc-800"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            {title}
          </p>
          <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mt-1">
            {value}
          </h3>
        </div>
        <div
          className={`p-3 rounded-lg ${color || "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"}`}
        >
          <Icon className="w-6 h-6" />
        </div>
      </div>
      {trend && (
        <div className="mt-4 flex items-center text-sm">
          <span
            className={`font-medium ${trendUp ? "text-green-600" : "text-red-600"}`}
          >
            {trend}
          </span>
          <span className="ml-2 text-zinc-400">vs last month</span>
        </div>
      )}
    </motion.div>
  );
}
