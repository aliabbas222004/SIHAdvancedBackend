const express = require('express');
const router = express.Router();
const Transport = require('../models/Transport');


router.post('/add', async (req, res) => {
    try {
        const b = req.body;
        const transport = new Transport({
            val: b.val,
            date: b.date ? b.date : Date.now()
        });
        await transport.save();
        res.json(transport);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


router.get('/getAll', async (req, res) => {
    try {
        const { month, year } = req.query;
        if (!month || !year)
            return res.status(400).json({ error: "Month and year are required" });

        const startDate = new Date(`${year}-${month}-01`);
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + 1);

        const transports = await Transport.find({
            date: { $gte: startDate, $lt: endDate },
        });

        res.json(transports);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/monthly-transport', async (req, res) => {
    try {
        const { month, year } = req.query;

        if (!month || !year) {
            return res.status(400).json({ message: 'Month and year are required' });
        }

        const monthNum = parseInt(month, 10);
        const yearNum = parseInt(year, 10);

        if (isNaN(monthNum) || isNaN(yearNum) || monthNum < 1 || monthNum > 12) {
            return res.status(400).json({ message: 'Invalid month or year format' });
        }

        const startDate = new Date(yearNum, monthNum - 1, 1);
        const endDate = new Date(yearNum, monthNum, 1);

        const result = await Transport.aggregate([
            {
                $match: {
                    date: { $gte: startDate, $lt: endDate },
                },
            },
            {
                $group: {
                    _id: null,
                    totalTransportCost: { $sum: "$val" },
                },
            },
        ]);

        const total = result.length > 0 ? result[0].totalTransportCost : 0;

        res.json({ totalTransportCost: total });
    } catch (err) {
        console.error("Error in /monthly-transport:", err);
        res.status(500).json({ error: err.message });
    }
});





module.exports = router;