const hotelRoutes = require("./hotels");
const bookingRoutes = require("./bookings");
const adminRoutes = require("./admin");

const routes = (app) => {
  
  app.use("/api/hotels", hotelRoutes);
  app.use("/api/bookings", bookingRoutes);
  app.use("/api/admin", adminRoutes);
};

module.exports = routes;
