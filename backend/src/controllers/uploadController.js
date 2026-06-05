// backend/src/controllers/uploadController.js
const pool = require('../config/db');
const fs = require('fs').promises;
const path = require('path');

const uploadProfilePicture = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  const { id: employeeId } = req.params;
  const newImageUrl = `/uploads/${req.file.filename}`;

  try {
    // 1. Get current profile picture path from database
    const current = await pool.query(
      'SELECT profile_picture FROM employees WHERE id = $1',
      [employeeId]
    );

    if (current.rows.length === 0) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    const oldPicture = current.rows[0].profile_picture;

    // 2. Delete old file if it exists and is not a default/empty path
    if (oldPicture && oldPicture !== '/uploads/default-avatar.png') {
      const oldFilePath = path.join(__dirname, '../../', oldPicture); // adjust path as needed
      try {
        await fs.unlink(oldFilePath);
        console.log(`Deleted old profile picture: ${oldFilePath}`);
      } catch (err) {
        // Log but don't fail the upload – file may already be missing
        console.warn(`Could not delete old picture: ${err.message}`);
      }
    }

    // 3. Update database with new image path
    const result = await pool.query(
      `UPDATE employees SET profile_picture = $1 WHERE id = $2 RETURNING profile_picture`,
      [newImageUrl, employeeId]
    );

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