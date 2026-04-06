const request = require("supertest");
const { execSync } = require("child_process");
const app = require("../app");
const pool = require("../config/db");

const randomEmail = () => `test+${Date.now()}@example.com`;

beforeAll(() => {
    execSync("npm run migrate", { stdio: "inherit" });
});

afterAll(async () => {
    await pool.end();
});

describe("Application end-to-end", () => {
    it("responds to /health", async () => {
        const response = await request(app).get("/health");
        expect(response.status).toBe(200);
        expect(response.body.status).toBe("ok");
    });

    it("responds to /test-db", async () => {
        const response = await request(app).get("/test-db");
        expect(response.status).toBe(200);
        expect(response.body.message).toBe("Database connected successfully");
        expect(response.body.time).toBeDefined();
    });

    it("registers and logs in a new user", async () => {
        const email = randomEmail();
        const password = "testpassword";

        const registerResponse = await request(app)
            .post("/api/auth/register")
            .send({ name: "Test User", email, password, role: "client" });

        expect(registerResponse.status).toBe(201);
        expect(registerResponse.body.token).toBeDefined();
        expect(registerResponse.body.user.email).toBe(email);

        const loginResponse = await request(app)
            .post("/api/auth/login")
            .send({ email, password });

        expect(loginResponse.status).toBe(200);
        expect(loginResponse.body.token).toBeDefined();
        expect(loginResponse.body.user.email).toBe(email);
    });

    it("allows provider to create service, client to book, message, and review", async () => {
        // Register provider
        const providerEmail = randomEmail();
        const providerPassword = "testpassword";
        const providerRegister = await request(app)
            .post("/api/auth/register")
            .send({ name: "Provider User", email: providerEmail, password: providerPassword, role: "provider" });
        expect(providerRegister.status).toBe(201);
        const providerToken = providerRegister.body.token;

        // Register client
        const clientEmail = randomEmail();
        const clientPassword = "testpassword";
        const clientRegister = await request(app)
            .post("/api/auth/register")
            .send({ name: "Client User", email: clientEmail, password: clientPassword, role: "client" });
        expect(clientRegister.status).toBe(201);
        const clientToken = clientRegister.body.token;

        // Provider creates service
        const serviceResponse = await request(app)
            .post("/api/services")
            .set("Authorization", `Bearer ${providerToken}`)
            .send({ title: "Test Service", description: "A test service", price: 100.00, category: "Test" });
        expect(serviceResponse.status).toBe(201);
        const serviceId = serviceResponse.body.id;

        // Client books service
        const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 1 day in future
        const bookingResponse = await request(app)
            .post("/api/bookings")
            .set("Authorization", `Bearer ${clientToken}`)
            .send({ service_id: serviceId, booking_date: futureDate, notes: "Test booking" });
        expect(bookingResponse.status).toBe(201);
        const bookingId = bookingResponse.body.id;

        // Client sends message to provider
        const messageResponse = await request(app)
            .post("/api/messages")
            .set("Authorization", `Bearer ${clientToken}`)
            .send({ receiver_id: providerRegister.body.user.id, message: "Hello provider" });
        expect(messageResponse.status).toBe(201);

        // Provider updates booking status to completed
        const updateResponse = await request(app)
            .patch(`/api/bookings/${bookingId}/status`)
            .set("Authorization", `Bearer ${providerToken}`)
            .send({ status: "completed" });
        expect(updateResponse.status).toBe(200);

        // Client reviews provider
        const reviewResponse = await request(app)
            .post("/api/reviews")
            .set("Authorization", `Bearer ${clientToken}`)
            .send({ provider_id: providerRegister.body.user.id, service_id: serviceId, rating: 5, comment: "Great service!" });
        expect(reviewResponse.status).toBe(201);
    });
});
