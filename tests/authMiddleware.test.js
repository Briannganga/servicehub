const jwt = require("jsonwebtoken");
require("dotenv").config();
const authMiddleware = require("../config/routes/middleware/authMiddleware");

process.env.JWT_SECRET = process.env.JWT_SECRET || "testsecret";

const createMock = (data = {}) => ({
    headers: data.headers || {},
    get(header) {
        return this.headers[header];
    },
});

const createRes = () => {
    const res = {};
    res.status = jest.fn(() => res);
    res.json = jest.fn(() => res);
    return res;
};

describe("authMiddleware", () => {
    it("returns 401 when no Authorization header is present", () => {
        const req = createMock();
        const res = createRes();
        const next = jest.fn();

        authMiddleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ message: "Access denied. No token provided." });
        expect(next).not.toHaveBeenCalled();
    });

    it("returns 403 when an invalid token is supplied", () => {
        const req = createMock({ headers: { authorization: "Bearer invalidtoken" } });
        const res = createRes();
        const next = jest.fn();

        authMiddleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({ message: "Invalid or expired token." });
        expect(next).not.toHaveBeenCalled();
    });

    it("calls next when a valid token is provided", () => {
        const token = jwt.sign({ id: 1, email: "test@example.com", role: "client" }, process.env.JWT_SECRET);
        const req = createMock({ headers: { authorization: `Bearer ${token}` } });
        const res = createRes();
        const next = jest.fn();

        authMiddleware(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(req.user).toBeDefined();
        expect(req.user.email).toBe("test@example.com");
    });
});
