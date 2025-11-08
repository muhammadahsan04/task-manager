const Joi = require('joi');

// User validation schemas
const userValidation = {
  register: Joi.object({
    name: Joi.string().min(2).max(50).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required()
  }),
  
  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  })
};

// Team validation schemas
const teamValidation = {
  create: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    description: Joi.string().max(500).allow('').optional()
  }),
  
  update: Joi.object({
    name: Joi.string().min(2).max(100).optional(),
    description: Joi.string().max(500).allow('').optional()
  }),
  
  addMember: Joi.object({
    email: Joi.string().email().required()
  })
};

// Task validation schemas
const taskValidation = {
  create: Joi.object({
    title: Joi.string().min(2).max(200).required(),
    description: Joi.string().max(1000).allow('').optional(),
    priority: Joi.string().valid('low', 'medium', 'high').optional(),
    assigned_to: Joi.number().integer().positive().optional(),
    due_date: Joi.date().iso().optional()
  }),
  
  update: Joi.object({
    title: Joi.string().min(2).max(200).optional(),
    description: Joi.string().max(1000).allow('').optional(),
    status: Joi.string().valid('pending', 'in_progress', 'completed').optional(),
    priority: Joi.string().valid('low', 'medium', 'high').optional(),
    assigned_to: Joi.number().integer().positive().allow(null).optional(),
    due_date: Joi.date().iso().allow(null).optional()
  })
};

// Validation middleware factory
const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false });
    
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      
      return res.status(400).json({
        message: 'Validation error',
        errors
      });
    }
    
    req.body = value; // Use validated and sanitized data
    next();
  };
};

module.exports = {
  userValidation,
  teamValidation,
  taskValidation,
  validate
};





