"use client";

import { useState } from "react";
import { Check, Lock } from "lucide-react";

export interface TodoTask {
  id: string;
  title: string;
  subtitle?: string;
  cost?: string;
  status: "done" | "active" | "pending" | "locked";
}

interface SmartTodoProps {
  context: string;
  tasks: TodoTask[];
}

export default function SmartTodo({ context, tasks: initialTasks }: SmartTodoProps) {
  const [tasks, setTasks] = useState(initialTasks);

  function toggle(id: string) {
    setTasks((prev) => {
      const idx = prev.findIndex((t) => t.id === id);
      if (idx === -1) return prev;
      const task = prev[idx];
      if (task.status === "locked") return prev;

      const next = [...prev];
      next[idx] = {
        ...task,
        status: task.status === "done" ? "active" : "done",
      };

      // Unlock next locked task if current is now done
      if (next[idx].status === "done") {
        const nextLocked = next.findIndex((t, i) => i > idx && t.status === "locked");
        if (nextLocked !== -1) {
          next[nextLocked] = { ...next[nextLocked], status: "pending" };
        }
      }

      return next;
    });
  }

  const doneCount = tasks.filter((t) => t.status === "done").length;
  const progress = Math.round((doneCount / tasks.length) * 100);

  return (
    <div
      style={{
        backgroundColor: "var(--fond-blanc)",
        border: "1px solid rgba(26,18,16,0.1)",
        borderRadius: "12px",
        padding: "20px",
        marginTop: "12px",
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: "16px" }}>
        <p style={{ color: "var(--texte-discret)", fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: "4px" }}>
          Plan d&apos;action
        </p>
        <p style={{ color: "var(--texte)", fontSize: "15px", fontWeight: 500, fontFamily: "DM Sans, sans-serif" }}>
          {context}
        </p>

        {/* Barre de progression */}
        <div style={{ marginTop: "10px", height: "3px", backgroundColor: "rgba(26,18,16,0.08)", borderRadius: "2px" }}>
          <div
            style={{
              height: "100%",
              width: `${progress}%`,
              backgroundColor: "var(--vert)",
              borderRadius: "2px",
              transition: "width 0.3s ease",
            }}
          />
        </div>
        <p style={{ color: "var(--texte-discret)", fontSize: "11px", marginTop: "4px" }}>
          {doneCount} sur {tasks.length} complétées
        </p>
      </div>

      {/* Tâches */}
      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
        {tasks.map((task) => {
          const isLocked = task.status === "locked";
          const isDone = task.status === "done";

          return (
            <button
              key={task.id}
              onClick={() => toggle(task.id)}
              disabled={isLocked}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "12px",
                width: "100%",
                background: "none",
                border: "none",
                padding: "10px 0",
                cursor: isLocked ? "not-allowed" : "pointer",
                textAlign: "left",
                borderBottom: "1px solid rgba(26,18,16,0.06)",
                opacity: isLocked ? 0.4 : 1,
              }}
            >
              {/* Icône */}
              <div
                style={{
                  width: "22px",
                  height: "22px",
                  borderRadius: "50%",
                  border: `1.5px solid ${isDone ? "var(--vert)" : isLocked ? "var(--texte-discret)" : "var(--texte-discret)"}`,
                  backgroundColor: isDone ? "var(--vert)" : "transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  marginTop: "1px",
                  transition: "all 0.15s",
                }}
              >
                {isDone && <Check size={12} color="white" strokeWidth={2.5} />}
                {isLocked && <Lock size={10} color="var(--texte-discret)" />}
              </div>

              {/* Texte */}
              <div style={{ flex: 1 }}>
                <p
                  style={{
                    fontSize: "14px",
                    lineHeight: "1.4",
                    fontFamily: "DM Sans, sans-serif",
                    color: isDone ? "var(--texte-discret)" : "var(--texte-secondary)",
                    textDecoration: isDone ? "line-through" : "none",
                    transition: "all 0.15s",
                  }}
                >
                  {task.title}
                </p>
                {task.subtitle && (
                  <p style={{ fontSize: "12px", color: "var(--texte-discret)", marginTop: "2px" }}>
                    {task.subtitle}
                  </p>
                )}
                {task.cost && (
                  <p style={{ fontSize: "12px", color: "var(--or)", marginTop: "2px", fontWeight: 500 }}>
                    {task.cost}
                  </p>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
