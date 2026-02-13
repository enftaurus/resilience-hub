import { useEffect, useState } from "react";
import { FileText, GripVertical } from "lucide-react";

export interface ReportData {
  id: string;
  report_url: string;
  image_name: string;
  timestamp: string;
  upvotes?: number;
}

export type KanbanStatus = "pending" | "in_progress" | "completed";

export type KanbanBoard = Record<KanbanStatus, ReportData[]>;

interface ReportKanbanProps {
  reports?: ReportData[];
  /** Pre-grouped columns from API (overrides reports when provided) */
  initialBoard?: KanbanBoard;
  readOnly?: boolean;
  className?: string;
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

const ReportKanban = ({ reports = [], initialBoard, readOnly = false, className }: ReportKanbanProps) => {
  const [board, setBoard] = useState<Record<KanbanStatus, ReportData[]>>(() =>
    initialBoard
      ? {
          pending: initialBoard.pending ?? [],
          in_progress: initialBoard.in_progress ?? [],
          completed: initialBoard.completed ?? [],
        }
      : {
          pending: reports,
          in_progress: [],
          completed: [],
        }
  );

  const [dragItem, setDragItem] = useState<{ status: KanbanStatus; index: number } | null>(null);
  const [dragOver, setDragOver] = useState<KanbanStatus | null>(null);

  // Sync when initialBoard or reports change
  useEffect(() => {
    if (initialBoard) {
      setBoard({
        pending: initialBoard.pending ?? [],
        in_progress: initialBoard.in_progress ?? [],
        completed: initialBoard.completed ?? [],
      });
      return;
    }
    setBoard((prev) => {
      const existingIds = new Set([
        ...prev.pending.map((r) => r.id),
        ...prev.in_progress.map((r) => r.id),
        ...prev.completed.map((r) => r.id),
      ]);
      const newReports = reports.filter((r) => !existingIds.has(r.id));
      return { ...prev, pending: [...prev.pending, ...newReports] };
    });
  }, [initialBoard, reports]);

  const handleDragStart = (status: KanbanStatus, index: number) => {
    if (readOnly) return;
    setDragItem({ status, index });
  };

  const handleDragOver = (e: React.DragEvent, status: KanbanStatus) => {
    if (readOnly) return;
    e.preventDefault();
    setDragOver(status);
  };

  const handleDragLeave = () => {
    setDragOver(null);
  };

  const handleDrop = (targetStatus: KanbanStatus) => {
    if (readOnly) return;
    if (!dragItem) return;
    const { status: sourceStatus, index } = dragItem;

    if (targetStatus === "completed" && sourceStatus !== "in_progress") {
      setDragItem(null);
      setDragOver(null);
      return;
    }

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

  const containerClass = className
    ? `grid grid-cols-1 md:grid-cols-3 gap-3 p-3 w-full h-full ${className}`
    : "grid grid-cols-1 md:grid-cols-3 gap-3 p-3 w-full h-full";

  return (
    <div className={containerClass}>
      {COLUMNS.map((status) => {
        const config = STATUS_CONFIG[status];
        const items = board[status];
        const isOver = dragOver === status;

        return (
          <div key={status} className="flex min-w-0 min-h-0 flex-col gap-2">
            {/* Column Header */}
            <div className={`flex items-center gap-2 rounded-md border ${config.border} ${config.bg} px-3 py-2`}>
              <span className={`h-2 w-2 rounded-full ${config.color === "text-primary" ? "bg-primary" : config.color === "text-accent" ? "bg-accent" : "bg-success"}`} />
              <span className={`font-mono text-[10px] uppercase tracking-widest ${config.color}`}>
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
              className={`flex-1 min-h-0 overflow-y-auto rounded-md border border-dashed transition-colors ${
                isOver ? `${config.border} ${config.bg}` : "border-border/50"
              }`}
            >
              {items.length === 0 ? (
                <p className="py-4 text-center font-mono text-[10px] text-muted-foreground/50">
                  {readOnly ? "No items" : "Drop here"}
                </p>
              ) : (
                <div className="flex flex-col gap-2 p-2">
                  {items.map((r, i) => (
                    <div
                      key={r.id}
                      draggable={!readOnly}
                      onDragStart={() => handleDragStart(status, i)}
                      className={`flex items-start gap-2 rounded-md border border-border bg-card p-2.5 transition-all hover:border-muted-foreground/30 animate-fade-in ${
                        readOnly ? "cursor-default" : "cursor-grab active:cursor-grabbing"
                      }`}
                    >
                      {!readOnly && (
                        <GripVertical className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground/40" />
                      )}
                      <div className="flex flex-1 flex-col gap-1 overflow-hidden">
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate text-xs font-medium text-foreground">
                            {r.image_name}
                          </span>
                          {r.upvotes != null && (
                            <span
                              className={`font-mono text-[9px] font-semibold ${
                                r.upvotes > 10 ? "text-primary" : "text-muted-foreground"
                              }`}
                              title={r.upvotes > 10 ? "Auto-escalated (upvotes > 10)" : undefined}
                            >
                              ⬆️ {r.upvotes}
                            </span>
                          )}
                        </div>
                        <span className="font-mono text-[9px] text-muted-foreground">
                          {r.timestamp}
                        </span>
                        {r.upvotes != null && r.upvotes > 10 && (
                          <span className="font-mono text-[8px] text-primary italic">
                            Auto-escalated
                          </span>
                        )}
                        <button
                          onClick={() => window.open(r.report_url, "_blank")}
                          className="mt-1 self-start rounded border border-border px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-accent transition-colors hover:border-accent hover:bg-accent/10"
                        >
                          View
                        </button>
                      </div>
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
