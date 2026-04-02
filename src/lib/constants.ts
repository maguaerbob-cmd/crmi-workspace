export const DEPARTMENTS = [
  "Центр по работе с креативной молодежью",
  "Центр Обслуживания Молодежи",
  "Центр волонтерства",
  "Центр анализа и мониторинга",
  "Медиа-центр",
  "Центр технического обслуживания"
] as const;

export type Department = typeof DEPARTMENTS[number];

export const ROLES = ["owner", "head", "inspector", "reader"] as const;
export type Role = typeof ROLES[number];

export const ROLE_LABELS: Record<Role, string> = {
  owner: "Владелец",
  head: "Руководитель отдела",
  inspector: "Инспектор",
  reader: "Читатель"
};

export const PRIORITIES = ["низкий", "средний", "высокий"] as const;
export type Priority = typeof PRIORITIES[number];

export const PRIORITY_COLORS: Record<Priority, string> = {
  "низкий": "bg-green-500",
  "средний": "bg-yellow-500",
  "высокий": "bg-red-500"
};

export const STATUSES = ["запланировано", "в процессе", "завершено"] as const;
export type TaskStatus = typeof STATUSES[number];

export const ALL_ACCESS_DEPARTMENTS = ["Медиа-центр", "Центр технического обслуживания"];