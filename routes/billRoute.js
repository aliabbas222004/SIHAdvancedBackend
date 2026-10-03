const express = require('express');
const Bill = require('../models/Bill');
const Inventory = require('../models/Inventory');
const DirectBill = require('../models/DirectBill');
const router = express.Router();

const {
  generateInvoicePDF
} = require("../utils/invoiceGenerator");

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
        HSN: item.HSN,
        itemName: item.itemName,
        initialPrice: item.initialPrice,
        finalPrice: item.finalPrice,
        quantity: item.selectedQuantity,
        gstValue: item.gstValue
      })),
      totalAmount: data.totalPrice,
      createdAt: data.billDate ? new Date(data.billDate) : undefined,
      paymentMode: data.paymentMode,
      freightCharge_packaging: data.freightCharge_packaging ? Number(data.freightCharge_packaging) : 0
    });

    await newBill.save();

    await generateInvoicePDF(
      res,
      newBill,
      data
    );

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
            priceOfStock: latestPrice / latestQuantity * (quantity)
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
    const bill = await Bill.findOne({
      billId: req.params.billId
    });

    if (!bill) {
      return res.status(404).json({
        status: "error",
        message: "Bill not found"
      });
    }

    // Recreate the same `data` structure
    // that was originally sent to /addBill
    const data = {
      billId: bill.billId,
      billDate: bill.createdAt,

      custName: bill.customerName,
      phoneno: bill.customerPhone,
      custAdd: bill.billAddress,
      custState: bill.customerState,
      custGSTIN: bill.customerGST,

      shipcustName: bill.shipCustName,
      shipcustPhone: bill.shipCustPhone,
      shipAdd: bill.shippingAddress,
      shipbillState: bill.shipCustState,
      shipcustGST: bill.shipCustGST,

      tableData: bill.items.map(item => ({
        itemId: item.itemId,
        HSN: item.HSN,
        itemName: item.itemName,
        initialPrice: item.initialPrice,
        finalPrice: item.finalPrice,
        selectedQuantity: item.quantity,
        gstValue: item.gstValue
      })),

      totalQuantity: bill.items.reduce(
        (sum, item) => sum + item.quantity,
        0
      ),

      totalPrice: bill.totalAmount,

      paymentMode: bill.paymentMode,

      freightCharge_packaging:
        bill.freightCharge_packaging
          ? Number(bill.freightCharge_packaging)
          : 0
    };

    console.log("Regenerated Bill Data:", data);

    // Same logic as /addBill
    await generateInvoicePDF(
      res,
      bill,
      data
    );

  } catch (err) {
    console.error("Get Bill PDF Error:", err);

    if (!res.headersSent) {
      res.status(500).json({
        status: "error",
        message: err.message
      });
    }
  }
});



// router.get("/preview", async (req, res) => {
//   try {
//     const mockData = {
//       billId: "INV-1001",
//       custName: "ABC Interiors",
//       phoneno: "9876543210",
//       custAdd: "Vadodara, GujaratVadodara, GujaratVadodara, GujaratVadodara, GujaratVadodara, Gujarat",
//       custState: "Gujarat",
//       custGSTIN: "24ABCDE1234F1Z5",

//       shipcustName: "ABC Interiors",
//       shipcustPhone: "9876543210",
//       shipbillState: "Gujarat",
//       shipcustGST: "24ABCDE1234F1Z5",
//       shipAdd: "Vadodara, GujaratVadodara, GujaratVadodara, GujaratVadodara, GujaratVadodara, Gujarat",

//       billDate: new Date(),

//       paymentMode: "Cash",

//       freightCharge_packaging: 250,

//       tableData: [
//         {
//           itemId: "ITEM001",
//           HSN: "4411",
//           itemName: "Premium Laminate Sheet",
//           initialPrice: 1200,
//           finalPrice: 1500,
//           selectedQuantity: 2,
//           gstValue: 18
//         },
//         {
//           itemId: "ITEM002",
//           HSN: "39250",
//           itemName: "Charcoal Louvers",
//           initialPrice: 800,
//           finalPrice: 950,
//           selectedQuantity: 3,
//           gstValue: 18
//         },
//         {
//           itemId: "ITEM003",
//           HSN: "44129",
//           itemName: "Commercial Plywood",
//           initialPrice: 1800,
//           finalPrice: 2100,
//           selectedQuantity: 1,
//           gstValue: 18
//         },
//         {
//           itemId: "ITEM003",
//           HSN: "44128",
//           itemName: "Commercial Plywood",
//           initialPrice: 1800,
//           finalPrice: 2100,
//           selectedQuantity: 1,
//           gstValue: 18
//         },
//         {
//           itemId: "ITEM003",
//           HSN: "44125",
//           itemName: "Commercial Plywood",
//           initialPrice: 1800,
//           finalPrice: 2100,
//           selectedQuantity: 1,
//           gstValue: 18
//         },
//         {
//           itemId: "ITEM003",
//           HSN: "44124",
//           itemName: "Commercial Plywood",
//           initialPrice: 1800,
//           finalPrice: 2100,
//           selectedQuantity: 1,
//           gstValue: 18
//         },
//         {
//           itemId: "ITEM003",
//           HSN: "44129",
//           itemName: "Commercial Plywood",
//           initialPrice: 1800,
//           finalPrice: 2100,
//           selectedQuantity: 1,
//           gstValue: 18
//         },
//         {
//           itemId: "ITEM003",
//           HSN: "44133",
//           itemName: "Commercial Plywood",
//           initialPrice: 1800,
//           finalPrice: 2100,
//           selectedQuantity: 1,
//           gstValue: 18
//         }

//       ]
//   };

//   // Create a temporary bill-like object
//   const bill = {
//     billId: mockData.billId,
//     customerName: mockData.custName,
//     customerPhone: mockData.phoneno,
//     billAddress: mockData.custAdd,
//     customerState: mockData.custState,
//     customerGST: mockData.custGSTIN,

//     shipCustName: mockData.shipcustName,
//     shipCustPhone: mockData.shipcustPhone,
//     shipCustState: mockData.shipbillState,
//     shipCustGST: mockData.shipcustGST,

//     items: mockData.tableData.map(item => ({
//       itemId: item.itemId,
//       HSN: item.HSN,
//       itemName: item.itemName,
//       initialPrice: item.initialPrice,
//       finalPrice: item.finalPrice,
//       quantity: item.selectedQuantity,
//       gstValue: item.gstValue
//     })),

//     totalAmount: mockData.tableData.reduce(
//       (sum, item) =>
//         sum + item.finalPrice * item.selectedQuantity,
//       0
//     ) + Number(mockData.freightCharge_packaging),

//     createdAt: mockData.billDate,

//     paymentMode: mockData.paymentMode,

//     freightCharge_packaging:
//       Number(mockData.freightCharge_packaging)
//   };

//   // IMPORTANT:
//   // This calls your existing PDF generator
//   await generateInvoicePDF(res, bill, mockData);

// } catch (err) {
//   console.error("Preview PDF error:", err);

//   if (!res.headersSent) {
//     res.status(500).json({
//       message: "Failed to generate preview PDF",
//       error: err.message
//     });
//   }
// }
// });

module.exports = router;