// Comprehensive example template for Flowww
// This template demonstrates all available features of the Flowww flowchart maker

export const exampleTemplate = `FLOWCHART_NAME: User Authentication Flow
ORIENTATION: vertical

// Define steps with ID, NAME, TYPE, SHAPE, and optional DESCRIPTION
// Available TYPES: start, end, process, decision, input, output, database, document
// Available SHAPEs: rectangle, roundedrect, diamond, circle, cylinder, trapezoid

// Start of the flow
STEP: start, Start, start, circle, Begin the authentication process

// Input step for user credentials
STEP: input_creds, Enter Credentials, input, rectangle, User enters username and password

// Decision point for credential validation
STEP: validate, Validate Credentials, decision, diamond, Check if credentials are valid

// Success path
STEP: success, Authentication Success, output, roundedrect, User successfully authenticated

// Failure path
STEP: failure, Authentication Failed, output, roundedrect, Invalid credentials or user not found

// Database operations
STEP: db_check, Check User in DB, database, cylinder, Query user database for credentials

// Additional process steps
STEP: log_attempt, Log Attempt, process, rectangle, Record login attempt in audit log
STEP: lock_account, Lock Account, process, rectangle, Lock account after multiple failed attempts
STEP: send_reset, Send Reset Email, process, rectangle, Send password reset email to user

// End of the flow
STEP: end_flow, End, end, circle, Authentication process completed

// Define the flow between steps using LINK: from, to, [label]
// Links can have optional labels to describe the connection

// Main flow
LINK: start, input_creds
LINK: input_creds, validate
LINK: validate, db_check, Valid format?

// Success path
LINK: db_check, success, Valid user
LINK: success, log_attempt
LINK: log_attempt, end_flow

// Failure path
LINK: db_check, failure, Invalid user
LINK: failure, log_attempt
LINK: failure, lock_account, Attempts > 3
LINK: lock_account, send_reset
LINK: send_reset, end_flow`;

// Helper function to get the template with a specific name
export const getTemplate = (templateName = 'default') => {
  const templates = {
    default: exampleTemplate,
    // Add more templates here in the future
  };
  return templates[templateName] || exampleTemplate;
};
