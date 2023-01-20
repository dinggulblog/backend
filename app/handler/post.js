import { PostModel } from '../model/post.js';
import { FileModel } from '../model/file.js';
import { CommentModel } from '../model/comment.js';

export const cachedPostIds = new Map();

export class PostHandler {
  constructor() {
  }

  async createPost(req, payload, callback) {
    try {
      const { menu, category, title, content, isPublic, thumbnail, images } = req.body;
      const post = await new PostModel({
        author: payload.userId,
        menu,
        category,
        title,
        content,
        isPublic,
        thumbnail,
        images
      }).save();

      callback.onSuccess({ post });
    } catch (error) {
      callback.onError(error);
    }
  }

  async getPosts(req, payload, callback) {
    try {
      const userId = payload ? new ObjectId(payload.userId) : null;

      const { skip, limit } = req.query;
      const { match, sort } = await this.#getMatchQuery(req.query, userId);
      const maxCount = !skip ? await PostModel.countDocuments(match) : null;
      const posts = await PostModel.aggregate([
        { $match: match },
        { $addFields: { likeCount: { $size: '$likes' } } },
        { $sort: sort },
        { $skip: skip },
        { $limit: limit },
        { $lookup: {
          from: 'users',
          localField: 'author',
          foreignField: '_id',
          pipeline: [{ $project: { nickname: 1 } }],
          as: 'author'
        } },
        { $unwind: '$author' },
        { $lookup: {
          from: 'comments',
          localField: '_id',
          foreignField: 'post',
          as: 'comments'
        } },
        { $lookup: {
          from: 'files',
          localField: 'thumbnail',
          foreignField: '_id',
          as: 'thumbnail'
        } },
        { $unwind: { path: '$thumbnail', preserveNullAndEmptyArrays: true } },
        { $addFields: {
          thumbnail: '$thumbnail.thumbnail',
          content: { $substrCP: ['$content', 0, 200] },
          liked: { $in: [userId, '$likes'] },
          commentCount: { $size: '$comments' }
        } },
        { $project: {
          comments: 0,
          images: 0,
          likes: 0
        } }
      ]).exec();

      callback.onSuccess({ posts, maxCount });
    } catch (error) {
      callback.onError(error);
    }
  }

  async getPostsAsAdmin (req, payload, callback) {
    try {
      const { skip, limit } = req.query;

      const { match, sort } = await this.#getMatchQuery(req.query, userId);
      const maxCount = !skip ? await PostModel.countDocuments(matchQuery) : null;
      const posts = await PostModel.aggregate([
        { $match: match },
        { $addFields: { likeCount: { $size: '$likes' } } },
        { $sort: sort },
        { $skip: skip },
        { $limit: limit },
        { $lookup: {
          from: 'users',
          localField: 'author',
          foreignField: '_id',
          pipeline: [{ $project: { nickname: 1 } }],
          as: 'author'
        } },
        { $unwind: '$author' },
        { $lookup: {
          from: 'comments',
          localField: '_id',
          foreignField: 'post',
          as: 'comments'
        } },
        { $lookup: {
          from: 'files',
          localField: 'thumbnail',
          foreignField: '_id',
          as: 'thumbnail'
        } },
        { $unwind: { path: '$thumbnail', preserveNullAndEmptyArrays: true } },
        { $addFields: {
          thumbnail: '$thumbnail.thumbnail',
          content: { $substrCP: ['$content', 0, 200] },
          liked: { $in: [userId, '$likes'] },
          commentCount: { $size: '$comments' }
        } },
        { $project: {
          comments: 0,
          images: 0,
          likes: 0
        } }
      ]).exec();

      callback.onSuccess({ posts, maxCount });
    } catch (error) {
      callback.onError(error);
    }
  }

