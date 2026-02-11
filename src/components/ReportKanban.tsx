import { useState } from "react";
import { FileText, GripVertical } from "lucide-react";

export interface ReportData {
  id: string;
  report_url: string;
  image_name: string;
  timestamp: string;
}

export type KanbanStatus = "pending" | "in_progress" | "completed";

interface ReportKanbanProps {
  reports: ReportData[];
}

const STATUS_CONFIG: Record<KanbanStatus, { label: string; color: string; bg: string; border: string }> = {
  pending: {
    label: "Pending",
    color: "text-primary",
    bg: "bg-primary/5",
    border: "border-primary/20",
  },
  in_progress: {
    label: "In Progress",
    color: "text-accent",
    bg: "bg-accent/5",
    border: "border-accent/20",
  },
  completed: {
    label: "Completed",
    color: "text-success",
    bg: "bg-success/5",
    border: "border-success/20",
  },
};

const COLUMNS: KanbanStatus[] = ["pending", "in_progress", "completed"];

const ReportKanban = ({ reports }: ReportKanbanProps) => {
  const [board, setBoard] = useState<Record<KanbanStatus, ReportData[]>>(() => ({
    pending: reports,
    in_progress: [],
    completed: [],
  }));

  const [dragItem, setDragItem] = useState<{ status: KanbanStatus; index: number } | null>(null);
  const [dragOver, setDragOver] = useState<KanbanStatus | null>(null);

  // Sync if reports prop changes
  useState(() => {
    setBoard((prev) => {
      const existingIds = new Set([
        ...prev.pending.map((r) => r.id),
        ...prev.in_progress.map((r) => r.id),
        ...prev.completed.map((r) => r.id),
      ]);
      const newReports = reports.filter((r) => !existingIds.has(r.id));
      return { ...prev, pending: [...prev.pending, ...newReports] };
    });
  });

  const handleDragStart = (status: KanbanStatus, index: number) => {
    setDragItem({ status, index });
  };

  const handleDragOver = (e: React.DragEvent, status: KanbanStatus) => {
    e.preventDefault();
    setDragOver(status);
  };

  const handleDragLeave = () => {
    setDragOver(null);
  };

  const handleDrop = (targetStatus: KanbanStatus) => {
    if (!dragItem) return;
    const { status: sourceStatus, index } = dragItem;

    if (sourceStatus === targetStatus) {
      setDragItem(null);
      setDragOver(null);
      return;
    }

    setBoard((prev) => {
      const sourceList = [...prev[sourceStatus]];
      const [moved] = sourceList.splice(index, 1);
      const targetList = [...prev[targetStatus], moved];
      return { ...prev, [sourceStatus]: sourceList, [targetStatus]: targetList };
    });

    setDragItem(null);
    setDragOver(null);
  };

  return (
    <div className="flex flex-col gap-3 p-4 h-[calc(100vh-130px)] overflow-y-auto">
      {COLUMNS.map((status) => {
        const config = STATUS_CONFIG[status];
        const items = board[status];
        const isOver = dragOver === status;

        return (
          <div key={status} className="flex flex-col gap-2">
            {/* Column Header */}
            <div className={`flex items-center gap-2 rounded-md border ${config.border} ${config.bg} px-3 py-2`}>
              <span className={`h-2 w-2 rounded-full ${config.color === "text-primary" ? "bg-primary" : config.color === "text-accent" ? "bg-accent" : "bg-success"}`} />
              <span className={`font-mono text-xs uppercase tracking-widest ${config.color}`}>
                {config.label}
              </span>
              <span className="ml-auto font-mono text-[10px] text-muted-foreground">
                {items.length}
              </span>
            </div>

            {/* Drop Zone */}
            <div
              onDragOver={(e) => handleDragOver(e, status)}
              onDragLeave={handleDragLeave}
              onDrop={() => handleDrop(status)}
              className={`min-h-[60px] rounded-md border border-dashed transition-colors ${
                isOver ? `${config.border} ${config.bg}` : "border-border/50"
              }`}
            >
              {items.length === 0 ? (
                <p className="py-4 text-center font-mono text-[10px] text-muted-foreground/50">
                  Drop reports here
                </p>
              ) : (
                <div className="flex flex-col gap-2 p-2">
                  {items.map((r, i) => (
                    <div
                      key={r.id}
                      draggable
                      onDragStart={() => handleDragStart(status, i)}
                      className="flex items-center gap-3 rounded-md border border-border bg-card p-3 cursor-grab transition-all hover:border-muted-foreground/30 active:cursor-grabbing animate-fade-in"
                    >
                      <GripVertical className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40" />
                      <div className="flex flex-1 flex-col gap-0.5 overflow-hidden">
                        <span className="truncate text-sm font-medium text-foreground">
                          {r.image_name}
                        </span>
                        <span className="font-mono text-[10px] text-muted-foreground">
                          {r.timestamp}
                        </span>
                      </div>
                      <button
                        onClick={() => window.open(r.report_url, "_blank")}
                        className="shrink-0 rounded-md border border-border px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-accent transition-colors hover:border-accent hover:bg-accent/10"
                      >
                        View
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ReportKanban;
