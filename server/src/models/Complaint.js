import mongoose from 'mongoose';

export const categories = ['Potholes', 'Road damage', 'Garbage accumulation', 'Water leakage', 'Drainage blockage', 'Other civic issues'];
export const statuses = ['Submitted', 'Under Review', 'In Progress', 'Resolved', 'Rejected'];
const complaintSchema = new mongoose.Schema({
  complaintId: { type: String, unique: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true, trim: true, maxlength: 120 },
  description: { type: String, required: true, trim: true, maxlength: 2000 },
  category: { type: String, enum: categories, required: true },
  imageUrl: { type: String, required: true },
  mediaType: { type: String, enum: ['image', 'video'], default: 'image' },
  location: { type: String, required: true, trim: true, maxlength: 300 },
  latitude: Number,
  longitude: Number,
  aiAnalysis: { detectedIssue: String, description: String, confidence: Number },
  severity: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
  status: { type: String, enum: statuses, default: 'Submitted' },
  adminRemarks: { type: String, default: '', maxlength: 1000 }
}, { timestamps: true });

complaintSchema.pre('validate', function () {
  if (!this.complaintId) this.complaintId = `CF-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
});
export default mongoose.model('Complaint', complaintSchema);
