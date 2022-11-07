import mongoose from 'mongoose';
import { RoleModel } from '../app/model/role.js';
import { MenuModel } from '../app/model/menu.js';

export const connectMongoDB = async (url) => {
  if (process.env.NODE_ENV !== 'production') {
    mongoose.set('debug', true);
  }

  try {
    await mongoose.connect(url, { dbName: 'nodejs' });
    console.log('\x1b[33m%s\x1b[0m', 'Successfully connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection ERROR: ' + error.message);
  }
}

export const createDefaultDocuments = async () => {
  try {
    if (!await RoleModel.estimatedDocumentCount()) {
      await Promise.all([
        new RoleModel({ name: 'USER' }).save(),
        new RoleModel({ name: 'MODERATOR' }).save(),
        new RoleModel({ name: 'ADMIN' }).save()
      ])
    }
    if (!await MenuModel.estimatedDocumentCount()) {
      await Promise.all([
        new MenuModel({ main: 'sol' }).save(),
        new MenuModel({ main: 'ming' }).save(),
        new MenuModel({ main: 'guest' }).save()
      ])
    }
  } catch (error) {
    console.error('MongoDB initiation ERROR: ' + error);
  }
}