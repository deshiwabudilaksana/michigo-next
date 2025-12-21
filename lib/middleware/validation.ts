import type { NextApiRequest, NextApiResponse } from 'next';

// Validation result interface
export interface ValidationErrors {
  errors: { [key: string]: string[] };
}

// Generic validation function for request body - returns error if validation fails
export const validateBody = (schema: { [key: string]: any }) => {
  return (req: NextApiRequest, res: NextApiResponse): Error | null => {
    const errors: { [key: string]: string[] } = {};

    // Check for required fields
    for (const field in schema) {
      const rules = schema[field];

      // Check if field is required
      if (
        rules.required &&
        (req.body?.[field] === undefined ||
          req.body?.[field] === null ||
          req.body?.[field] === "")
      ) {
        if (!errors[field]) errors[field] = [];
        errors[field].push(`${field} is required`);
      }

      // Check type validation if field exists
      if (
        req.body?.[field] !== undefined &&
        req.body?.[field] !== null &&
        req.body?.[field] !== ""
      ) {
        if (rules.type) {
          let valid = false;

          switch (rules.type) {
            case "string":
              valid = typeof req.body?.[field] === "string";
              break;
            case "number":
              valid =
                typeof req.body?.[field] === "number" ||
                !isNaN(Number(req.body?.[field]));
              break;
            case "boolean":
              valid =
                typeof req.body?.[field] === "boolean" ||
                req.body?.[field] === "true" ||
                req.body?.[field] === "false";
              break;
            case "date":
              valid = !isNaN(Date.parse(req.body?.[field]));
              break;
            case "email":
              valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(req.body?.[field]);
              break;
            case "array":
              valid = Array.isArray(req.body?.[field]);
              break;
          }

          if (!valid) {
            if (!errors[field]) errors[field] = [];
            errors[field].push(`${field} must be of type ${rules.type}`);
          }
        }

        // Check min length for strings
        if (
          rules.minLength &&
          typeof req.body?.[field] === "string" &&
          req.body?.[field].length < rules.minLength
        ) {
          if (!errors[field]) errors[field] = [];
          errors[field].push(
            `${field} must be at least ${rules.minLength} characters`
          );
        }

        // Check max length for strings
        if (
          rules.maxLength &&
          typeof req.body?.[field] === "string" &&
          req.body?.[field].length > rules.maxLength
        ) {
          if (!errors[field]) errors[field] = [];
          errors[field].push(
            `${field} must be at most ${rules.maxLength} characters`
          );
        }

        // Check minimum value for numbers
        if (
          rules.min &&
          typeof req.body?.[field] === "number" &&
          req.body?.[field] < rules.min
        ) {
          if (!errors[field]) errors[field] = [];
          errors[field].push(`${field} must be at least ${rules.min}`);
        }

        // Check maximum value for numbers
        if (
          rules.max &&
          typeof req.body?.[field] === "number" &&
          req.body?.[field] > rules.max
        ) {
          if (!errors[field]) errors[field] = [];
          errors[field].push(`${field} must be at most ${rules.max}`);
        }

        // Check if value is in allowed enum values
        if (rules.enum && !rules.enum.includes(req.body?.[field])) {
          if (!errors[field]) errors[field] = [];
          errors[field].push(
            `${field} must be one of [${rules.enum.join(", ")}]`
          );
        }
      }
    }

    if (Object.keys(errors).length > 0) {
      return new Error(JSON.stringify({
        error: "Validation failed",
        details: errors,
      }));
    }

    return null; // Success - no errors
  };
};

// Validation middleware for user registration
export const validateUserRegistration = (req: NextApiRequest, res: NextApiResponse): Error | null => {
  const schema = {
    email: { required: true, type: "email" },
    password: { required: true, type: "string", minLength: 6 },
    firstName: { required: true, type: "string", minLength: 2 },
    lastName: { required: true, type: "string", minLength: 2 },
  };
  return validateBody(schema)(req, res);
};

// Validation middleware for user login
export const validateUserLogin = (req: NextApiRequest, res: NextApiResponse): Error | null => {
  const schema = {
    email: { required: true, type: "email" },
    password: { required: true, type: "string" },
  };
  return validateBody(schema)(req, res);
};

// Validation middleware for event creation
export const validateEventCreation = (req: NextApiRequest, res: NextApiResponse): Error | null => {
  const schema = {
    title: { required: true, type: "string", minLength: 3, maxLength: 200 },
    description: {
      required: true,
      type: "string",
      minLength: 10,
      maxLength: 2000,
    },
    date: { required: true, type: "date" },
    time: { required: true, type: "string" },
    location: { required: true, type: "string", minLength: 3 },
    category: { required: true, type: "string", minLength: 2 },
    totalTickets: { required: true, type: "number", min: 1 },
    price: { required: true, type: "number", min: 0 },
  };
  return validateBody(schema)(req, res);
};

// Validation middleware for ticket booking
export const validateTicketBooking = (req: NextApiRequest, res: NextApiResponse): Error | null => {
  const schema = {
    eventId: { required: true, type: "string" },
    userId: { required: true, type: "string" },
    ticketType: {
      required: true,
      type: "string",
      enum: ["standard", "vip", "premium"],
    },
    quantity: { type: "number", min: 1, max: 10 }, // Default to 1 if not provided, max 10 per booking
  };
  return validateBody(schema)(req, res);
};
