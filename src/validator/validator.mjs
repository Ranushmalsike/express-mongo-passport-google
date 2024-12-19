import { check } from 'express-validator';
import User from '../schema/schema.mjs'
import { compareValues } from '../Hashing /hash.mjs';

/**
 * when we add new data before check the through this validation
 */
export const uservalidation = {
    name: {
        notEmpty: {
            errorMessage : "cannot enter empty values",
        },
        isLength :{
            Option: {
                min: 2,
                max: 10,
            },
            errorMessage: "length must be keep 2 between 10",  
        },
        isString: true,
    },
    // Password section
    password: {
        notEmpty :{
            errorMessage: "cannot enter empty values",
        },
        isLength :{
            Option:{
                min: 8,
            },
            errorMessage: "Length must be 8 values",
        },
        
    }
    //we can enter filed by filed validation login here 
};

/**
 * come from user input data /user/api/view
 * Middleware for validating user input
 */
export const validateUserView = [
  check('name')
    .notEmpty()
    .withMessage("Name is required")
    .custom(async (name) => {
      const existingUser = await User.findOne({ name });
      if (!existingUser) {
        throw new Error("Name does not exist in the database");
      }
    }),

  check('password')
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long")
    .custom(async (password, { req }) => {
      const { name } = req.body;
      const user = await User.findOne({ name });
      if (!user) {
        throw new Error("Invalid credentials");
      }

      // Compare password using bcrypt
      const isMatch = await compareValues(password, user.password);
      if (!isMatch) {
        throw new Error("Invalid password");
      }
    
    }),
];

