const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true },
  checkIn: { type: Date, required: true },
  checkOut: { type: Date, required: true },
  cost: { type: Number, required: true },
  destination: { type: String, required: true },
  hotelId: { type: String, required: true },
  rooms: { type: Number, required: true },
  guests: { type: Number, required: true },
  bookingDate: { type: Date, required: true },
  type: { type: String, required: true },
  promoCode: { type: String, required: false },
});

const ratePlanSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  code: { type: String, required: true },
  // icon: { type: String, required: false }, // You can store icon name/path if needed
  description: { type: String, required: true },
  price: { type: Number, required: true },
});

const hotelSchema = new mongoose.Schema({
  name: { type: String, required: true },
  homeDescription: { type: String, required: true },
  address: { type: String, required: false },
  city: { type: String, required: true },
  state: { type: String, required: false },
  country: { type: String, required: true },
  location: { type: String, required: false },
  description: { type: String, required: true },
  amenities: {
    type: [String],
    required:true
  },
  ratePlans: {type:[ratePlanSchema],required:true},
  type: [{ type: String, required: true }],
  rating: { type: Number, required: false },
  facilities: [{ type: String, required: true }],
  pricePerNight: { type: Number, required: true },
  homeImageUrl: [{ type: String, required: false }],
  imageUrls: [{ type: String, required: true }],
  lastUpdated: { type: Date, required: true },
});

const Hotel = mongoose.model("Hotel", hotelSchema);
const Booking = mongoose.model("Booking", bookingSchema);
module.exports = { Hotel, Booking };
