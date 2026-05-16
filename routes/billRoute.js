const express = require('express');
const Bill = require('../models/Bill');
const Inventory = require('../models/Inventory');
const DirectBill = require('../models/DirectBill');
const router = express.Router();

router.post('/addBill', async (req, res) => {
  try {
    const data = req.body;
    const newBill = new Bill({
      billId: data.billId,
      customerName: data.custName,
      customerPhone: data.phoneno,
      billAddress: data.custAdd,
      customerState: data.custState,
      shippingAddress: data.shipAdd,
      customerGST: data.custGSTIN,
      shipCustName: data.shipcustName,
      shipCustPhone: data.shipcustPhone,
      shipCustState: data.shipbillState,
      shipCustGST: data.shipcustGST,
      items: data.tableData.map(item => ({
        itemId: item.itemId,
        initialPrice: item.initialPrice,
        finalPrice: item.finalPrice,
        quantity: item.selectedQuantity
      })),
      totalAmount: data.totalPrice,
      createdAt: data.billDate ? new Date(data.billDate) : undefined,
      paymentMode: data.paymentMode,
      freightCharge_packaging: data.freightCharge_packaging ? Number(data.freightCharge_packaging) : 0
    });

    await newBill.save();

    res.json({ status: 'success', message: 'Bill saved successfully!', billId: newBill.billId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

router.post('/direct', async (req, res) => {
  try {
    const { customerName, items, date } = req.body;

    if (!customerName || !items || items.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid data',
      });
    }

    const formattedItems = items.map(item => ({
      itemName: item.name,
      purchasePrice: Number(item.purchasePrice),
      sellingPrice: Number(item.sellingPrice),
      quantity: Number(item.quantity),
    }));


    const bill = new DirectBill({
      customerName,
      items: formattedItems,
      createdAt: date ? new Date(date) : new Date(),
    });

    await bill.save();

    res.json({
      status: 'success',
      message: 'Direct entry added successfully!',
      billId: bill._id,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      status: 'error',
      message: err.message,
    });
  }
});


router.post('/deleteBill', async (req, res) => {
  try {
    const { billId } = req.body;

    const deletedBill = await Bill.findOne({ billId });

    if (!deletedBill) {
      return res.status(404).json({
        status: "error",
        message: "Bill not found!"
      });
    }

    const items = deletedBill.items;

    for (const item of items) {
      const { itemId, quantity } = item;

      // find inventory item
      const inventoryItem = await Inventory.findOne({ itemId });

      if (!inventoryItem) continue;

      // get latest purchase price
      const latestPurchase =
        inventoryItem.purchases[inventoryItem.purchases.length - 1];

      const latestPrice = latestPurchase
        ? latestPurchase.price
        : inventoryItem.priceOfStock;

      const latestQuantity = latestPurchase
        ? latestPurchase.quantity
        : inventoryItem.quantityInStock;

      // update inventory
      await Inventory.findOneAndUpdate(
        { itemId },
        {
          $inc: {
            quantityInStock: quantity,
            priceOfStock: latestPrice/latestQuantity * (quantity)
          }
        },
        { new: true }
      );
    }

    // now delete bill
    await Bill.deleteOne({ billId });

    return res.status(200).json({
      status: "success",
      message: "Bill deleted and inventory restored successfully"
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: "error",
      message: error.message
    });
  }
});

router.get("/getBill/:billId", async (req, res) => {
  try {
    const bill = await Bill.findOne({ billId: req.params.billId });

    if (!bill) {
      return res.status(404).json({ message: "Bill not found" });
    }

    res.json(bill);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
