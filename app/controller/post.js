import passport from 'passport'

import BaseController from './base.js';
import PostHandler from '../handler/post.js';

class PostController extends BaseController {
  constructor() {
    super();
    this._postHandler = new PostHandler();
    this._passport = passport;
  }

  create(req, res, next) {
    this.authenticate(req, res, next, (token, user) => {
      this._postHandler.createPost(req, user, this._responseManager.getDefaultResponseHandler(res));
    });
  }

  getAll(req, res, next) {
    this._postHandler.getPosts(req, this._responseManager.getDefaultResponseHandler(res));
  }

  get(req, res, next) {
    this._postHandler.getPost(req, this._responseManager.getDefaultResponseHandlerError(res, ((data, message, code) => {
      const hateosLinks = [this._responseManager.generateHATEOASLink(req.baseUrl + '/:id', 'GET', 'single')];
      this._responseManager.respondWithSuccess(res, code || this._responseManager.HTTP_STATUS.OK, data, message, hateosLinks);
    })));
  }

  update(req, res, next) {
    this.authenticate(req, res, next, (token, user) => {
      this._postHandler.updatePost(req, user, this._responseManager.getDefaultResponseHandler(res));
    });
  }

  delete(req, res, next) {
    this.authenticate(req, res, next, (token, user) => {
      this._postHandler.deletePost(req, user, this._responseManager.getDefaultResponseHandler(res));
    });
  }

  authenticate(req, res, next, callback) {
    this._passport.authenticate('jwt-auth', {
      onVerified: callback,
      onFailure: (error) => {
        this._responseManager.respondWithError(res, error.status || 401, error.message);
      }
    })(req, res, next);
  }
}

export default PostController;