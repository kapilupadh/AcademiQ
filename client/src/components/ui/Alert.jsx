import { CheckCircle2, AlertCircle, Info } from "lucide-react";

export default function Alert({ variant = "default", title, children }) {
  const isError = variant === "error";
  const isSuccess = variant === "success";

  // Icon Selection
  let Icon = Info;
  if (isError) Icon = AlertCircle;
  if (isSuccess) Icon = CheckCircle2;

  // Color Selection (Icon & Title)
  let colorClass = "text-zinc-100"; // default
  if (isError) colorClass = "text-rose-500";
  if (isSuccess) colorClass = "text-emerald-500";

  return (
    <div className="w-full p-4 rounded-xl border bg-zinc-950 border-zinc-800 flex items-start gap-4 shadow-lg transition-all animate-in fade-in slide-in-from-top-2 duration-300">
      <div className={`mt-0.5 p-1 rounded-full bg-zinc-900/50 ${colorClass}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="space-y-1">
        <h5
          className={`font-semibold text-base leading-none tracking-tight ${colorClass}`}
        >
          {title}
        </h5>
        {children && (
          <div className="text-sm text-zinc-400 font-medium leading-relaxed">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}
