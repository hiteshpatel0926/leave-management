const pool = require('../config/db');

const uploadProfilePicture = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  const imageUrl = `/uploads/${req.file.filename}`;
  const { id: employeeId } = req.params;   // employee ID from route

  try {
    const result = await pool.query(
      `UPDATE employees SET profile_picture = $1 WHERE id = $2 RETURNING profile_picture`,
      [imageUrl, employeeId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    res.json({
      message: 'Profile picture updated successfully',
      profilePicture: result.rows[0].profile_picture
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { uploadProfilePicture };