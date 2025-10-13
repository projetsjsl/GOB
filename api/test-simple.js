export default function handler(req, res) {
  res.status(200).json({ message: 'Test endpoint OK', timestamp: new Date().toISOString() });
}
