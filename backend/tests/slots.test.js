const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const Slot = require('../models/Slot');
const User = require('../models/User');

describe('Slot Management Endpoints', () => {
  let adminToken;
  let patientToken;
  let adminUser;
  let patientUser;

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

  describe('POST /api/slots/generate', () => {
    it('should generate slots for specified number of days (admin only)', async () => {
      const response = await request(app)
        .post('/api/slots/generate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ days: 3 })
        .expect(201);

      expect(response.body.message).toBe('Slots generated successfully');
      expect(response.body.data.totalSlots).toBeGreaterThan(0);
      expect(response.body.data.daysGenerated).toBe(3);
    });

    it('should fail for non-admin users', async () => {
      const response = await request(app)
        .post('/api/slots/generate')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({ days: 3 })
        .expect(403);

      expect(response.body.error).toBeDefined();
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .post('/api/slots/generate')
        .send({ days: 3 })
        .expect(401);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('GET /api/slots', () => {
    beforeEach(async () => {
      // Generate some test slots
      await request(app)
        .post('/api/slots/generate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ days: 2 });
    });

    it('should get available slots for date range', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const fromDate = tomorrow.toISOString().split('T')[0];
      
      const dayAfterTomorrow = new Date();
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
      const toDate = dayAfterTomorrow.toISOString().split('T')[0];

      const response = await request(app)
        .get(`/api/slots?from=${fromDate}&to=${toDate}`)
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(200);

      expect(response.body.data).toHaveProperty('slots');
      expect(response.body.data.totalSlots).toBeGreaterThan(0);
    });

    it('should fail without date parameters', async () => {
      const response = await request(app)
        .get('/api/slots')
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(400);

      expect(response.body.error.code).toBe('MISSING_DATES');
    });

    it('should fail with invalid date format', async () => {
      const response = await request(app)
        .get('/api/slots?from=invalid-date&to=invalid-date')
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(400);

      expect(response.body.error.code).toBe('INVALID_DATE_FORMAT');
    });
  });

  describe('GET /api/slots/all', () => {
    beforeEach(async () => {
      // Generate some test slots
      await request(app)
        .post('/api/slots/generate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ days: 2 });
    });

    it('should get all slots including booked ones (admin only)', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const fromDate = tomorrow.toISOString().split('T')[0];
      
      const dayAfterTomorrow = new Date();
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
      const toDate = dayAfterTomorrow.toISOString().split('T')[0];

      const response = await request(app)
        .get(`/api/slots/all?from=${fromDate}&to=${toDate}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data).toHaveProperty('slots');
      expect(response.body.data.totalSlots).toBeGreaterThan(0);
    });

    it('should fail for non-admin users', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const fromDate = tomorrow.toISOString().split('T')[0];
      
      const dayAfterTomorrow = new Date();
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
      const toDate = dayAfterTomorrow.toISOString().split('T')[0];

      const response = await request(app)
        .get(`/api/slots/all?from=${fromDate}&to=${toDate}`)
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(403);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('POST /api/slots', () => {
    it('should add a single slot (admin only)', async () => {
      const slotData = {
        startAt: '2025-08-25T09:00:00.000Z',
        endAt: '2025-08-25T09:30:00.000Z'
      };

      const response = await request(app)
        .post('/api/slots')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(slotData)
        .expect(201);

      expect(response.body.message).toBe('Slot added successfully');
      expect(response.body.data.slot).toHaveProperty('id');
      expect(response.body.data.slot.startAt).toBe(slotData.startAt);
    });

    it('should fail for non-admin users', async () => {
      const slotData = {
        startAt: '2025-08-25T09:00:00.000Z',
        endAt: '2025-08-25T09:30:00.000Z'
      };

      const response = await request(app)
        .post('/api/slots')
        .set('Authorization', `Bearer ${patientToken}`)
        .send(slotData)
        .expect(403);

      expect(response.body.error).toBeDefined();
    });

    it('should fail with invalid slot data', async () => {
      const slotData = {
        startAt: 'invalid-date',
        endAt: '2025-08-25T09:30:00.000Z'
      };

      const response = await request(app)
        .post('/api/slots')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(slotData)
        .expect(400);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('DELETE /api/slots/:id', () => {
    let slotId;

    beforeEach(async () => {
      // Create a test slot
      const slot = await Slot.create({
        startAt: new Date('2025-08-25T09:00:00.000Z'),
        endAt: new Date('2025-08-25T09:30:00.000Z'),
        durationMinutes: 30,
        isBooked: false
      });
      slotId = slot._id;
    });

    it('should remove a slot (admin only)', async () => {
      const response = await request(app)
        .delete(`/api/slots/${slotId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.message).toBe('Slot removed successfully');
    });

    it('should fail for non-admin users', async () => {
      const response = await request(app)
        .delete(`/api/slots/${slotId}`)
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(403);

      expect(response.body.error).toBeDefined();
    });

    it('should fail with invalid slot ID', async () => {
      const response = await request(app)
        .delete('/api/slots/invalid-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      expect(response.body.error).toBeDefined();
    });
  });
});
