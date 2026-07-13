import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    adminName: { type: String, required: true },
    action: {
      type: String,
      enum: [
        'change_role', 'suspend', 'reactivate', 'ban', 'delete_user',
        'create_staff', 'delete_staff',
      ],
      required: true,
    },
    targetUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    targetUserEmail: { type: String },
    details: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model('AuditLog', auditLogSchema);
