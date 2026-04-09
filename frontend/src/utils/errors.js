export function extractApiError(error) {
  const data = error?.response?.data;
  if (!data) {
    return { message: 'Something went wrong. Please try again.', fieldErrors: {} };
  }

  return {
    message: data.message || 'Request failed',
    fieldErrors: data.details || {},
  };
}
