const mongoose = require('mongoose')

////MobileBazaar is the data base name

const connectDB = mongoose.connect(process.env.MONGODB)

connectDB
.then(() => {
  console.log('MongoDB Connected');
})
.catch((err) => {
  console.error('MongoDB Connection Error:', err);
});

