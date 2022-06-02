import { StatusCodes } from 'http-status-codes';

const BasicResponse = {
  'success': false,
  'message': '',
  'data': {}
};

class ResponseManager {
  constructor() {

  }

  static get HTTP_STATUS() {
    return StatusCodes;
  }

  static getDefaultResponseHandler(res) {
    return {
      onSuccess: (data, message, code) => {
        this.respondWithSuccess(res, code || this.HTTP_STATUS.OK, data, message);
      },
      onError: (error) => {
        this.respondWithError(res, error.status || 500, error.message || 'Unknown error');
      }
    };
  }

  static getDefaultResponseHandlerData(res) {
    return {
      onSuccess: (data, message, code) => {
        this.respondWithSuccess(res, code || this.HTTP_STATUS.OK, data, message);
      },
      onError: (error) => {
        this.respondWithErrorData(res, error.status || 500, error.message || 'Unknown error', error.data);
      }
    };
  }

  static getDefaultResponseHandlerError(res, successCallback) {
    return {
      onSuccess: (data, message, code) => {
        successCallback(data, message, code);
      },
      onError: (error) => {
        this.respondWithError(res, error.status || 500, error.message || 'Unknown error');
      }
    };
  }

  static getDefaultResponseHandlerSuccess(res, errorCallback) {
    return {
      onSuccess: (data, message, code) => {
        this.respondWithSuccess(res, code || this.HTTP_STATUS.OK, data, message);
      },
      onError: (error) => {
        errorCallback(error);
      }
    };
  }

  static respondWithSuccess(res, code, data = '', message = '', links = []) {
    const response = Object.assign({}, BasicResponse);
    response.success = true;
    response.message = message;
    response.data = data;
    response.links = links;
    res.status(code).json(response);
  }

  static respondWithError(res, errorCode, message = '', links = []) {
    const response = Object.assign({}, BasicResponse);
    response.success = false;
    response.message = message;
    response.links = links;
    res.status(errorCode).json(response);
  }

  static respondWithErrorData(res, errorCode, message = '', data = '', links = []) {
    const response = Object.assign({}, BasicResponse);
    response.success = false;
    response.message = message;
    response.data = data;
    response.links = links;
    res.status(errorCode).json(response);
  }

  static generateHATEOASLink(link, method, rel) {
    return {
      link: link,
      method: method,
      rel: rel
    }
  }
}

export default ResponseManager;