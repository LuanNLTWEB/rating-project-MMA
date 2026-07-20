import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import genreRoutes from './routes/genres.js';
import movieRoutes from './routes/movies.js';
import userRoutes from './routes/users.js';
import auditRoutes from './routes/audit.js';
import favoriteRoutes from './routes/favorites.js';
import watchlistRoutes from './routes/watchlist.js';
import profileRoutes from './routes/profile.js';
import newsRoutes from './routes/news.js';
import reviewRoutes from './routes/reviews.js';
import reportRoutes from './routes/reports.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/genres', genreRoutes);
app.use('/api/movies', movieRoutes);
app.use('/api/users', userRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/watchlist', watchlistRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/reports', reportRoutes);

app.get('/api', (_req, res) => {
  res.json({ message: 'Movie & Anime API' });
});

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    const port = process.env.PORT || 5000;
    app.listen(port, () => console.log(`Server running on port ${port}`));
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

app.use((req, res, next) => { console.log(req.method + ' ' + req.originalUrl); next(); });
