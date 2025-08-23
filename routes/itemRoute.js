const express = require('express');
const router = express.Router();
const Item = require('../models/Item');
const HsnIdentifier = require('../models/HsnIdentifier');

// Add a new item
router.post('/add', async (req, res) => {
  try {
    const b=req.body;
    const hsnNo=await HsnIdentifier.findOne({company:b.company,itemType:b.type});
    const item = new Item({
      itemId:b.itemId,
      itemName:b.name,
      itemPrice:b.price,
      company:b.company,
      type:b.type,
      HSN:hsnNo.hsn,
    });
    await item.save();
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Search items by itemId
router.get('/search', async (req, res) => {
  const { q } = req.query;

  const items = await Item.aggregate([
    {
      $match: { itemId: { $regex: q, $options: 'i' } }
    },
    {
      $lookup: {
        from: 'inventories',          // 👈 collection name in MongoDB (check exact name)
        localField: 'itemId',
        foreignField: 'itemId',
        as: 'inventory'
      }
    },
    {
      $addFields: {
        availableQuantity: { $ifNull: [{ $arrayElemAt: ["$inventory.quantity", 0] }, 0] }
      }
    },
    {
      $project: {
        inventory: 0 
      }
    }
  ]);

  res.json(items);
});


module.exports = router;
