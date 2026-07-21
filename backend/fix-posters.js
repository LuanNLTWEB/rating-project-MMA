import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Movie from './models/Movie.js';

dotenv.config();

async function fixPosters() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    await Movie.updateOne(
      { title: 'Gotoubun no Hanayome' },
      { $set: { poster: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx103986-ksRIVQG3wL1D.jpg', image: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx103986-ksRIVQG3wL1D.jpg' } }
    );
    await Movie.updateOne(
      { title: 'Jujutsu Kaisen' },
      { $set: { poster: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx113415-bbBWj4pEFseh.jpg', image: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx113415-bbBWj4pEFseh.jpg' } }
    );
    console.log('Fixed posters successfully');
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}
fixPosters();
