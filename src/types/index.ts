export interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: Permission[];
}

export interface Permission {
  id: string;
  resource: string;
  action: string;
  description?: string;
}

export interface UserSession {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  institutionId?: string;
  avatarUrl?: string;
}

export interface StudentIdentity {
  camposId: string;
  matricNumber: string;
  firstName: string;
  lastName: string;
  institution: string;
  faculty: string;
  department: string;
  program?: string;
  level: string;
  enrollmentStatus: string;
  verificationStatus: string;
  email: string;
  phoneNumber?: string;
  avatarUrl?: string;
}

export interface Notification {
  id: string;
  type: "info" | "success" | "warning" | "error";
  title: string;
  message: string;
  actionUrl?: string;
  actionLabel?: string;
  isRead: boolean;
  readAt?: Date;
  source: string;
  createdAt: Date;
}

export interface ModuleCard {
  id: string;
  name: string;
  displayName: string;
  description: string;
  icon: string;
  color: string;
  isActive: boolean;
  url?: string;
}

export interface DashboardStats {
  totalStudents: number;
  activeStudents: number;
  attendanceRate: number;
  housingOccupancy: number;
  nadaActiveUsers: number;
  newRegistrations: number;
}

export interface AuditLogEntry {
  id: string;
  userId?: string;
  userName?: string;
  action: string;
  resource: string;
  resourceId?: string;
  timestamp: Date;
  status: string;
  ipAddress?: string;
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    color: string;
  }[];
}
