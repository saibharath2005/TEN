import mongoose from 'mongoose';

const contentSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['tutorials', 'notes', 'roadmaps', 'resources'],
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    slug: { type: String, trim: true, index: true },
    category: { type: String, default: 'development', trim: true, index: true },
    description: { type: String, default: '' },
    excerpt: { type: String, default: '' },
    body: { type: String, default: '' },
    status: { type: String, enum: ['draft', 'published', 'archived'], default: 'published', index: true },
    level: { type: String, default: 'Beginner' },
    duration: { type: String, default: '' },
    minutes: { type: Number, default: 0 },
    pages: { type: Number, default: 0 },
    resourceType: { type: String, default: '' },
    author: { type: String, default: 'The Epoch Nova' },
    instructor: { type: String, default: '' },
    readTime: { type: String, default: '' },
    fileUrl: { type: String, default: '' },
    fileName: { type: String, default: '' },
    fileType: { type: String, default: '' },
    fileData: { type: String, default: '' },
    mimeType: { type: String, default: '' },
    videoUrl: { type: String, default: '' },
    lessons: { type: Number, default: 0 },
    modules: { type: Number, default: 0 },
    steps: [{ type: String }],
    outcomes: [{ type: String }],
    featured: { type: Boolean, default: false, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

contentSchema.index({ title: 'text', description: 'text', excerpt: 'text', body: 'text' });

contentSchema.pre('save', function createSlug(next) {
  if (!this.slug && this.title) {
    this.slug = this.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }
  next();
});

export default mongoose.model('Content', contentSchema);
