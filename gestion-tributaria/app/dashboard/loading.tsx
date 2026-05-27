export default function DashboardLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="flex items-center gap-3 mb-8">
        <div className="h-10 w-10 rounded-xl bg-slate-200" />
        <div className="space-y-1.5">
          <div className="h-6 bg-slate-200 rounded w-48" />
          <div className="h-4 bg-slate-200 rounded w-32" />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-100">
          <div className="h-9 bg-slate-100 rounded-xl w-64" />
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="px-6 py-4 border-b border-slate-50 flex items-center justify-between">
            <div className="space-y-1.5">
              <div className="h-4 bg-slate-100 rounded w-40" />
              <div className="h-3 bg-slate-100 rounded w-28" />
            </div>
            <div className="flex items-center gap-2">
              <div className="h-6 bg-slate-100 rounded-full w-20" />
              <div className="h-6 bg-slate-100 rounded-lg w-16" />
            </div>
          </div>
        ))}
        <div className="px-6 py-3 border-t border-slate-100 flex items-center justify-between">
          <div className="h-4 bg-slate-100 rounded w-20" />
          <div className="h-4 bg-slate-100 rounded w-24" />
          <div className="h-4 bg-slate-100 rounded w-20" />
        </div>
      </div>
    </div>
  );
}
