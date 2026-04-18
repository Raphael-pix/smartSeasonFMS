export type Role = "ADMIN" | "AGENT";
export type CropStage = "PLANTED" | "GROWING" | "READY" | "HARVESTED";
export type FieldStatus = "ACTIVE" | "AT_RISK" | "COMPLETED";

export interface User {
  id: string;
  email: string;
  role: Role;
  fullName: string | null;
  phone: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Location {
  id: string;
  county: string;
  subCounty: string | null;
  ward: string | null;
  latitude: number | null;
  longitude: number | null;
}

export interface FieldWithStatus {
  id: string;
  name: string;
  cropType: string;
  plantingDate: string;
  currentStage: CropStage;
  status: FieldStatus;
  coverImageUrl: string | null;
  areaSize: number | null;
  lastUpdatedAt: string | null;
  isArchived: boolean;
  createdAt: string;
  agent: { id: string; fullName: string | null; email: string } | null;
  location: {
    id: string;
    county: string;
    subCounty: string | null;
    ward: string | null;
  };
}

export interface FieldDetail extends FieldWithStatus {
  description: string | null;
  updatedAt: string;
  updatedBy: { id: string; fullName: string | null } | null;
  _count: { updates: number; images: number };
  location: Location;
}

export interface FieldUpdate {
  id: string;
  fieldId: string;
  stage: CropStage;
  notes: string | null;
  imageUrl: string | null;
  observedAt: string;
  createdAt: string;
  agent: { id: string; fullName: string | null; email: string };
}

export interface FieldImage {
  id: string;
  fieldId: string;
  url: string;
  caption: string | null;
  createdAt: string;
  uploadedBy: { id: string; fullName: string | null } | null;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface AdminDashboard {
  summary: {
    totalFields: number;
    activeAgents: number;
    byStatus: Record<FieldStatus, number>;
    byStage: Record<CropStage, number>;
  };
  atRiskFields: FieldWithStatus[];
  recentUpdates: (FieldUpdate & {
    field: { id: string; name: string; cropType: string };
  })[];
  generatedAt: string;
}

export interface AgentDashboard {
  summary: {
    totalAssigned: number;
    byStatus: Record<string, number>;
  };
  attentionRequired: FieldWithStatus[];
  assignedFields: (FieldWithStatus & { status: FieldStatus })[];
  recentActivity: (Pick<
    FieldUpdate,
    "id" | "stage" | "notes" | "observedAt"
  > & {
    field: { id: string; name: string };
  })[];
  generatedAt: string;
}
