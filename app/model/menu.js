import mongoose from 'mongoose';

const MenuSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Menu title is required!'],
    trim: true,
    lowercase: true
  },
  subject: {
    type: String,
    default: 'default',
    trim: true,
    lowercase: true
  },
  categories: [{
    type: String,
    trim: true,
    lowercase: true
  }]
}, { toObject: { virtuals: true } });

MenuSchema.index({ title: 1, subject: 1 }, { unique: true });

export const MenuModel = mongoose.model('Menu', MenuSchema);