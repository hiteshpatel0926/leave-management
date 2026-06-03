const pool = require("../config/db");

const getHolidays = async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT *
      FROM holidays
      ORDER BY holiday_date
      `,
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server Error",
    });
  }
};

const createHoliday = async (req, res) => {
  try {
    const { holiday_name, holiday_date } = req.body;

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
      [holiday_name, holiday_date],
    );

    res.status(201).json({
      message: "Holiday created successfully",
      holiday: result.rows[0],
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server Error",
    });
  }
};

const updateHoliday = async (req, res) => {
  try {

    const { id } = req.params;

    const {
      holiday_name,
      holiday_date
    } = req.body;

    const result = await pool.query(
      `
      UPDATE holidays
      SET
        holiday_name = $1,
        holiday_date = $2
      WHERE id = $3
      RETURNING *
      `,
      [
        holiday_name,
        holiday_date,
        id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Holiday not found"
      });
    }

    res.json({
      message: "Holiday updated successfully",
      holiday: result.rows[0]
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: "Server Error"
    });

  }
};

const deleteHoliday = async (req, res) => {
  try {

    const { id } = req.params;

    const result = await pool.query(
      `
      DELETE FROM holidays
      WHERE id = $1
      RETURNING *
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Holiday not found"
      });
    }

    res.json({
      message: "Holiday deleted successfully"
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
  createHoliday,
  updateHoliday,
  deleteHoliday
};
