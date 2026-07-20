import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function setTrending() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB.');

    const db = mongoose.connection.db;

    // Lấy 5 bộ phim bất kỳ (hoặc có điểm cao nhất) và cập nhật trending: true
    const movies = await db.collection('movies')
      .find({ visible: true })
      .sort({ score: -1 })
      .limit(5)
      .toArray();

    if (movies.length === 0) {
      console.log('No movies found to set trending.');
      return;
    }

    const movieIds = movies.map(m => m._id);

    const result = await db.collection('movies').updateMany(
      { _id: { $in: movieIds } },
      { $set: { trending: true } }
    );

    console.log(`Successfully set ${result.modifiedCount} movies to trending.`);
  } catch (error) {
    console.error('Failed to set trending:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

setTrending();
