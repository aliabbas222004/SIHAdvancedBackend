const express = require('express');
const Bill = require('../models/Bill');
const router = express.Router();

router.get('/sales', async (req, res) => {
  try {
    const { month, year } = req.query;

    let matchStage = {};
    if (year) {
      matchStage["$expr"] = { $eq: [{ $year: "$createdAt" }, parseInt(year)] };
    }
    if (month) {
      matchStage["$expr"] = {
        $and: [
          { $eq: [{ $year: "$createdAt" }, parseInt(year)] },
          { $eq: [{ $month: "$createdAt" }, parseInt(month)] }
        ]
      };
    }

    const sales = await Bill.aggregate([
      { $match: matchStage },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.itemId",
          totalQuantity: { $sum: "$items.quantity" },
          totalRevenue: {
            $sum: { $multiply: ["$items.quantity", "$items.givenPrice"] }
          }
        }
      },
      {
        $group: {
          _id: null,
          items: {
            $push: {
              itemId: "$_id",
              totalQuantity: "$totalQuantity",
              totalRevenue: "$totalRevenue"
            }
          },
          totalQuantity: { $sum: "$totalQuantity" },
          totalRevenue: { $sum: "$totalRevenue" }
        }
      },
      { $project: { _id: 0 } }
    ]);

    res.json(sales.length ? sales[0] : { items: [], totalQuantity: 0, totalRevenue: 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;