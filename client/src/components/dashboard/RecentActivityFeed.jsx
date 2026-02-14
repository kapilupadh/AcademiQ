import { FileText, UserPlus, AlertTriangle, CheckCircle } from "lucide-react";

export default function RecentActivityFeed({ activities }) {
  const getIcon = (action) => {
    if (action.includes("Exam"))
      return <FileText className="w-4 h-4 text-blue-500" />;
    if (action.includes("Register") || action.includes("User"))
      return <UserPlus className="w-4 h-4 text-green-500" />;
    if (action.includes("Violation"))
      return <AlertTriangle className="w-4 h-4 text-red-500" />;
    return <CheckCircle className="w-4 h-4 text-zinc-500" />;
  };

  return (
    <div className="w-full bg-white p-4 rounded-xl border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800">
      <h3 className="text-lg font-semibold mb-4 text-zinc-900 dark:text-white">
        Recent Activities
      </h3>
      <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
        {activities.length === 0 && (
          <p className="text-zinc-500 text-sm">No recent activities.</p>
        )}
        {activities.map((log) => (
          <div
            key={log.id}
            className="flex gap-3 items-start pb-3 border-b border-zinc-100 dark:border-zinc-800 last:border-0"
          >
            <div className="mt-1 p-1.5 bg-zinc-50 rounded-full dark:bg-zinc-800">
              {getIcon(log.action)}
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-900 dark:text-white">
                {log.action}
              </p>
              <div className="flex gap-2 text-xs text-zinc-500 mt-0.5">
                <span>{log.User?.full_name || "System"}</span>
                <span>•</span>
                <span>{new Date(log.createdAt).toLocaleTimeString()}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
