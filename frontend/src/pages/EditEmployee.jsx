import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import { motion } from "framer-motion";
import {
  UserCircleIcon,
  BriefcaseIcon,
  CalendarIcon,
  UserGroupIcon,
  CameraIcon,
  ExclamationCircleIcon,
  HomeIcon,
  PhoneIcon,
} from "@heroicons/react/24/outline";
import { getImageUrl } from "../utils/imageHelper";
import ImageCropUpload from "../components/ImageCropUpload";
import { useToast } from "../context/ToastContext";

export default function EditEmployee() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    department: "",
    designation: "",
    status: "ACTIVE",
    joining_date: "",
    dob: "",
    gender: "",
    manager_id: "",
    address: "",
    country_id: "",
    state_id: "",
    city_id: "",
    zip: "",
    phone_country_code: "",
    phone_number: "",
  });

  const [managers, setManagers] = useState([]);
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [profilePicture, setProfilePicture] = useState(null);
  const [imgError, setImgError] = useState(false);
  const [showCrop, setShowCrop] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  useEffect(() => {
    loadEmployee();
    loadManagers();
    loadCountries();
  }, [id]);

  useEffect(() => {
    if (formData.country_id) {
      loadStates(formData.country_id);
      const selectedCountry = countries.find(
        (c) => c.id == formData.country_id,
      );
      if (selectedCountry && selectedCountry.phone_code) {
        setFormData((prev) => ({
          ...prev,
          phone_country_code: selectedCountry.phone_code,
        }));
        if (errors.phone_country_code)
          setErrors((prev) => ({ ...prev, phone_country_code: "" }));
      }
    } else {
      setStates([]);
      setCities([]);
    }
  }, [formData.country_id]);

  useEffect(() => {
    if (formData.state_id) {
      loadCities(formData.state_id);
    } else {
      setCities([]);
    }
  }, [formData.state_id]);

  const loadEmployee = async () => {
    try {
      const response = await api.get(`/employees/${id}`);
      const formatLocalDate = (dateString) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        return date.toLocaleDateString("en-CA");
      };

      setFormData({
        first_name: response.data.first_name,
        last_name: response.data.last_name,
        department: response.data.department,
        designation: response.data.designation,
        status: response.data.status,
        joining_date: formatLocalDate(response.data.joining_date),
        dob: formatLocalDate(response.data.dob),
        gender: response.data.gender || "",
        manager_id: response.data.manager_id || "",
        address: response.data.address || "",
        country_id: response.data.country_id || "",
        state_id: response.data.state_id || "",
        city_id: response.data.city_id || "",
        zip: response.data.zip || "",
        phone_country_code: response.data.phone_country_code || "",
        phone_number: response.data.phone_number || "",
      });

      if (response.data.profile_picture) {
        setProfilePicture(getImageUrl(response.data.profile_picture));
        setImgError(false);
      } else {
        setProfilePicture(null);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const loadManagers = async () => {
    try {
      const res = await api.get("/employees/potential-managers");
      setManagers(res.data);
    } catch (err) {
      console.error("Failed to load managers:", err);
    }
  };

  const loadCountries = async () => {
    try {
      const res = await api.get("/employees/locations/countries");
      setCountries(res.data);
    } catch (err) {
      console.error("Failed to load countries:", err);
    }
  };

  const loadStates = async (countryId) => {
    try {
      const res = await api.get(`/employees/locations/states/${countryId}`);
      setStates(res.data);
    } catch (err) {
      console.error("Failed to load states:", err);
    }
  };

  const loadCities = async (stateId) => {
    try {
      const res = await api.get(`/employees/locations/cities/${stateId}`);
      setCities(res.data);
    } catch (err) {
      console.error("Failed to load cities:", err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    validateField(name, formData[name]);
  };

  const validateField = (name, value) => {
    let error = "";
    const requiredFields = [
      "first_name",
      "last_name",
      "department",
      "designation",
      "joining_date",
      "dob",
      "gender",
    ];
    if (requiredFields.includes(name) && !value?.trim()) {
      error = `${name.replace(/_/g, " ")} is required`;
    }
    if (name === "phone_number" && value && !/^\d{10,15}$/.test(value)) {
      error = "Phone number must be 10-15 digits";
    }
    setErrors((prev) => ({ ...prev, [name]: error }));
    return !error;
  };

  const validateForm = () => {
    const requiredFields = [
      "first_name",
      "last_name",
      "department",
      "designation",
      "joining_date",
      "dob",
      "gender",
    ];
    const newErrors = {};
    let isValid = true;
    requiredFields.forEach((field) => {
      if (!formData[field]?.trim()) {
        newErrors[field] = `${field.replace(/_/g, " ")} is required`;
        isValid = false;
      }
    });
    if (formData.phone_number && !/^\d{10,15}$/.test(formData.phone_number)) {
      newErrors.phone_number = "Phone number must be 10-15 digits";
      isValid = false;
    }
    setErrors(newErrors);
    const allTouched = {};
    Object.keys(formData).forEach((field) => {
      allTouched[field] = true;
    });
    setTouched(allTouched);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    try {
      await api.put(`/employees/${id}`, formData);
      await api.put(`/employees/${id}/manager`, {
        managerId: formData.manager_id || null,
      });
      showToast("Employee updated successfully", "success");
      navigate("/employees");
    } catch (error) {
      console.error(error);
      showToast(error.response?.data?.message || "Failed to update employee", "error");
    }
  };

  const handleUploadSuccess = () => {
    loadEmployee();
    window.dispatchEvent(new Event("profile-updated"));
  };

  const getInputClassName = (fieldName) => {
    const hasError = touched[fieldName] && errors[fieldName];
    return `w-full px-4 py-2.5 rounded-xl border ${hasError ? "border-red-500 ring-1 ring-red-500" : "border-gray-200 dark:border-gray-700"} bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 transition-all`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-w-5xl mx-auto px-4"
    >
      <div className="flex items-center gap-3">
        <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl">
          <UserCircleIcon className="h-6 w-6 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Edit Employee
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Update employee information, reporting structure, and profile
            picture
          </p>
        </div>
      </div>

      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-6 md:p-8">
        {/* Profile Picture Section */}
        <div className="flex items-center gap-6 mb-8 pb-6 border-b border-gray-100 dark:border-gray-700">
          <div className="relative">
            {!imgError && profilePicture ? (
              <img
                src={profilePicture}
                alt="Profile"
                className="h-20 w-20 rounded-2xl object-cover ring-4 ring-white dark:ring-gray-800 shadow-md"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-indigo-100 to-indigo-200 dark:from-indigo-900/40 dark:to-indigo-800/40 flex items-center justify-center shadow-sm">
                <UserCircleIcon className="h-10 w-10 text-indigo-500" />
              </div>
            )}
            <button
              onClick={() => setShowCrop(true)}
              className="absolute -bottom-2 -right-2 bg-white dark:bg-gray-800 rounded-full p-1.5 shadow-md hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              title="Change photo"
            >
              <CameraIcon className="h-4 w-4 text-gray-600 dark:text-gray-300" />
            </button>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Profile Picture
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              Click the camera icon to upload a new photo
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Existing required fields */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                onBlur={handleBlur}
                className={getInputClassName("first_name")}
              />
              {touched.first_name && errors.first_name && (
                <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                  <ExclamationCircleIcon className="h-3 w-3" />{" "}
                  {errors.first_name}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                onBlur={handleBlur}
                className={getInputClassName("last_name")}
              />
              {touched.last_name && errors.last_name && (
                <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                  <ExclamationCircleIcon className="h-3 w-3" />{" "}
                  {errors.last_name}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Department <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="department"
                value={formData.department}
                onChange={handleChange}
                onBlur={handleBlur}
                className={getInputClassName("department")}
              />
              {touched.department && errors.department && (
                <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                  <ExclamationCircleIcon className="h-3 w-3" />{" "}
                  {errors.department}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Designation <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="designation"
                value={formData.designation}
                onChange={handleChange}
                onBlur={handleBlur}
                className={getInputClassName("designation")}
              />
              {touched.designation && errors.designation && (
                <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                  <ExclamationCircleIcon className="h-3 w-3" />{" "}
                  {errors.designation}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Date of Joining <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="joining_date"
                value={formData.joining_date}
                onChange={handleChange}
                onBlur={handleBlur}
                className={getInputClassName("joining_date")}
              />
              {touched.joining_date && errors.joining_date && (
                <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                  <ExclamationCircleIcon className="h-3 w-3" />{" "}
                  {errors.joining_date}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Date of Birth <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="dob"
                value={formData.dob}
                onChange={handleChange}
                onBlur={handleBlur}
                className={getInputClassName("dob")}
              />
              {touched.dob && errors.dob && (
                <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                  <ExclamationCircleIcon className="h-3 w-3" /> {errors.dob}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Gender <span className="text-red-500">*</span>
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                onBlur={handleBlur}
                className={getInputClassName("gender")}
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
              {touched.gender && errors.gender && (
                <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                  <ExclamationCircleIcon className="h-3 w-3" /> {errors.gender}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Manager
              </label>
              <select
                name="manager_id"
                value={formData.manager_id}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">None</option>
                {managers.map((mgr) => (
                  <option key={mgr.id} value={mgr.id}>
                    {mgr.first_name} {mgr.last_name} ({mgr.role})
                  </option>
                ))}
              </select>
            </div>

            {/* Contact Information Section */}
            <div className="md:col-span-2">
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 dark:border-gray-700 pb-2 mt-4 mb-4">
                <HomeIcon className="h-4 w-4" /> Contact Information
              </h3>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Street Address
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Country
              </label>
              <select
                name="country_id"
                value={formData.country_id}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select Country</option>
                {countries.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.phone_code})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                State
              </label>
              <select
                name="state_id"
                value={formData.state_id}
                onChange={handleChange}
                disabled={!formData.country_id}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                <option value="">Select State</option>
                {states.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                City
              </label>
              <select
                name="city_id"
                value={formData.city_id}
                onChange={handleChange}
                disabled={!formData.state_id}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                <option value="">Select City</option>
                {cities.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ZIP / Postal Code
              </label>
              <input
                type="text"
                name="zip"
                value={formData.zip}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Phone Number
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  name="phone_country_code"
                  value={formData.phone_country_code}
                  readOnly
                  className="w-24 px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                />
                <input
                  type="tel"
                  name="phone_number"
                  value={formData.phone_number}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="e.g., 9876543210"
                  className={`flex-1 px-4 py-2.5 rounded-xl border ${touched.phone_number && errors.phone_number ? "border-red-500 ring-1 ring-red-500" : "border-gray-200 dark:border-gray-700"} bg-white dark:bg-gray-900 focus:ring-2 focus:ring-indigo-500 transition-all`}
                />
              </div>
              {touched.phone_number && errors.phone_number && (
                <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                  <ExclamationCircleIcon className="h-3 w-3" />{" "}
                  {errors.phone_number}
                </p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
            </div>
          </div>
          <div className="flex space-x-4 pt-4">
            <button
              type="submit"
              className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium rounded-xl transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-[1.02]"
            >
              Update Employee
            </button>
            <button
              type="button"
              onClick={() => navigate("/employees")}
              className="px-6 py-2.5 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-medium rounded-xl transition-all duration-200"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>

      {showCrop && (
        <ImageCropUpload
          employeeId={id}
          onUploadSuccess={handleUploadSuccess}
          onClose={() => setShowCrop(false)}
        />
      )}
    </motion.div>
  );
}