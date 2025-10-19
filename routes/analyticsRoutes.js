const express = require('express');
const Bill = require('../models/Bill');
const Inventory = require('../models/Inventory');
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
            $sum: { $multiply: ["$items.quantity", "$items.initialPrice"] }
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

    console.log(sales[0].items)

    res.json(sales.length ? sales[0] : { items: [], totalQuantity: 0, totalRevenue: 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.get('/monthly-profit', async (req, res) => {
  try {
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({ message: 'Please provide month and year' });
    }

    const bills = await Bill.find({
      createdAt: {
        $gte: new Date(`${year}-${month}-01`),
        $lt: new Date(`${year}-${parseInt(month) + 1}-01`)
      }
    });

    const soldMap = {};

    bills.forEach(bill => {
      bill.items.forEach(item => {
        if (!soldMap[item.itemId]) soldMap[item.itemId] = { quantity: 0, revenue: 0,actualRevenue:0 };
        soldMap[item.itemId].quantity += item.quantity;
        soldMap[item.itemId].revenue += item.quantity * item.initialPrice;
        soldMap[item.itemId].actualRevenue+=item.quantity * item.finalPrice;
      });
    });

    const itemIds = Object.keys(soldMap);
    const inventories = await Inventory.find({ itemId: { $in: itemIds } });

    const itemWiseProfit = itemIds.map(itemId => {
      const sold = soldMap[itemId];
      const inventory = inventories.find(inv => inv.itemId === itemId);

      const monthInt = parseInt(month, 10);
      const yearInt = parseInt(year, 10);

      let totalCost = 0;

      if (inventory) {
        const monthlyPurchases = inventory.purchases.filter(p => {
          const d = new Date(p.date);
          return d.getFullYear() === yearInt && d.getMonth() + 1 === monthInt;
        });

        const totalStockQty = monthlyPurchases.reduce((acc, p) => acc + p.quantity, 0);
        const totalStockPrice = monthlyPurchases.reduce((acc, p) => acc + p.price, 0);

        const avgCostPerUnit = totalStockQty > 0 ? totalStockPrice / totalStockQty : 0;
        totalCost = avgCostPerUnit * sold.quantity;
      }
      const profit = ((sold.actualRevenue - totalCost)/1.18)+ (sold.revenue-sold.actualRevenue);

      return {
        itemId,
        soldQuantity: sold.quantity,
        revenue: sold.revenue,
        cost: totalCost,
        profit
      };
    });

    res.json(itemWiseProfit); // ✅ return only item-wise profit
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;