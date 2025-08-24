const express = require('express');
const Inventory = require('../models/Inventory');
const router = express.Router();

router.post('/addItemtoInventory', async (req, res) => {
    try {
        const data = req.body;
        console.log(data);
        if (!Array.isArray(data)) {
            return res.status(400).json({ message: 'Expected an array of inventory items' });
        }

        for (const entry of data) {
            const { itemId, quantity, totalPrice } = entry;

            const existing = await Inventory.findOne({
                itemId
            });

            if (existing) {
                existing.quantity += quantity;
                existing.totalQuantity += quantity;
                existing.totalCostPrice += totalPrice;
                existing.price += totalPrice;
                await existing.save();
            } else {
                const newItem = new Inventory({
                    itemId,
                    quantity,
                    price: totalPrice,
                    totalQuantity: quantity,
                    totalCostPrice: totalPrice,
                });

                await newItem.save();
            }
        }

        res.status(200).json({ message: 'Inventory updated successfully' });

    } catch (err) {
        console.error('Error updating inventory:', err);
        res.status(500).json({ message: 'Server error' });
    }
});


router.post('/update',async (req, res) => {
    console.log(req.body.items);
    const items = req.body.items;

    for (const item of items) {
        const q=await Inventory.findOne({itemId:item.itemId});
        console.log(q);
        const q1=q.quantity;
        const p1=q.price;
        const temp=p1/q1;
        console.log(q1,p1,temp);
        await Inventory.updateOne(
            { itemId: item.itemId },
            {
                $inc: { quantity: -item.quantity ,
                    price:-(temp)*item.quantity,
                    totalSellingPrice: item.givenPrice * item.quantity
                }
            }
        );
    }

})

module.exports = router;