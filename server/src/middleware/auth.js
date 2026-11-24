import jwt from 'jsonwebtoken';

export function protect(req, res, next) {
  const token = req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Please log in to continue.' });
  try { req.auth = jwt.verify(token, process.env.JWT_SECRET); next(); }
  catch { return res.status(401).json({ message: 'Your session has expired. Please log in again.' }); }
}
export function adminOnly(req, res, next) {
  if (req.auth?.role !== 'admin') return res.status(403).json({ message: 'Administrator access required.' });
  next();
}
