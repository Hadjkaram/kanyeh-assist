export type UserRole = 
  | 'system_admin' 
  | 'center_admin' 
  | 'lab_technician' 
  | 'pathologist' 
  | 'clinician';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  centerId?: string;
  centerName?: string;
  avatar?: string;
  createdAt: string;
}

export interface Center {
  id: string;
  name: string;
  location: string;
  type: 'hub' | 'spoke';
}

export interface DashboardStats {
  label: string;
  value: number | string;
  change?: number;
  changeLabel?: string;
  icon?: string;
}
