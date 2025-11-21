const express = require('express');
const Inventory = require('../models/Inventory');
const router = express.Router();

router.post('/addItemtoInventory', async (req, res) => {
  try {
    const data = req.body;

    if (!Array.isArray(data)) {
      return res.status(400).json({ message: 'Expected an array of inventory items' });
    }

    for (const entry of data) {
      const { itemId, quantity, price, purchaseDate } = entry;

      // 🔎 Find existing inventory by itemId
      let inventory = await Inventory.findOne({ itemId });

      if (inventory) {
        // check if purchase already exists for the same date
        const existingPurchase = inventory.purchases.find(
          (p) => p.date.toISOString().split('T')[0] === purchaseDate
        );

        if (existingPurchase) {
          // Update the existing purchase
          existingPurchase.quantity += quantity;
          existingPurchase.price += price;
        } else {
          // Add new purchase entry
          inventory.purchases.push({
            quantity,
            price,
            date: purchaseDate,
          });
        }

        // update stock totals
        inventory.quantityInStock += quantity;
        inventory.priceOfStock += price;

        await inventory.save();
      } else {
        // create new inventory document
        const newInventory = new Inventory({
          itemId,
          quantityInStock: quantity,
          priceOfStock: price,
          purchases: [
            {
              quantity,
              price,
              date: purchaseDate,
            },
          ],
        });

        await newInventory.save();
      }
    }

    res.status(200).json({ message: 'Inventory updated successfully' });
  } catch (err) {
    console.error('Error updating inventory:', err);
    res.status(500).json({ message: 'Server error' });
  }
});


router.post('/update', async (req, res) => {
  try {
    const items = req.body.items;

    for (const item of items) {
      const inventory = await Inventory.findOne({ itemId: item.itemId });

      if (!inventory) {
        return res.status(404).json({ message: `Item ${item.itemId} not found` });
      }

      const qInStock = inventory.quantityInStock;
      const pInStock = inventory.priceOfStock;

      if (item.quantity > qInStock) {
        return res.status(400).json({ message: `Not enough stock for ${item.itemId}` });
      }

      const avgCostPerUnit = pInStock / qInStock;

      const costReduction = avgCostPerUnit * item.quantity;

      await Inventory.updateOne(
        { itemId: item.itemId },
        {
          $inc: {
            quantityInStock: -item.quantity,
            priceOfStock: -costReduction,
          }
        }
      );
    }

    res.status(200).json({ message: 'Inventory updated successfully' });
  } catch (err) {
    console.error('Error updating inventory:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/getEntireInventory', async (req, res) => {
  try {
    const items = await Inventory.aggregate([
      {
        $match: {
          quantityInStock: { $gt: 0 }   // ✅ Filter here
        }
      },
      {
        $lookup: {
          from: "items",            
          localField: "itemId",     
          foreignField: "itemId",  
          as: "itemData"
        }
      },
      { $unwind: "$itemData" },    
      {
        $addFields: {
          itemName: "$itemData.itemName",        
          givenPrice: "$itemData.givenPrice"     
        }
      },
      {
        $project: {
          itemData: 0  
        }
      }
    ]);

    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;