const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    console.log('Connecting to MongoDB...');

    // Set strictQuery to false to prepare for Mongoose 7
    mongoose.set('strictQuery', false);

    // Connect to MongoDB
    const conn = await mongoose.connect('mongodb+srv://root:root@cluster0.swl48w9.mongodb.net/leadmanagement');

    console.log('✅ MongoDB Connected');

    // Log the connection status
    const { host, port, name } = mongoose.connection;
    console.log(`Connected to MongoDB at ${host}:${port}/${name}`);

    // Log the connection details
    console.log('MongoDB connection state:', mongoose.connection.readyState);
    // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting

    // Test the connection by writing and reading a document
    try {
      // Create a test collection if it doesn't exist
      if (!mongoose.connection.collections['test']) {
        await mongoose.connection.createCollection('test');
      }

      // Insert a test document
      const testDoc = await mongoose.connection.collection('test').insertOne({
        test: true,
        date: new Date()
      });
      console.log('Test document inserted:', testDoc.insertedId);

      // Read the test document
      const foundDoc = await mongoose.connection.collection('test').findOne({
        _id: testDoc.insertedId
      });
      console.log('Test document retrieved:', foundDoc ? 'Yes' : 'No');

      // Log the available collections
      const collections = await mongoose.connection.db.listCollections().toArray();
      console.log('Available collections:', collections.map(c => c.name));
    } catch (testError) {
      console.error('Error testing database connection:', testError);
    }
  } catch (error) {
    console.error('❌ Connection Failed:', error.message);
    console.error('Error details:', error);
    process.exit(1);
  }
};

module.exports = connectDB;
