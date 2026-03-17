export type PathologyType = 'breast' | 'cervical';
export type CaseStatus = 'draft' | 'pending' | 'analyzing' | 'validated' | 'archived';
export type CasePriority = 'normal' | 'high' | 'urgent';

export interface CaseImage {
  id: string;
  url: string;
  name: string;
  size: number;
  uploadedAt: string;
  qualityScore?: number;
}

export interface PatientInfo {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: 'male' | 'female';
  phone?: string;
  cmuNumber?: string; // Couverture Maladie Universelle
}

export interface Case {
  id: string;
  patientInfo: PatientInfo;
  pathology: PathologyType;
  status: CaseStatus;
  priority: CasePriority;
  images: CaseImage[];
  clinicalNotes?: string;
  sampleType?: string;
  collectionDate?: string;
  centerId: string;
  centerName: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCaseData {
  patientInfo: Omit<PatientInfo, 'id'>;
  pathology: PathologyType;
  priority: CasePriority;
  clinicalNotes?: string;
  sampleType?: string;
  collectionDate?: string;
}
