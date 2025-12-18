
import fs from 'fs';
import path from 'path';
import { formidable } from 'formidable';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  const imagesDir = path.join(process.cwd(), 'public', 'images');

  // Ensure directory exists
  if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
  }

  if (req.method === 'GET') {
    try {
      const files = fs.readdirSync(imagesDir);
      const images = files
        .filter(file => /\.(jpg|jpeg|png|gif|webp|svg|jpg)$/i.test(file))
        .map(file => `/images/${file}`);
      return res.status(200).json(images);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to list images' });
    }
  }

  if (req.method === 'POST') {
    const form = formidable({
      uploadDir: imagesDir,
      keepExtensions: true,
    });

    return new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) {
          res.status(500).json({ error: 'Upload failed' });
          return resolve();
        }
        const file = files.image || files.file;
        if (!file) {
          res.status(400).json({ error: 'No file uploaded' });
          return resolve();
        }
        
        // Handle both single and array (formidable v3+)
        const uploadedFile = Array.isArray(file) ? file[0] : file;
        const oldPath = uploadedFile.filepath || uploadedFile.path;
        const newFileName = uploadedFile.originalFilename || uploadedFile.name;
        const newPath = path.join(imagesDir, newFileName);

        fs.renameSync(oldPath, newPath);
        res.status(200).json({ url: `/images/${newFileName}` });
        resolve();
      });
    });
  }

  if (req.method === 'DELETE') {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: 'Missing url' });

    const fileName = path.basename(url);
    const filePath = path.join(imagesDir, fileName);

    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
        return res.status(200).json({ success: true });
      } catch (error) {
        return res.status(500).json({ error: 'Failed to delete file' });
      }
    } else {
      return res.status(404).json({ error: 'File not found' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
