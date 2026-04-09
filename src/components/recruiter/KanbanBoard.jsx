import React, { useState } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { motion } from "framer-motion";
import { Calendar, Mail, ClipboardList } from "lucide-react";

const COLUMNS = [
  { id: "Applied", label: "Applied", color: "border-muted-foreground/30", dot: "bg-muted-foreground", textColor: "text-muted-foreground" },
  { id: "Under Review", label: "Under Review", color: "border-amber-500/30", dot: "bg-amber-400", textColor: "text-amber-400" },
  { id: "Shortlisted", label: "Shortlisted", color: "border-green-500/30", dot: "bg-green-400", textColor: "text-green-400" },
  { id: "HR Interview Scheduled", label: "HR Interview", color: "border-blue-500/30", dot: "bg-blue-400", textColor: "text-blue-400" },
  { id: "Rejected", label: "Rejected", color: "border-red-500/30", dot: "bg-red-400", textColor: "text-red-400" },
];

export default function KanbanBoard({ candidates, jobTitle, candidateStatuses, onStatusUpdate, onBook, onEmail, onScorecard }) {
  const getStatus = (c) => candidateStatuses[`${jobTitle}__${c.name}`] ?? c.status;

  const grouped = COLUMNS.reduce((acc, col) => {
    acc[col.id] = candidates.filter(c => getStatus(c) === col.id);
    return acc;
  }, {});

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const { draggableId, destination } = result;
    const candidate = candidates.find(c => c.name === draggableId);
    if (candidate) onStatusUpdate(jobTitle, candidate.name, destination.droppableId);
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-3 overflow-x-auto pb-4 min-h-[500px]">
        {COLUMNS.map(col => (
          <div key={col.id} className={`flex-shrink-0 w-52 bg-card/40 border ${col.color} rounded-xl flex flex-col`}>
            {/* Column header */}
            <div className="px-3 py-3 border-b border-border/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${col.dot}`} />
                <span className={`font-mono text-[10px] uppercase tracking-wider font-bold ${col.textColor}`}>{col.label}</span>
              </div>
              <span className={`font-mono text-[10px] font-bold ${col.textColor}`}>{grouped[col.id]?.length || 0}</span>
            </div>

            <Droppable droppableId={col.id}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`flex-1 p-2 space-y-2 transition-colors min-h-[60px] rounded-b-xl ${snapshot.isDraggingOver ? "bg-primary/5" : ""}`}
                >
                  {grouped[col.id]?.map((c, i) => (
                    <Draggable key={c.name} draggableId={c.name} index={i}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={`bg-card border border-border/40 rounded-xl p-3 transition-all select-none ${snapshot.isDragging ? "shadow-2xl border-primary/40 scale-105" : "hover:border-border/60"}`}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-primary text-xs flex-shrink-0">
                              {c.name[0]}
                            </div>
                            <div className="min-w-0">
                              <div className="font-semibold text-xs text-foreground truncate">{c.name}</div>
                              <div className="font-mono text-[9px] text-primary">{c.score}% match</div>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-1 mb-2">
                            {c.skills.slice(0, 2).map(s => (
                              <span key={s} className="font-mono text-[8px] px-1 py-0.5 rounded border border-primary/15 text-primary/60 bg-primary/5">{s}</span>
                            ))}
                          </div>
                          <div className="flex gap-1">
                            {["Shortlisted", "HR Interview Scheduled"].includes(getStatus(c)) ? (
                              <button onClick={() => onBook(c)} className="flex-1 flex items-center justify-center gap-1 py-1 rounded-lg border border-blue-400/20 text-blue-400/70 hover:bg-blue-400/10 transition-all">
                                <Calendar className="w-2.5 h-2.5" />
                              </button>
                            ) : null}
                            <button onClick={() => onEmail(c)} className="flex-1 flex items-center justify-center gap-1 py-1 rounded-lg border border-amber-400/20 text-amber-400/70 hover:bg-amber-400/10 transition-all">
                              <Mail className="w-2.5 h-2.5" />
                            </button>
                            <button onClick={() => onScorecard(c)} className="flex-1 flex items-center justify-center gap-1 py-1 rounded-lg border border-primary/20 text-primary/50 hover:bg-primary/10 transition-all">
                              <ClipboardList className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        ))}
      </div>
    </DragDropContext>
  );
}