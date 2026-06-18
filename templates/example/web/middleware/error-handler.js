export function errorHandler(err, _req, res, _next) {
  const status = err.status || 500
  res.status(status).render('error', {
    status,
    message: err.message || 'Internal Server Error',
  })
}
