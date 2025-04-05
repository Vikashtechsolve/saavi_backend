const express = require('express');
const nodemailer = require('nodemailer');
const router = express.Router();

// Middleware to parse JSON bodies
router.use(express.json());


// Function to format booking details
const formatAdminBookingDetails = (booking) => {
    return `
  Hello Team,
  
  We have received a new booking. Here are the details:
  
  Guest Information:
  - Name: ${booking.firstName} ${booking.lastName}
  - Email: ${booking.email}
  - Phone: ${booking.contactDetails.phone}
  
  Booking Details:
  - Destination: ${booking.destination}
  - Check-in Date: ${new Date(booking.checkIn).toLocaleDateString()}
  - Check-out Date: ${new Date(booking.checkOut).toLocaleDateString()}
  - Room Type: ${booking.type}
  - Number of Rooms: ${booking.rooms}
  - Number of Guests: ${booking.guests}
  - Promo Code: ${booking.promoCode}
  - Total Cost: ₹${booking.cost.toLocaleString()}
  
  Additional Information:
  - Booking Date: ${new Date(booking.bookingDate).toLocaleString()}
  - User ID: ${booking.userId}
  - Hotel ID: ${booking.hotelId}
  
  Please process this booking accordingly.
  
  Best regards,
  Your Booking System
    `;
  };

  const formatUserBookingDetails = (booking) => {
    return `
  Hello ${booking.firstName},
  
  We have received a new booking. Here are the details:
  
  Booking Details:
  - Destination: ${booking.destination}
  - Check-in Date: ${new Date(booking.checkIn).toLocaleDateString()}
  - Check-out Date: ${new Date(booking.checkOut).toLocaleDateString()}
  - Number of Rooms: ${booking.rooms}
  - Number of Guests: ${booking.guests}
  - Total Cost: ₹${booking.cost.toLocaleString()}
  
  Additional Information:
  - Booking Date: ${new Date(booking.bookingDate).toLocaleString()}
  
  We are happy to serve you.
  
  Best regards,
  Saavi Hotels
    `;
  };

// Email sending route
router.post('/', async (req, res) => {
  const  booking  = req.body;
//   if (!booking) {
//     return res.status(400).send('Missing required fields: booking');
//   }
//   console.log(process.env.SMTP_HOST);
//   console.log(process.env.SMTP_PORT);
//   console.log(process.env.SMTP_USER);
//   console.log(process.env.SMTP_PASS);
  
  try {
    // Create a transporter object using the default SMTP transport
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const adminEmailBody = formatAdminBookingDetails(booking);
    const userEmailBody = formatUserBookingDetails(booking);

    // Send mail with defined transport object
    const info = await transporter.sendMail({
      from: process.env.FROM_EMAIL,
      to:process.env.SAAVI_EMAIL,
      subject:"New Booking Confirmation",
      text:adminEmailBody,
    });

    transporter.sendMail({
        from: process.env.FROM_EMAIL,
        to:booking.email,
        subject:"Saavi Hotel Booking Confirmation",
        text:userEmailBody,
      });

    res.status(200).send(`Email sent`);
  } catch (error) {
    res.status(500).send(`Error sending email: ${error.message}`);
  }
});
  

module.exports = router;
