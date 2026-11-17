/** Membungkus handler async agar error-nya diteruskan ke error handler Express. */
export const asyncHandler = handler => (req, res, next) =>
  Promise.resolve(handler(req, res, next)).catch(next)
