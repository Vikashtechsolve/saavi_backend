const { param, validationResult } = require("express-validator");
const Stripe = require("stripe");
const verifyToken = require("../../middleware/auth");
const express = require("express");
const multer = require("multer");
const cloudinary = require("cloudinary");
const { Hotel } = require("../../models/hotel");
const { ObjectId } = require("mongodb");
const { body } = require("express-validator");
const {
  addHotel,
  updateHotel,
  deleteHotel,
} = require("../../controllers/hotels");
const { formatResponse } = require("../../utils/formatResponse");
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024,
  }, // 100MB
});
const stripe = new Stripe(process.env.STRIPE_API_KEY);

const router = express.Router();

router.get("/search", async (req, res) => {
  try {
    const query = constructSearchQuery(req.query);

    let sortOptions = {};
    switch (req.query.sortOption) {
      case "starRating":
        sortOptions = { starRating: -1 };
        break;
      case "pricePerNightAsc":
        sortOptions = { pricePerNight: 1 };
        break;
      case "pricePerNightDesc":
        sortOptions = { pricePerNight: -1 };
        break;
    }

    const pageSize = 5;
    const pageNumber = parseInt(
      req.query.page ? req.query.page.toString() : "1"
    );
    const skip = (pageNumber - 1) * pageSize;

    const hotels = await Hotel.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(pageSize);
    const total = await Hotel.countDocuments(query);

    const response = {
      data: hotels,
      pagination: {
        total,
        page: pageNumber,
        pages: Math.ceil(total / pageSize),
      },
    };

    res.json(response);
  } catch (error) {
    console.log("error", error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

router.get("/", async (req, res) => {
  try {
    let limit = parseInt(req.query.limit);

    if (isNaN(limit) || limit <= 0) {
      limit = 0;
    }
    const hotels = await Hotel.find().limit(limit);
    res.json(formatResponse(hotels));
  } catch (error) {
    console.error("Error fetching hotels:", error);
    res.status(500).json({ message: "Error fetching hotels" });
  }
});

router.get(
  "/:id",
  [param("id").notEmpty().withMessage("Hotel ID is required")],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const hotelId = req.params.id;
    const objectId = new ObjectId(hotelId);
    try {
      const hotel = await Hotel.findById(objectId);
      res.json(hotel);
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Error fetching hotel" });
    }
  }
);

const constructSearchQuery = (queryParams) => {
  let constructedQuery = {};

  if (queryParams.destination) {
    constructedQuery.$or = [
      { city: new RegExp(queryParams.destination, "i") },
      { country: new RegExp(queryParams.destination, "i") },
    ];
  }

  if (queryParams.adultCount) {
    constructedQuery.adultCount = { $gte: parseInt(queryParams.adultCount) };
  }

  if (queryParams.childCount) {
    constructedQuery.childCount = { $gte: parseInt(queryParams.childCount) };
  }

  if (queryParams.facilities) {
    constructedQuery.facilities = {
      $all: Array.isArray(queryParams.facilities)
        ? queryParams.facilities
        : [queryParams.facilities],
    };
  }

  if (queryParams.types) {
    constructedQuery.type = {
      $in: Array.isArray(queryParams.types)
        ? queryParams.types
        : [queryParams.types],
    };
  }

  if (queryParams.stars) {
    const starRatings = Array.isArray(queryParams.stars)
      ? queryParams.stars.map((star) => parseInt(star))
      : parseInt(queryParams.stars);
    constructedQuery.starRating = { $in: starRatings };
  }

  if (queryParams.maxPrice) {
    constructedQuery.pricePerNight = { $lte: parseInt(queryParams.maxPrice) };
  }

  return constructedQuery;
};

router.post(
  "/add-hotel",
  upload.fields([
    { name: "imageFiles", maxCount: 6 },
    { name: "homeImageUrl", maxCount: 1 }, // ✅ Ensure correct handling of homeImageUrl
  ]),
  [
    body("name").notEmpty().withMessage("Name is required"),
    body("address").notEmpty().withMessage("Address is required"), // ✅ Added
    body("city").notEmpty().withMessage("City is required"),
    body("state").notEmpty().withMessage("State is required"), // ✅ Added
    body("location").notEmpty().withMessage("Location is required"), // ✅ Added
    body("country").notEmpty().withMessage("Country is required"),
    body("description").notEmpty().withMessage("Description is required"),
    body("type")
      .notEmpty()
      .withMessage("Hotel type is required")
      .custom((value, { req }) => {
        if (typeof value === "string") {
          try {
            // Convert comma-separated string to an array
            req.body.type = value.split(",").map((item) => item.trim());
          } catch (error) {
            throw new Error("Invalid type format");
          }
        }

        // Ensure it's now an array and meets validation criteria
        if (
          !Array.isArray(req.body.type) ||
          req.body.type.length === 0 ||
          !req.body.type.every(
            (item) => typeof item === "string" && item.trim().length > 0
          )
        ) {
          throw new Error("Each type must be a non-empty string");
        }

        return true;
      }),

    body("rating")
      .notEmpty()

      .withMessage("Rating must be a string")
      .custom((value, { req }) => {
        req.body.rating = Number(value);
        return true;
      }), // ✅ Added
    body("pricePerNight")
      .notEmpty()
      .isNumeric()
      .withMessage("Price per night is required and must be a number"),
    body("facilities")
      .notEmpty()
      .withMessage("Facilities are required")
      .custom((value, { req }) => {
        if (typeof value === "string") {
          try {
            // Convert comma-separated string to an array
            req.body.facilities = value.split(",").map((item) => item.trim());
          } catch (error) {
            throw new Error("Invalid facilities format");
          }
        }

        // Ensure it's now an array and meets validation criteria
        if (
          !Array.isArray(req.body.facilities) ||
          req.body.facilities.length === 0 ||
          !req.body.facilities.every(
            (item) => typeof item === "string" && item.trim().length > 0
          )
        ) {
          throw new Error("Each facility must be a non-empty string");
        }

        return true;
      }),
  ],
  addHotel
);

router.put(
  "/update-hotel/:id",
  // verifyToken,
  upload.array("imageFiles", 6),
  [
    body("name").optional().notEmpty().withMessage("Name cannot be empty"),
    body("address")
      .optional()
      .notEmpty()
      .withMessage("Address cannot be empty"),
    body("city").optional().notEmpty().withMessage("City cannot be empty"),
    body("state").optional().notEmpty().withMessage("State cannot be empty"),
    body("location")
      .optional()
      .notEmpty()
      .withMessage("Location cannot be empty"),
    body("country")
      .optional()
      .notEmpty()
      .withMessage("Country cannot be empty"),
    body("description")
      .optional()
      .notEmpty()
      .withMessage("Description cannot be empty"),
    body("type")
      .optional()
      .notEmpty()
      .withMessage("Hotel type cannot be empty"),
    body("rating")
      .optional()
      .isNumeric()
      .withMessage("Rating must be a number"),
    body("pricePerNight")
      .optional()
      .isNumeric()
      .withMessage("Price per night must be a number"),
    body("facilities")
      .optional()
      .custom((value, { req }) => {
        if (typeof value === "string") {
          req.body.facilities = value.split(",").map((item) => item.trim());
        }
        if (
          !Array.isArray(req.body.facilities) ||
          !req.body.facilities.every(
            (item) => typeof item === "string" && item.trim().length > 0
          )
        ) {
          throw new Error("Each facility must be a non-empty string");
        }
        return true;
      }),
  ],
  updateHotel
);

router.delete(
  "/:id",
  // verifyToken,
  [param("id").notEmpty().withMessage("Hotel ID is required")],
  deleteHotel
);

// router.get("/", verifyToken, async (req, res) => {
//   try {
//     const hotels = await Hotel.find({ userId: req.userId });
//     res.json(hotels);
//   } catch (error) {
//     res.status(500).json({ message: "Error fetching hotels" });
//   }
// });

// router.get("/:id", verifyToken, async (req, res) => {
//   try {
//     let hotel =
//       (await Hotel.findOne({ _id: req.params.id, userId: req.userId })) ||
//       (await Hotel.findOne({ hotelId: req.params.id, userId: req.userId }));
//     if (!hotel) {
//       return res.status(404).json({ message: "Hotel not found" });
//     }
//     res.json(hotel);
//   } catch (error) {
//     res.status(500).json({ message: "Error fetching hotel" });
//   }
// });

// async function uploadImages(imageFiles) {
//   const uploadPromises = imageFiles.map(async (image) => {
//     const b64 = Buffer.from(image.buffer).toString("base64");
//     const dataURI = "data:" + image.mimetype + ";base64," + b64;
//     const res = await cloudinary.v2.uploader.upload(dataURI);
//     return res.url;
//   });
//   return await Promise.all(uploadPromises);
// }

module.exports = router;
