const path = require('path');
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const compression = require('compression');
require("dotenv").config();

const app = express();

app.use(compression());
app.use(cors({
  origin: "*",
  credentials: true,
}));
app.use(express.json());

app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

const auth = require('./middleware/auth');

// Define Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/user', auth, require('./routes/user'));
app.use('/api/invoices', auth, require('./routes/invoices'));
app.use('/api/challan', auth, require('./routes/challan'));

if (process.env.NODE_ENV === 'production') {

  app.use(express.static(path.join(__dirname, '../client/build')));

  app.use((req, res) => {
    res.sendFile(
      path.join(__dirname, '../client/build/index.html')
    );
  });

}
app.get("/", (req, res) => {
  res.send("Backend Running");
});

console.log("Connecting to MongoDB...");
if (!process.env.MONGO_URI) {
  console.error("Error: MONGO_URI is not defined in .env file");
  process.exit(1);
}

mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("MongoDB Connected Successfully"))
.catch((err) => {
  console.error("MongoDB Connection Error:");
  console.error(err.message);
  console.error("Please check if your IP address is whitelisted in MongoDB Atlas and if your credentials are correct.");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});