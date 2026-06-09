const pool = require("../config/db");

const getLeaveTypes = async (
  req,
  res
) => {

  try {

    const result = await pool.query(`
  SELECT
    id,
    code,
    name,
    annual_entitlement,
    show_in_balance
  FROM leave_types
  WHERE active = true
  ORDER BY name
`);

    res.json(result.rows);

  } catch(error){

    console.error(error);

    res.status(500).json({
      message:"Server Error"
    });

  }

};

module.exports = {
  getLeaveTypes
};