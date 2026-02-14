import CalendarHeatmap from "react-calendar-heatmap";
import "react-calendar-heatmap/dist/styles.css";

export default function AttendanceHeatmap({ data }) {
  // data format: [{ date: '2023-01-01', count: 85 }]
  const today = new Date(); // To show consistent end date

  return (
    <div className="h-[300px] w-full bg-white p-4 rounded-xl border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800">
      <h3 className="text-lg font-semibold mb-4 text-zinc-900 dark:text-white">
        Attendance Heatmap (30 Days)
      </h3>
      <div className="flex items-center justify-center h-[200px]">
        <CalendarHeatmap
          startDate={
            new Date(
              today.getFullYear(),
              today.getMonth(),
              today.getDate() - 30,
            )
          }
          endDate={today}
          values={data}
          classForValue={(value) => {
            if (!value || value.count === 0) {
              return "color-empty fill-zinc-100 dark:fill-zinc-800";
            }
            if (value.count >= 90) return "fill-green-500";
            if (value.count >= 75) return "fill-yellow-500";
            return "fill-red-500";
          }}
          tooltipDataAttrs={(value) => {
            return {
              title: value.date ? `${value.date}: ${value.count}%` : "No data",
            };
          }}
          showWeekdayLabels={true}
        />
        {/* Simple Legend */}
      </div>
      <div className="flex gap-4 text-xs justify-center mt-2 text-zinc-500">
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 bg-red-500 rounded-sm"></span> &lt;75%
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 bg-yellow-500 rounded-sm"></span> 75-90%
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 bg-green-500 rounded-sm"></span> &gt;90%
        </div>
      </div>
    </div>
  );
}
