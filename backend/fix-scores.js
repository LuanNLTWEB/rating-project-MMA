import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
import Movie from './models/Movie.js';
import Review from './models/Review.js';

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const movies = await Movie.find({});
  console.log('Validating scores...');
  for (const movie of movies) {
    const stats = await Review.aggregate([
      { $match: { movie: movie._id } },
      { $group: { _id: null, avgRating: { $avg: "$overallRating" }, count: { $sum: 1 } } }
    ]);
    
    const actualAvg = stats.length > 0 ? Math.round(stats[0].avgRating * 10) / 10 : 0;
    const actualCount = stats.length > 0 ? stats[0].count : 0;
    
    if (movie.score !== actualAvg || movie.reviewCount !== actualCount) {
      console.log(`${movie.title}: DB Score: ${movie.score} (Count: ${movie.reviewCount}) | Actual from Reviews: ${actualAvg} (Count: ${actualCount})`);
      
      // Fix it automatically
      await Movie.findByIdAndUpdate(movie._id, { score: actualAvg, reviewCount: actualCount });
    }
  }
  console.log('Validation complete.');
  process.exit(0);
});
