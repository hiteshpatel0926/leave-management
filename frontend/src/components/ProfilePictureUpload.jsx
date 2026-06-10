import React, { useState } from 'react';
import api from '../services/api';

const ProfilePictureUpload = ({ employeeId, currentPicture, onUploadSuccess }) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    const formData = new FormData();
    formData.append('profilePicture', file);

    setUploading(true);
    setError('');

    try {
      const response = await api.put(`/employees/${employeeId}/profile-picture`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (onUploadSuccess) onUploadSuccess(response.data.profilePicture);
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-2">
      <label className="cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded transition-colors">
        {uploading ? 'Uploading...' : 'Upload Picture'}
        <input type="file" accept="image/*" onChange={handleUpload} className="hidden" disabled={uploading} />
      </label>
      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  );
};

export default ProfilePictureUpload;