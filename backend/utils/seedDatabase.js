const User = require('../models/User');
const Slot = require('../models/Slot');

const seedDatabase = async () => {
  try {
    console.log('Seeding database...');

    // Check if admin user already exists
    const existingAdmin = await User.findOne({ email: 'admin@example.com' });
    if (!existingAdmin) {
      // Create admin user
      const adminUser = new User({
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'Passw0rd!',
        role: 'admin'
      });
      await adminUser.save();
      console.log('Admin user created: admin@example.com / Passw0rd!');
    }

    // Check if patient user already exists
    const existingPatient = await User.findOne({ email: 'patient@example.com' });
    if (!existingPatient) {
      // Create patient user
      const patientUser = new User({
        name: 'Test Patient',
        email: 'patient@example.com',
        password: 'Passw0rd!',
        role: 'patient'
      });
      await patientUser.save();
      console.log('Patient user created: patient@example.com / Passw0rd!');
    }

    // Check if slots already exist
    const existingSlots = await Slot.countDocuments();
    if (existingSlots === 0) {
      // Generate slots for the next 7 days
      const slots = [];
      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0, 0); // 9 AM

      for (let day = 0; day < 7; day++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + day);

        // Skip weekends (Saturday = 6, Sunday = 0)
        if (currentDate.getDay() === 0 || currentDate.getDay() === 6) {
          continue;
        }

        // Generate 30-minute slots from 9 AM to 5 PM
        for (let hour = 9; hour < 17; hour++) {
          for (let minute = 0; minute < 60; minute += 30) {
            const slotStart = new Date(currentDate);
            slotStart.setHours(hour, minute, 0, 0);

            const slotEnd = new Date(slotStart);
            slotEnd.setMinutes(slotEnd.getMinutes() + 30);

            slots.push({
              startAt: slotStart,
              endAt: slotEnd,
              isBooked: false
            });
          }
        }
      }

      if (slots.length > 0) {
        await Slot.insertMany(slots);
        console.log(`${slots.length} slots generated for the next 7 days`);
      }
    }

    console.log('Database seeding completed successfully!');
  } catch (error) {
    console.error('Database seeding error:', error);
  }
};

module.exports = { seedDatabase };
