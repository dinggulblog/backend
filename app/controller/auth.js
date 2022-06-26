import passport from 'passport';

import BaseController from './base.js';
import AuthHandler from '../handler/auth.js';

class AuthController extends BaseController {
  constructor() {
    super();
    this._authHandler = new AuthHandler();
    this._passport = passport;
  }

  // Request token by credentials
  create(req, res, next) {
    this.authenticate(req, res, next, (user) => {
      this._authHandler.issueNewToken(req, user, this._responseManager.getDefaultResponseHandlerCookies(res));
    });
  }

  refresh(req, res, next) {
    this._passport.authenticate('jwt-auth', {
      onVerified: (refreshToken, user) => {
        this._authHandler.issueRenewedToken(req, refreshToken, user, this._responseManager.getDefaultResponseHandlerCookies(res));
      },
      onFailure: (error) => {
        this._responseManager.respondWithError(res, error.status || 403, error.message);
      }
    })(req, res, next);
  }

  // Revoke Token
  remove(req, res, next) {
    this._passport.authenticate('jwt-auth', {
      onVerified: (token, user) => {
        this._authHandler.revokeToken(req, token, this._responseManager.getDefaultResponseHandler(res));
      },
      onFailure: (error) => {
        this._responseManager.respondWithError(res, error.status || 401, error.message);
      }
    })(req, res, next);
  }

  authenticate(req, res, next, callback) {
    this._passport.authenticate('credentials-auth', (error, user) => {
      error
        ? this._responseManager.respondWithError(res, error.status || 401, error.message || "")
        : callback(user);
    })(req, res, next);
  }
}

export default AuthController;