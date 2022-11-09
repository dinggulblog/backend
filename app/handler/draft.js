import { DraftModel } from '../model/draft.js';
import { FileModel } from '../model/file.js';

class DraftHandler {
  constructor() {
  }

  async createDraft(req, payload, callback) {
    try {
      const draft = await new DraftModel(
        { author: payload.sub }
      ).save(
        { validateBeforeSave: false }
      );

      callback.onSuccess({ draft });
    } catch (error) {
      callback.onError(error);
    }
  }

  async getDraft(req, payload, callback) {
    try {
      const draft = await DraftModel.findOne(
        { author: payload.sub, isActive: true },
        null,
        { lean: true,
          populate: { path: 'images', select: { _id: 1, serverFileName: 1 }, match: { isActive: true } } }
      ).exec();

      callback.onSuccess({ draft });
    } catch (error) {
      callback.onError(error);
    }
  }

  async updateDraft(req, payload, callback) {
    try {
      const { menu, category, title, content, isPublic, thumbnail } = req.body
      const images = await FileModel.createManyInstances(payload.sub, req.params.id, 'Draft', req.files)
      const draft = await DraftModel.findOneAndUpdate(
        { _id: req.params.id, author: payload.sub },
        { $set: { menu, category, title, content, isPublic, thumbnail },
          $addToSet: { images: { $each: images.map(image => image._id) } } },
        { new: true,
          lean: true,
          populate: { path: 'images', select: { serverFileName: 1, isActive: 1 }, match: { isActive: true } } }
      ).exec();

      callback.onSuccess({ draft });
    } catch (error) {
      console.log(error)
      callback.onError(error);
    }
  }

  async deleteDraft(req, payload, callback) {
    try {
      await DraftModel.updateOne(
        { _id: req.params.id, author: payload.sub },
        { $set: { isActive: false } },
        { new: true, lean: true }
      ).exec();

      callback.onSuccess({});
    } catch (error) {
      callback.onError(error);
    }
  }

  async deleteDraftFile(req, payload, callback) {
    try {
      const { modifiedCount } = await DraftModel.updateOne(
        { _id: req.params.id, author: payload.sub },
        { $pull: { images: req.body.image } },
        { new: true, lean: true }
      ).exec();

      if (modifiedCount) {
        await FileModel.findOneAndDelete({ _id: req.body.image }, { lean: true }).exec();
      }

      callback.onSuccess({});
    } catch (error) {
      callback.onError(error);
    }
  }
}

export default DraftHandler;