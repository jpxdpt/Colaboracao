/**
 * Tipo de reporte
 */
export interface Report {
  _id: string;
  title: string;
  description: string;
  category: 'safety' | 'quality' | 'equipment' | 'process' | 'compliance' | 'other';
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  attachments: string[];
  reportedBy: string;
  assignedTo?: string;
  resolvedBy?: string;
  resolutionNotes?: string;
  pointsEarned: number;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
}



