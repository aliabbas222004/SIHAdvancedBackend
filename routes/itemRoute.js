const express = require('express');
const router = express.Router();
const Item = require('../models/Item');
const HsnIdentifier = require('../models/HsnIdentifier');
const Inventory = require('../models/Inventory');

// Add a new item
router.post('/add', async (req, res) => {
  try {
    const b = req.body;
    const hsnNo = await HsnIdentifier.findOne({ company: b.company, itemType: b.type });
    const item = new Item({
      itemId: b.itemId,
      itemName: b.name,
      company: b.company,
      type: b.type,
      HSN: hsnNo.hsn,
    });
    await item.save();
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/searchInInventory', async (req, res) => {
  const { q } = req.query;

  try {
    const items = await Inventory.aggregate([
      {
      $match: { itemId: { $regex: q, $options: 'i' } }
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
          HSN:"$itemData.HSN"        
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


// Search items by itemId
router.get('/search', async (req, res) => {
  const { q } = req.query;

  const items = await Item.aggregate([
    {
      $match: { itemId: { $regex: q, $options: 'i' } }
    },
    {
      $lookup: {
        from: 'inventories',     
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

// router.get('/findDetails', async (req, res) => {
//   const { q } = req.query;

//   const items = await Item.aggregate([
//     {
//       $match: { itemId: { $regex: q, $options: 'i' } }
//     },
//     {
//       $lookup: {
//         from: 'inventories',          
//         localField: 'itemId',
//         foreignField: 'itemId',
//         as: 'inventory'
//       }
//     },
//     {
//       $addFields: {
//         availableQuantity: { $ifNull: [{ $arrayElemAt: ["$inventory.quantity", 0] }, 0] },
//         totalCostPrice: { $ifNull: [{ $arrayElemAt: ["$inventory.totalCostPrice", 0] }, 0] },
//         totalQuantity: { $ifNull: [{ $arrayElemAt: ["$inventory.totalQuantity", 0] }, 0] },
//         totalSellingPrice: { $ifNull: [{ $arrayElemAt: ["$inventory.totalSellingPrice", 0] }, 0] },
//         stockPrice: { $ifNull: [{ $arrayElemAt: ["$inventory.price", 0] }, 0] },
//       }
//     },
//     {
//       $project: {
//         inventory: 0
//       }
//     }
//   ]);

//   res.json(items);
// })


router.get('/getAllItems', async (req, res) => {
  try {
    const items = await Inventory.aggregate([
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
