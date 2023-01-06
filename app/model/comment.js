import mongoose from 'mongoose';

const CommentSchema = new mongoose.Schema({
  commenter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: true
  },
  parentComment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment'
  },
  image: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'File'
  },
  content: {
    type: String
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  toObject: {
    virtuals: true
  },
  timestamps: {
    currentTime: (time = Date.now()) => new Date(time).getTime() - new Date(time).getTimezoneOffset() * 60 * 1000
  },
  versionKey: false
});

CommentSchema.index({ commenter: 1 });
CommentSchema.index({ post: 1 });
CommentSchema.index({ post: 1, createdAt: 1 });

CommentSchema.virtual('id')
  .get(function () { return this._id });

CommentSchema.virtual('childComments')
  .get(function () { return this._childComments })
  .set(function (value) { this._childComments = value });

export const CommentModel = mongoose.model('Comment', CommentSchema);
