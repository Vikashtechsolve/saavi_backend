const mongoose = require("mongoose");

const contactDetailsSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName:  { type: String, required: true },
  email:     { type: String, required: true },
  phone:     { type: String, required: true },
}, { _id: false });

const bookingSchema = new mongoose.Schema({
  firstName:    { type: String, required: true },
  lastName:     { type: String, required: true },
  email:        { type: String, required: true },
  checkIn:      { type: Date, required: true },
  checkOut:     { type: Date, required: true },
  cost:         { type: Number, required: true },
  destination:  { type: String, required: true },
  hotelId:      { type: String, required: true },
  rooms:        { type: Number, required: true },
  guests:       { type: Number, required: true },
  bookingDate:  { type: Date, required: true },
  type:         { type: String, required: true },
  promoCode:    { type: String, required: false },
  contactDetails: { type: contactDetailsSchema, required: true }
});

const ratePlanSchema = new mongoose.Schema({
  id: { type: String, required: false },
  name: { type: String, required: false },
  price: { type: Number, required: false }
});

const roomSchema = new mongoose.Schema({
  type: { type: String, required: false },           // "Standard Room", "Deluxe Room", etc.
  description: { type: String, required: false },
  minPrice: { type: Number, required: false },
  plans: [ratePlanSchema]                            // Array of rate plans (EP, CP, MAP)
});


const hotelSchema = new mongoose.Schema({
  name: { type: String, required: false },
  homeDescription: { type: String, required: false },
  address: { type: String, required: false },
  city: { type: String, required: false },
  state: { type: String, required: false },
  country: { type: String, required: false },
  location: { type: String, required: false },
  description: { type: String, required: false },
  amenities: {
    type: [String],
    required:false
  },
  rooms: {type:[roomSchema],required:false},
  type: [{ type: String, required: false }],
  rating: { type: Number, required: false },
  facilities: [{ type: String, required: false }],
  pricePerNight: { type: Number, required: false },
  homeImageUrl: [{ type: String, required: false }],
  imageUrls: [{ type: String, required: false }],
  lastUpdated: { type: Date, required: false },
});

const Hotel = mongoose.model("Hotel", hotelSchema);
const Booking = mongoose.model("Booking", bookingSchema);
module.exports = { Hotel, Booking };
