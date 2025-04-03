const verifyToken = require("../../middleware/auth");
const { Hotel, Booking } = require("../../models/hotel");
const express = require("express");
const router = express.Router();
const { body, validationResult, param } = require("express-validator");
const {
  addBooking,
  getBookings,
  getBookingById,
} = require("../../controllers/bookings");

// ✅ Get all bookings (with optional pagination)
router.get("/", getBookings);

// ✅ Get a single booking by ID
router.get(
  "/:id",
  [param("id").notEmpty().withMessage("Booking ID is required")],
  getBookingById
);

// /api/my-bookings
// router.get("/", verifyToken, async (req, res) => {
//   try {
//     const hotels = await Hotel.find({
//       bookings: { $elemMatch: { userId: req.userId } },
//     });

//     const results = hotels.map((hotel) => {
//       const userBookings = hotel.bookings.filter(
//         (booking) => booking.userId === req.userId
//       );

//       return {
//         ...hotel.toObject(),
//         bookings: userBookings,
//       };
//     });

//     res.status(200).send(results);
//   } catch (error) {
//     console.log(error);
//     res.status(500).json({ message: "Unable to fetch bookings" });
//   }
// });

router.post(
  "/add-booking",
  [
    body("firstName").notEmpty().withMessage("First name is required"),
    body("lastName").notEmpty().withMessage("Last name is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("checkIn")
      .notEmpty()
      .withMessage("Check-in date is required")
      .isISO8601(),
    body("checkOut")
      .notEmpty()
      .withMessage("Check-out date is required")
      .isISO8601(),
    body("userId").notEmpty().withMessage("User ID is required"),
    body("cost").isNumeric().withMessage("Cost must be a number"),
    body("destination").notEmpty().withMessage("Destination is required"),
    body("hotelId").notEmpty().withMessage("Hotel ID is required"),
    body("rooms").isInt({ min: 1 }).withMessage("Rooms must be at least 1"),
    body("guests").isInt({ min: 1 }).withMessage("Guests must be at least 1"),
    body("bookingDate")
      .notEmpty()
      .withMessage("Booking date is required")
      .isISO8601(),
    body("type").notEmpty().withMessage("Booking type is required"),
    body("promoCode").optional().isString(),
  ],
  addBooking
);

module.exports = router;

router.post(
  "/:hotelId/bookings/payment-intent",
  verifyToken,
  async (req, res) => {
    try {
      const { numberOfNights } = req.body;
      const hotelId = req.params.hotelId;

      const hotel = await Hotel.findById(hotelId);
      if (!hotel) {
        return res.status(400).json({ message: "Hotel not found" });
      }

      const totalCost = hotel.pricePerNight * numberOfNights;

      const paymentIntent = await stripe.paymentIntents.create({
        amount: totalCost * 100,
        currency: "gbp",
        metadata: { hotelId, userId: req.userId },
      });

      if (!paymentIntent.client_secret) {
        return res
          .status(500)
          .json({ message: "Error creating payment intent" });
      }

      res.send({
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        totalCost,
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Something went wrong" });
    }
  }
);

router.post("/:hotelId/bookings", verifyToken, async (req, res) => {
  try {
    const { paymentIntentId } = req.body;
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (!paymentIntent) {
      return res.status(400).json({ message: "Payment intent not found" });
    }

    if (
      paymentIntent.metadata.hotelId !== req.params.hotelId ||
      paymentIntent.metadata.userId !== req.userId
    ) {
      return res.status(400).json({ message: "Payment intent mismatch" });
    }

    if (paymentIntent.status !== "succeeded") {
      return res.status(400).json({
        message: `Payment intent not succeeded. Status: ${paymentIntent.status}`,
      });
    }

    const newBooking = { ...req.body, userId: req.userId };

    const hotel = await Hotel.findOneAndUpdate(
      { _id: req.params.hotelId },
      { $push: { bookings: newBooking } }
    );

    if (!hotel) {
      return res.status(400).json({ message: "Hotel not found" });
    }

    await hotel.save();
    res.status(200).send();
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

module.exports = router;
