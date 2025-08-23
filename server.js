require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const itemRoutes = require('./routes/itemRoute');
const billRoutes = require('./routes/billRoute');
const inventoryRoutes=require('./routes/inventoryRoutes');
const hsnRoutes=require('./routes/hsnRoutes');
const companyRoutes=require('./routes/companyRoutes');
const app = express();

app.use(cors());
app.use(express.json());
app.use('/api/items', itemRoutes);
app.use('/api/bill', billRoutes);
app.use('/inventory', inventoryRoutes);
app.use('/hsn',hsnRoutes );
app.use('/company',companyRoutes );
// app.use('/bills', express.static('bills')); // serve generated bills

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(5000, () => console.log('Server running on port 5000'));
  })
  .catch(err => console.error(err));
