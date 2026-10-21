export function errorHandler(err, req, res, next) {
  console.error('[ERROR]', err.message, err.stack)

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ error: 'Unauthorized', message: err.message })
  }

  const status = err.status || err.statusCode || 500
  const message = process.env.NODE_ENV === 'production' && status === 500
    ? 'Internal server error'
    : err.message

  res.status(status).json({ error: err.name || 'Error', message })
}
