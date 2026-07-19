import { Router } from 'express';
import auth from '../middleware/auth.js';
import News from '../models/News.js';

const router = Router();

function requireStaff(req, res, next) {
  if (!req.user || req.user.role !== 'staff') {
    return res.status(403).json({ message: 'Access denied. Staff role required.' });
  }
  next();
}

// Get all published news for public user list
router.get('/', async (req, res) => {
  try {
    const list = await News.find({ status: 'published' })
      .sort({ publishedAt: -1, createdAt: -1 })
      .populate('author', 'name');
    res.json(list);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching news' });
  }
});

// Get ALL news for staff (includes hidden/draft ones)
router.get('/all', auth, requireStaff, async (req, res) => {
  try {
    const news = await News.find({})
      .populate('author', 'name')
      .sort({ createdAt: -1 });
    res.json(news);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a single news by ID (public)
router.get('/:id', async (req, res) => {
  try {
    const article = await News.findOne({ _id: req.params.id, status: 'published' }).populate('author', 'name');
    if (!article) return res.status(404).json({ message: 'Article not found' });
    res.json(article);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a news article manually (Staff CRUD)
router.post('/', auth, requireStaff, async (req, res) => {
  try {
    const { title, summary, content, authorName, tags, status, sourceUrls, imageUrls, videoUrls } = req.body;
    
    if (!title || !title.trim()) return res.status(400).json({ message: 'Title is required' });

    const news = await News.create({
      title: title.trim(),
      summary: summary || '',
      content: content || '',
      imageUrls: Array.isArray(imageUrls) ? imageUrls : (imageUrls ? [imageUrls] : []),
      videoUrls: Array.isArray(videoUrls) ? videoUrls : (videoUrls ? [videoUrls] : []),
      sourceUrls: Array.isArray(sourceUrls) ? sourceUrls : (sourceUrls ? [sourceUrls] : []),
      authorName: authorName || '',
      tags: Array.isArray(tags) ? tags : (tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : []),
      status: status || 'draft',
      author: req.user.id,
      publishedAt: status === 'published' ? new Date() : null
    });
    res.status(201).json({ message: 'Created successfully!', news });
  } catch (error) {
    res.status(500).json({ message: 'Error creating article', error: error.message });
  }
});

// Update news article by staff
router.put('/:id', auth, requireStaff, async (req, res) => {
  try {
    const { title, summary, content, authorName, tags, status, sourceUrls, imageUrls, videoUrls } = req.body;

    const news = await News.findById(req.params.id);
    if (!news) return res.status(404).json({ message: 'Article not found' });

    if (title) {
      news.title = title.trim();
      news.slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    }
    if (summary !== undefined) news.summary = summary;
    if (content !== undefined) news.content = content;
    if (imageUrls !== undefined) news.imageUrls = Array.isArray(imageUrls) ? imageUrls : [imageUrls];
    if (videoUrls !== undefined) news.videoUrls = Array.isArray(videoUrls) ? videoUrls : [videoUrls];
    if (sourceUrls !== undefined) news.sourceUrls = Array.isArray(sourceUrls) ? sourceUrls : [sourceUrls];
    if (authorName !== undefined) news.authorName = authorName;
    if (tags !== undefined) {
      news.tags = Array.isArray(tags) ? tags : (typeof tags === 'string' ? tags.split(',').map(t => t.trim()).filter(Boolean) : []);
    }
    if (status) {
      news.status = status;
      if (status === 'published' && !news.publishedAt) {
        news.publishedAt = new Date();
      }
    }

    await news.save();
    res.json({ message: 'Updated successfully!', news });
  } catch (error) {
    res.status(500).json({ message: 'Error updating article', error: error.message });
  }
});

// Delete news article
router.delete('/:id', auth, requireStaff, async (req, res) => {
  try {
    const result = await News.findByIdAndDelete(req.params.id);
    if (!result) return res.status(404).json({ message: 'Article not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting article', error: error.message });
  }
});

export default router;
