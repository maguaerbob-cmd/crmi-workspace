export const DEPARTMENTS = [
  { id: "creative-youth-center", label: "Центр по работе с креативной молодежью" },
  { id: "youth-service-center", label: "Центр Обслуживания Молодежи" },
  { id: "volunteering-center", label: "Центр волонтерства" },
  { id: "analysis-monitoring-center", label: "Центр анализа и мониторинга" },
  { id: "media-center", label: "Медиа-центр" },
  { id: "technical-service-center", label: "Центр технического обслуживания" }
] as const;

export type DepartmentId = typeof DEPARTMENTS[number]["id"];

export const ROLES = ["owner", "director", "deputy_director", "head", "inspector", "reader"] as const;
export type Role = typeof ROLES[number];

export const ROLE_LABELS: Record<Role, string> = {
  owner: "Владелец",
  director: "Директор",
  deputy_director: "Зам. директора",
  head: "Руководитель",
  inspector: "Инспектор",
  reader: "Читатель"
};

export const PRIORITIES = ["низкий", "средний", "высокий"] as const;
export type Priority = typeof PRIORITIES[number];

export const PRIORITY_COLORS: Record<Priority, string> = {
  "низкий": "bg-slate-300 dark:bg-slate-700",
  "средний": "bg-slate-600 dark:bg-slate-400",
  "высокий": "bg-slate-950 dark:bg-white"
};

export const STATUSES = ["запланировано", "в процессе", "завершено"] as const;
export type TaskStatus = typeof STATUSES[number];

export const ALL_ACCESS_DEPARTMENTS = ["media-center", "technical-service-center"];
