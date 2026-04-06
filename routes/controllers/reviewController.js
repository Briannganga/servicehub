const pool = require("../../config/db");

// POST /api/reviews - add a review for a provider
const createReview = async (req, res) => {
  const reviewer_id = req.user.id;
  const { provider_id, service_id, rating, comment } = req.body;

  if (!provider_id || !rating) {
    return res.status(400).json({ message: "provider_id and rating are required." });
  }

  if (reviewer_id === provider_id) {
    return res.status(400).json({ message: "You cannot review yourself." });
  }

  if (rating < 1 || rating > 5) {
    return res.status(400).json({ message: "Rating must be between 1 and 5." });
  }

  try {
    const providerCheck = await pool.query("SELECT id FROM users WHERE id = $1", [provider_id]);
    if (providerCheck.rows.length === 0) {
      return res.status(404).json({ message: "Provider not found." });
    }

    const serviceCheck = service_id
      ? await pool.query("SELECT id, user_id FROM services WHERE id = $1", [service_id])
      : null;
    if (service_id && serviceCheck.rows.length === 0) {
      return res.status(404).json({ message: "Service not found." });
    }
    if (service_id && serviceCheck.rows[0].user_id !== provider_id) {
      return res.status(400).json({ message: "The selected service does not belong to this provider." });
    }

    const completedBooking = service_id
      ? await pool.query(
          `SELECT 1 FROM bookings b JOIN services s ON b.service_id = s.id
           WHERE b.client_id = $1 AND s.user_id = $2 AND b.service_id = $3 AND b.status = 'completed' LIMIT 1`,
          [reviewer_id, provider_id, service_id]
        )
      : await pool.query(
          `SELECT 1 FROM bookings b JOIN services s ON b.service_id = s.id
           WHERE b.client_id = $1 AND s.user_id = $2 AND b.status = 'completed' LIMIT 1`,
          [reviewer_id, provider_id]
        );

    if (completedBooking.rows.length === 0) {
      return res.status(403).json({ message: "You can only review providers after completing a booking with them." });
    }

    const insert = await pool.query(
      `INSERT INTO reviews (reviewer_id, provider_id, service_id, rating, comment)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [reviewer_id, provider_id, service_id || null, rating, comment || null]
    );

    res.status(201).json(insert.rows[0]);
  } catch (err) {
    console.error("CreateReview error:", err);
    res.status(500).json({ message: "Server error." });
  }
};

// GET /api/reviews/provider/:providerId - provider reviews + average
const getProviderReviews = async (req, res) => {
  const { providerId } = req.params;

  try {
    const providerCheck = await pool.query("SELECT id, name FROM users WHERE id = $1", [providerId]);
    if (providerCheck.rows.length === 0) {
      return res.status(404).json({ message: "Provider not found." });
    }

    const reviews = await pool.query(
      `SELECT r.id, r.reviewer_id, u.name AS reviewer_name, r.service_id, s.title AS service_title,
              r.rating, r.comment, r.created_at
       FROM reviews r
       LEFT JOIN users u ON r.reviewer_id = u.id
       LEFT JOIN services s ON r.service_id = s.id
       WHERE r.provider_id = $1
       ORDER BY r.created_at DESC`,
      [providerId]
    );

    const aggregate = await pool.query(
      `SELECT COALESCE(AVG(rating), 0)::numeric(3,2) AS average_rating,
              COUNT(*) AS review_count
       FROM reviews
       WHERE provider_id = $1`,
      [providerId]
    );

    res.json({
      provider: providerCheck.rows[0],
      average_rating: Number(aggregate.rows[0].average_rating),
      review_count: Number(aggregate.rows[0].review_count),
      reviews: reviews.rows,
    });
  } catch (err) {
    console.error("GetProviderReviews error:", err);
    res.status(500).json({ message: "Server error." });
  }
};

// GET /api/reviews/user  (optional: logged-in user's authored reviews)
const getMyReviews = async (req, res) => {
  const requester = req.user.id;

  try {
    const reviews = await pool.query(
      `SELECT r.id, r.provider_id, u.name AS provider_name, r.service_id, s.title AS service_title,
              r.rating, r.comment, r.created_at
       FROM reviews r
       LEFT JOIN users u ON r.provider_id = u.id
       LEFT JOIN services s ON r.service_id = s.id
       WHERE r.reviewer_id = $1
       ORDER BY r.created_at DESC`,
      [requester]
    );

    res.json({ reviews: reviews.rows });
  } catch (err) {
    console.error("GetMyReviews error:", err);
    res.status(500).json({ message: "Server error." });
  }
};

module.exports = { createReview, getProviderReviews, getMyReviews };