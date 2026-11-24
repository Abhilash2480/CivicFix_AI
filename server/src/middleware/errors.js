export function errorHandler(error, _req, res, _next) {
  console.error(error);
  if (error.name === 'MulterError') return res.status(error.code === 'LIMIT_FILE_SIZE' ? 413 : 400).json({ message: error.code === 'LIMIT_FILE_SIZE' ? 'Image or video must be 14 MB or smaller.' : 'Invalid media upload.' });
  if (error.name === 'ValidationError') return res.status(400).json({ message: Object.values(error.errors).map((item) => item.message).join(' ') });
  if (error.code === 11000) return res.status(409).json({ message: 'That record already exists.' });
  res.status(error.status || 500).json({ message: error.message || 'Something went wrong. Please try again.' });
}
