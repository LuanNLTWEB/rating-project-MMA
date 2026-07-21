import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
import Movie from './models/Movie.js';

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const movies = await Movie.find({}, 'title score');
  console.log(movies.map(m => `${m.title}: ${m.score}`).join('\n'));
  process.exit(0);
});
