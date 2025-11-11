import mongoose, { Schema } from 'mongoose';
import { IBaseDocument } from './BaseDocument';

export interface IAuditLog extends IBaseDocument {
  action: string;
  userId?: string;
  resourceType: string;
  resourceId?: string;
  changes?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    action: {
      type: String,
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    resourceType: {
      type: String,
      required: true,
      index: true,
    },
    resourceId: {
      type: String,
      index: true,
    },
    changes: {
      type: Schema.Types.Mixed,
    },
    ip: {
      type: String,
    },
    userAgent: {
      type: String,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

// Índices compostos para queries frequentes
AuditLogSchema.index({ userId: 1, createdAt: -1 });
AuditLogSchema.index({ resourceType: 1, resourceId: 1 });
AuditLogSchema.index({ action: 1, createdAt: -1 });
AuditLogSchema.index({ userId: 1, action: 1, createdAt: -1 }); // Para auditoria por usuário
AuditLogSchema.index({ resourceType: 1, createdAt: -1 }); // Para relatórios por tipo de recurso
AuditLogSchema.index({ createdAt: -1 }); // Para listagem geral ordenada por data

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);



