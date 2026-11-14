// Pulls a readable message out of an axios error from the OBS backend.
export const apiError = (err, fallback = 'Something went wrong.') =>
  err?.response?.data?.description || err?.response?.data?.message || fallback;

// Field name -> message for a 400 validation error (empty for anything else).
export const fieldErrors = (err) => err?.response?.data?.fieldErrors ?? {};
