const express = require("express");
const Hotel = require("../../models/hotel");
const verifyToken = require("../../middleware/auth");

const router = express.Router();

router.post("/changePrice", verifyToken, async (req, res) => {
  try {
    const hotelId = req.body.hotelId;
    const newPrice = req.body.newPrice;

    const hotel = await Hotel.findOneAndUpdate(
      { userId: hotelId },
      { pricePerNight: newPrice }
    );

    if (!hotel) {
      return res.status(400).json({ message: "hotel not found" });
    }

    await hotel.save();
    res.status(200).send();
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "something went wrong" });
  }
});

module.exports = router;
