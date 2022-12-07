import sanitizeHtml from 'sanitize-html';

const USER_ACCOUNT_VALIDATION_SCHEMA = () => {
  return {
    'email': {
      trim: true,
      isEmail: true,
      normalizeEmail: true,
      errorMessage: 'Invalid email format'
    },
    'password': {
      trim: true,
      isLength: {
        options: [{ min: 4, max: 30 }],
        errorMessage: 'Password must be between 4 and 30 chars long'
      }
    },
    'passwordConfirmation': {
      trim: true,
      custom: {
        options: (value, { req }) => value !== req.body.password ? Promise.reject('Password confirmation does not match password') : true
      }
    },
    'nickname': {
      matches: {
        options: [/^[ㄱ-ㅎ가-힣a-zA-Z0-9]{2,15}$/],
        errorMessage: 'Nickname must be between 2 and 15 chars long'
      }
    }
  };
};

const USER_ACCOUNT_UPDATE_VALIDATION_SCHEMA = () => {
  return {
    'currentPassword': {
      trim: true
    },
    'newPassword': {
      trim: true,
      isLength: {
        options: [{ min: 4, max: 30 }],
        errorMessage: 'Password must be between 4 and 30 chars long'
      }
    },
    'passwordConfirmation': {
      trim: true,
      custom: {
        options: (value, { req }) => value !== req.body.newPassword ? Promise.reject('Password confirmation does not match password') : true
      }
    },
    'nickname': {
      matches: {
        options: [/^[ㄱ-ㅎ가-힣a-zA-Z0-9]{2,15}$/],
        errorMessage: 'Nickname must be between 2 and 15 chars long'
      }
    }
  };
};

const USER_PROFILE_UPDATE_VALIDATION_SCHEMA = () => {
  return {
    'greetings': {
      isLength: {
        options: [{ max: 300 }],
        errorMessage: 'Greetings must be under 300 chars long'
      },
      optional: { options: { nullable: true } }
    },
    'introduce': {
      isLength: {
        options: [{ max: 10000 }],
        errorMessage: 'Introduce must be under 10000 chars long'
      },
      customSanitizer: {
        options: value => value !== undefined
          ? sanitizeHtml(value, { exclusiveFilter: (frame) => frame.tag === 'script' })
          : undefined
      }
    }
  };
};

export default {
  USER_ACCOUNT_VALIDATION_SCHEMA,
  USER_ACCOUNT_UPDATE_VALIDATION_SCHEMA,
  USER_PROFILE_UPDATE_VALIDATION_SCHEMA
};
