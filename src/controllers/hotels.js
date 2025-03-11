const { Hotel } = require("../models/hotel");
const { validationResult } = require("express-validator");
const cloudinary = require("cloudinary").v2;
const { ObjectId } = require("mongodb");

const uploadImages = async (imageFiles) => {
  if (!imageFiles || imageFiles.length === 0) {
    return []; // Return empty array if no files
  }

  const uploadPromises = imageFiles.map(async (image) => {
    if (!image || !image.buffer) {
      throw new Error("Invalid image file");
    }
    const b64 = Buffer.from(image.buffer).toString("base64");
    let dataURI = `data:${image.mimetype};base64,${b64}`;
    const res = await cloudinary.uploader.upload(dataURI);
    return res.url;
  });

  return await Promise.all(uploadPromises);
};

// Controller for adding a new hotel
exports.addHotel = async (req, res) => {
  // Validate request
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const imageFiles = req.files ? req.files["imageFiles"] || [] : [];
    const homeImageFile = req.files ? req.files["homeImageUrl"] : null;
    const newHotel = req.body;

    // Upload images
    const imageUrls = await uploadImages(imageFiles);

    const homeImageUrl = await uploadImages(homeImageFile);

    newHotel.homeImageUrl = homeImageUrl[0];
    newHotel.imageUrls = imageUrls;
    newHotel.lastUpdated = new Date();

    // Save hotel
    const hotel = new Hotel(newHotel);
    await hotel.save();

    res.status(201).send(hotel);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

exports.updateHotel = async (req, res) => {
  // Validate request
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const hotelId = req.params.id;
    let updatedFields = {};
    if (!ObjectId.isValid(hotelId)) {
      return res.status(400).json({ message: "Invalid Hotel ID format" });
    }
    // Dynamically update only provided fields
    Object.keys(req.body).forEach((key) => {
      if (req.body[key]) {
        updatedFields[key] = req.body[key];
      }
    });
    const objectId = new ObjectId(hotelId);
    // Convert `facilities` from string to array if necessary
    if (
      updatedFields.facilities &&
      typeof updatedFields.facilities === "string"
    ) {
      updatedFields.facilities = updatedFields.facilities
        .split(",")
        .map((item) => item.trim());
    }

    // Find the existing hotel by _id or hotelId
    let existingHotel;
    try {
      existingHotel = await Hotel.findOne({ _id: objectId });
    } catch (error) {
      console.log(error);
    }

    // Assign imageUrls from frontend if provided

    if (req.body.imageUrls) {
      updatedFields.imageUrls = req.body.imageUrls;
    }

    // Set lastUpdated timestamp
    updatedFields.lastUpdated = new Date();

    // Update by the same field we found it with (_id or hotelId)
    const queryField = "_id";
    const hotel = await Hotel.findOneAndUpdate(
      { [queryField]: objectId },
      { $set: updatedFields },
      { new: true }
    );

    if (!hotel) {
      return res.status(404).json({ message: "Hotel not found" });
    }

    res.status(200).json(hotel);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

exports.deleteHotel = async (req, res) => {
  try {
    const hotelId = req.params.id;

    // Validate if the ID is a valid ObjectId format
    if (!ObjectId.isValid(hotelId)) {
      return res.status(400).json({ message: "Invalid Hotel ID format" });
    }

    const objectId = new ObjectId(hotelId);

    // Delete the hotel
    const result = await Hotel.findOneAndDelete({ _id: objectId });

    if (!result) {
      return res.status(404).json({ message: "Hotel not found" });
    }

    res.status(200).json({ message: "Hotel deleted successfully" });
  } catch (error) {
    console.error("Error deleting hotel:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
};
