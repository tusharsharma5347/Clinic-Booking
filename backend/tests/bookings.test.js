const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const Slot = require('../models/Slot');
const User = require('../models/User');
const Booking = require('../models/Booking');

describe('Booking Management Endpoints', () => {
  let adminToken;
  let patientToken;
  let adminUser;
  let patientUser;
  let testSlot;

  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/test-appointment-booking');
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clear data before each test
    await Slot.deleteMany({});
    await User.deleteMany({});
    await Booking.deleteMany({});

    // Create admin user
    adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@test.com',
      password: 'AdminPass123!',
      role: 'admin'
    });

    // Create patient user
    patientUser = await User.create({
      name: 'Patient User',
      email: 'patient@test.com',
      password: 'PatientPass123!',
      role: 'patient'
    });

    // Create a test slot
    testSlot = await Slot.create({
      startAt: new Date('2025-08-25T09:00:00.000Z'),
      endAt: new Date('2025-08-25T09:30:00.000Z'),
      durationMinutes: 30,
      isBooked: false
    });

    // Login admin
    const adminLoginResponse = await request(app)
      .post('/api/login')
      .send({
        email: 'admin@test.com',
        password: 'AdminPass123!'
      });
    adminToken = adminLoginResponse.body.data.token;

    // Login patient
    const patientLoginResponse = await request(app)
      .post('/api/login')
      .send({
        email: 'patient@test.com',
        password: 'PatientPass123!'
      });
    patientToken = patientLoginResponse.body.data.token;
  });

  describe('POST /api/book', () => {
    it('should book a slot successfully', async () => {
      const response = await request(app)
        .post('/api/book')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({ slotId: testSlot._id })
        .expect(201);

      expect(response.body.message).toBe('Booking created successfully');
      expect(response.body.data.booking).toHaveProperty('id');
      expect(response.body.data.booking.slotId).toBe(testSlot._id.toString());
      expect(response.body.data.booking.userId).toBe(patientUser._id.toString());
      expect(response.body.data.booking.status).toBe('confirmed');
    });

    it('should fail to book already booked slot', async () => {
      // Book the slot first
      await request(app)
        .post('/api/book')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({ slotId: testSlot._id });

      // Try to book the same slot again
      const response = await request(app)
        .post('/api/book')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({ slotId: testSlot._id })
        .expect(409);

      expect(response.body.error.code).toBe('SLOT_ALREADY_BOOKED');
    });

    it('should fail without slotId', async () => {
      const response = await request(app)
        .post('/api/book')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({})
        .expect(400);

      expect(response.body.error.code).toBe('MISSING_SLOT_ID');
    });

    it('should fail with invalid slotId', async () => {
      const response = await request(app)
        .post('/api/book')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({ slotId: 'invalid-id' })
        .expect(400);

      expect(response.body.error.code).toBe('INVALID_SLOT_ID');
    });

    it('should fail for non-existent slot', async () => {
      const fakeSlotId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .post('/api/book')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({ slotId: fakeSlotId })
        .expect(404);

      expect(response.body.error.code).toBe('SLOT_NOT_FOUND');
    });

    it('should fail for non-patient users', async () => {
      const response = await request(app)
        .post('/api/book')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ slotId: testSlot._id })
        .expect(403);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('GET /api/my-bookings', () => {
    let bookingId;

    beforeEach(async () => {
      // Create a test booking
      const booking = await Booking.create({
        userId: patientUser._id,
        slotId: testSlot._id,
        status: 'confirmed'
      });
      bookingId = booking._id;
    });

    it('should get user bookings successfully', async () => {
      const response = await request(app)
        .get('/api/my-bookings')
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(200);

      expect(response.body.data.bookings).toHaveLength(1);
      expect(response.body.data.bookings[0].id).toBe(bookingId.toString());
      expect(response.body.data.bookings[0].slotId).toBe(testSlot._id.toString());
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/my-bookings')
        .expect(401);

      expect(response.body.error).toBeDefined();
    });

    it('should return empty array for user with no bookings', async () => {
      // Create another patient user
      const anotherPatient = await User.create({
        name: 'Another Patient',
        email: 'another@test.com',
        password: 'AnotherPass123!',
        role: 'patient'
      });

      const anotherPatientLogin = await request(app)
        .post('/api/login')
        .send({
          email: 'another@test.com',
          password: 'AnotherPass123!'
        });

      const response = await request(app)
        .get('/api/my-bookings')
        .set('Authorization', `Bearer ${anotherPatientLogin.body.data.token}`)
        .expect(200);

      expect(response.body.data.bookings).toHaveLength(0);
    });
  });

  describe('GET /api/all-bookings', () => {
    let bookingId;

    beforeEach(async () => {
      // Create a test booking
      const booking = await Booking.create({
        userId: patientUser._id,
        slotId: testSlot._id,
        status: 'confirmed'
      });
      bookingId = booking._id;
    });

    it('should get all bookings (admin only)', async () => {
      const response = await request(app)
        .get('/api/all-bookings')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.bookings).toHaveLength(1);
      expect(response.body.data.bookings[0].id).toBe(bookingId.toString());
    });

    it('should fail for non-admin users', async () => {
      const response = await request(app)
        .get('/api/all-bookings')
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(403);

      expect(response.body.error).toBeDefined();
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/all-bookings')
        .expect(401);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('PATCH /api/bookings/:id/cancel', () => {
    let bookingId;

    beforeEach(async () => {
      // Create a test booking
      const booking = await Booking.create({
        userId: patientUser._id,
        slotId: testSlot._id,
        status: 'confirmed'
      });
      bookingId = booking._id;
    });

    it('should cancel booking successfully', async () => {
      const response = await request(app)
        .patch(`/api/bookings/${bookingId}/cancel`)
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(200);

      expect(response.body.message).toBe('Booking cancelled successfully');
      expect(response.body.data.booking.status).toBe('cancelled');
    });

    it('should fail for non-owner users', async () => {
      // Create another patient user
      const anotherPatient = await User.create({
        name: 'Another Patient',
        email: 'another@test.com',
        password: 'AnotherPass123!',
        role: 'patient'
      });

      const anotherPatientLogin = await request(app)
        .post('/api/login')
        .send({
          email: 'another@test.com',
          password: 'AnotherPass123!'
        });

      const response = await request(app)
        .patch(`/api/bookings/${bookingId}/cancel`)
        .set('Authorization', `Bearer ${anotherPatientLogin.body.data.token}`)
        .expect(403);

      expect(response.body.error).toBeDefined();
    });

    it('should fail for non-existent booking', async () => {
      const fakeBookingId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .patch(`/api/bookings/${fakeBookingId}/cancel`)
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(404);

      expect(response.body.error.code).toBe('BOOKING_NOT_FOUND');
    });

    it('should fail with invalid booking ID', async () => {
      const response = await request(app)
        .patch('/api/bookings/invalid-id/cancel')
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(400);

      expect(response.body.error.code).toBe('INVALID_BOOKING_ID');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .patch(`/api/bookings/${bookingId}/cancel`)
        .expect(401);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('Booking Concurrency', () => {
    it('should prevent double booking of the same slot', async () => {
      // Create two patients
      const patient1 = await User.create({
        name: 'Patient 1',
        email: 'patient1@test.com',
        password: 'Patient1Pass123!',
        role: 'patient'
      });

      const patient2 = await User.create({
        name: 'Patient 2',
        email: 'patient2@test.com',
        password: 'Patient2Pass123!',
        role: 'patient'
      });

      // Login both patients
      const patient1Login = await request(app)
        .post('/api/login')
        .send({
          email: 'patient1@test.com',
          password: 'Patient1Pass123!'
        });

      const patient2Login = await request(app)
        .post('/api/login')
        .send({
          email: 'patient2@test.com',
          password: 'Patient2Pass123!'
        });

      // First patient books the slot
      await request(app)
        .post('/api/book')
        .set('Authorization', `Bearer ${patient1Login.body.data.token}`)
        .send({ slotId: testSlot._id })
        .expect(201);

      // Second patient tries to book the same slot
      const response = await request(app)
        .post('/api/book')
        .set('Authorization', `Bearer ${patient2Login.body.data.token}`)
        .send({ slotId: testSlot._id })
        .expect(409);

      expect(response.body.error.code).toBe('SLOT_ALREADY_BOOKED');
    });
  });
});
