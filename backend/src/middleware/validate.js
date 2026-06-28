import { validationResult } from 'express-validator';

const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const validationErrors = errors.array();
    return res.status(422).json({
      success: false,
      message: validationErrors[0]?.msg || 'Validation failed.',
      errors: validationErrors,
    });
  }

  return next();
};

export default validate;
