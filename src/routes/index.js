const hotelRoutes = require("./hotels");
const bookingRoutes = require("./bookings");
const adminRoutes = require("./admin");
const emailerRoutes = require("./emailer");

const routes = (app) => {
  
  app.use("/api/hotels", hotelRoutes);
  app.use("/api/bookings", bookingRoutes);
  app.use("/api/admin", adminRoutes);
  app.use("/api/send-email",emailerRoutes);
};

module.exports = routes;
