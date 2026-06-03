const pool = require("../config/db");

const getHolidays = async (req, res) => {
  try {

    const result = await pool.query(
      `
      SELECT *
      FROM holidays
      ORDER BY holiday_date
      `
    );

    res.json(result.rows);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: "Server Error"
    });

  }
};

const createHoliday = async (req, res) => {
  try {

    const {
      holiday_name,
      holiday_date
    } = req.body;

    const result = await pool.query(
      `
      INSERT INTO holidays
      (
        holiday_name,
        holiday_date
      )
      VALUES ($1,$2)
      RETURNING *
      `,
      [
        holiday_name,
        holiday_date
      ]
    );

    res.status(201).json({
      message: "Holiday created successfully",
      holiday: result.rows[0]
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: "Server Error"
    });

  }
};

module.exports = {
  getHolidays,
  createHoliday
};