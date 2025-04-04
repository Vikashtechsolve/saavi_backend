const { validationResult } = require("express-validator");
const { Booking, Hotel } = require("../../models/hotel");
const { ObjectId } = require("mongodb");
const { default: mongoose } = require("mongoose");

exports.getBookings = async (req, res) => {
  try {
    let limit = parseInt(req.query.limit) || 10; // Default limit = 10
    let page = parseInt(req.query.page) || 1; // Default page = 1
    let skip = (page - 1) * limit;

    if (limit <= 0) limit = 10;
    if (page <= 0) page = 1;

    const bookings = await Booking.find().limit(limit).skip(skip).lean();
    const totalCount = await Booking.countDocuments();

    res.json({
      totalBookings: totalCount,
      page,
      limit,
      data: bookings,
    });
  } catch (error) {
    console.error("Error fetching bookings:", error);
    res.status(500).json({ message: "Error fetching bookings" });
  }
};

// ✅ Get a single booking by ID
exports.getBookingById = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const bookingId = req.params.id;

  if (!mongoose.Types.ObjectId.isValid(bookingId)) {
    return res.status(400).json({ message: "Invalid Booking ID format" });
  }

  try {
    const booking = await Booking.findById(bookingId).lean();

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    const hotel = await Hotel.findById(booking.hotelId).lean();

    const hotelName = hotel?.name || "Unknown Hotel";

    // Add hotelName to response
    const response = {
      ...booking,
      hotelName,
    };

    return res.json(response);
  } catch (error) {
    console.error("Error fetching booking:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.addBooking = async (req, res) => {
  // Validate request
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const newBooking = req.body;
    console.log("testttinnggggggggggggggggggggggggg");
    newBooking.bookingDate = new Date(newBooking.bookingDate); // Ensure date format

    // const booking = new Booking(newBooking);
    // await booking.save();

    res.status(201).json({ message: "Booking successful", booking });
  } catch (error) {
    console.error("Booking error:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
};