  async getPost(req, payload, callback) {
    try {
      const userId = payload ? new ObjectId(payload.userId) : null;
      const postId = new ObjectId(req.params.id);
      const post = await PostModel.aggregate([
        { $setWindowFields: {
          partitionBy: { menu: '$menu', category: '$category' },
          sortBy: { createdAt: -1 },
          output: { nearIds: { $addToSet: '$_id', window: { documents: [-1, 1] } } }
        } },
        { $match: { _id: postId } },
        { $limit: 1 },
        { $lookup: {
          from: 'posts',
          localField: 'nearIds',
          foreignField: '_id',
          pipeline: [
            { $match: { _id: { $ne: postId } } },
            { $project: { title: { $substrCP: ['$title', 0, 50] }, rel: { $cond: [{ $lt: ['$_id', postId] }, 'prev', 'next'] } } }
          ],
          as: 'linkedPosts'
        } },
        { $lookup: {
          from: 'users',
          localField: 'author',
          foreignField: '_id',
          pipeline: [
            { $lookup: {
              from: 'files',
              localField: 'avatar',
              foreignField: '_id',
              as: 'avatar'
            } },
            { $unwind: { path: '$avatar', preserveNullAndEmptyArrays: true } },
            { $project: { avatar: { thumbnail: 1 }, nickname: 1, greetings: 1 } }
          ],
          as: 'author'
        } },
        { $unwind: { path: '$author' } },
        { $lookup: {
          from: 'files',
          localField: 'images',
          foreignField: '_id',
          pipeline: [{ $project: { serverFileName: 1, thumbnail: 1 } }],
          as: 'images'
        } },
        { $set: {
          viewCount: { $add: ['$viewCount', 1] }
        } },
        { $addFields: {
          liked: { $in: [userId, '$likes'] },
          likeCount: { $size: '$likes' }
        } },
        { $project: {
          nearIds: 0
        } }
      ]).exec();

      if (post.length) {
        const id = post[0]._id;
        cachedPostIds.has(id) ? cachedPostIds.set(id, cachedPostIds.get(id) + 1) : cachedPostIds.set(id, 1)
      }

      callback.onSuccess({ post: post.shift() ?? null });
    } catch (error) {
      callback.onError(error);
    }
  }

  async updatePost(req, payload, callback) {
    try {
      const { menu, category, title, content, isPublic, thumbnail } = req.body;

      const images = await FileModel.createManyInstances(payload.userId, req.params.id, 'Post', req.files)
      const post = await PostModel.findOneAndUpdate(
        { _id: req.params.id, author: payload.userId },
        {
          $set: { menu, category, title, content, isPublic, thumbnail },
          $addToSet: { images: { $each: images.map(({ _id }) => _id) } }
        },
        { new: true, lean: true }
      ).exec();

      callback.onSuccess({ post, images });
    } catch (error) {
      callback.onError(error);
    }
  }

  async updatePostLike(req, payload, callback) {
    try {
      await PostModel.updateOne(
        { _id: req.params.id },
        { $addToSet: { likes: payload.userId } },
        { lean: true, timestamps: false }
      ).exec();

      callback.onSuccess({});
    } catch (error) {
      callback.onError(error);
    }
  }

  async deletePost(req, payload, callback) {
    try {
      await PostModel.updateOne(
        { _id: req.params.id, author: payload.userId },
        { $set: { isActive: false } },
        { new: true, lean: true }
      ).exec();

      callback.onSuccess({});
    } catch (error) {
      callback.onError(error);
    }
  }

  async deletePostLike(req, payload, callback) {
    try {
      await PostModel.updateOne(
        { _id: req.params.id },
        { $pull: { likes: payload.userId } },
        { lean: true, timestamps: false }
      ).exec();

      callback.onSuccess({});
    } catch (error) {
      callback.onError(error);
    }
  }

  async deletePostFile(req, payload, callback) {
    try {
      await PostModel.updateOne(
        { _id: req.params.id, author: payload.userId },
        { $pull: { images: req.body.image } },
        { lean: true }
      ).exec();

      callback.onSuccess({});
    } catch (error) {
      callback.onError(error);
    }
  }

  async #getMatchQuery(queries, loginUserId) {
    let sortQuery = { createdAt: -1 };
    const matchQuery = { isPublic: true, isActive: true };
    const { menu, category, hasThumbnail, filter, userId, sort } = queries;

    if (Array.isArray(menu) && menu.length) {
      matchQuery.menu = { $in: menu };
    }
    if (category && category !== '전체') {
      matchQuery.category = category;
    }
    if (hasThumbnail) {
      matchQuery.thumbnail = { $exists: true, $ne: null }
    }
    if (filter === 'like') {
      matchQuery.likes = userId;
    }
    else if (filter === 'comment') {
      const comments = await CommentModel.find(
        { commenter: userId },
        { post: 1 },
        { lean: true }
      ).exec();

      matchQuery._id = { $in: comments.map(({ post }) => post) };
    }

    if (sort === 'like') {
      sortQuery = { likeCount: -1, ...sortQuery };
    }
    else if (sort === 'view') {
      sortQuery = { viewCount: -1, ...sortQuery };
    }

    if (loginUserId) {
      return {
        sort: sortQuery,
        match: { $or: [
          { ...matchQuery },
          { ...matchQuery, author: loginUserId, isPublic: false }
        ] }
      };
    }

    return {
      sort: sortQuery,
      match: matchQuery
    };
  }
}
