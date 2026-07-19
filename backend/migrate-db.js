import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function migrate() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB.');

    const db = mongoose.connection.db;

    // We will copy the fields so that the old SDN project still works while MMA also gets what it needs.
    const result = await db.collection('movies').updateMany(
      {},
      [
        {
          $set: {
            title: { $cond: [ { $not: ["$title"] }, "$name", "$title" ] },
            description: { $cond: [ { $not: ["$description"] }, "$summary", "$description" ] },
            visible: { $cond: [ { $not: ["$visible"] }, "$isActive", "$visible" ] },
            score: { $cond: [ { $not: ["$score"] }, "$averageRating", "$score" ] },
          }
        }
      ]
    );

    console.log(`Migration successful. Modified ${result.modifiedCount} documents.`);
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

migrate();
