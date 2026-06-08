import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { motion } from "framer-motion";
import {
  UserPlusIcon,
  XMarkIcon,
  UserIcon,
  BriefcaseIcon,
  KeyIcon,
  EnvelopeIcon,
  CalendarIcon,
  ExclamationCircleIcon,
  HomeIcon,
  PhoneIcon,
  MapPinIcon,
  GlobeAltIcon,
  BuildingOfficeIcon,
} from "@heroicons/react/24/outline";
import { useToast } from "../context/ToastContext";

export default function AddEmployee() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    department: "",
    designation: "",
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
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  useEffect(() => {
    loadManagers();
    loadCountries();
  }, []);

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
      "email",
      "password",
      "department",
      "designation",
      "joining_date",
      "dob",
      "gender",
    ];
    if (requiredFields.includes(name) && !value?.trim()) {
      error = `${name.replace(/_/g, " ")} is required`;
    }
    if (name === "email" && value && !/\S+@\S+\.\S+/.test(value)) {
      error = "Enter a valid email address";
    }
    if (name === "password" && value && value.length < 6) {
      error = "Password must be at least 6 characters";
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
      "email",
      "password",
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
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Enter a valid email address";
      isValid = false;
    }
    if (formData.password && formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
      isValid = false;
    }
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
      await api.post("/employees", formData);
      showToast("Employee created successfully", "success");
      navigate("/employees");
    } catch (error) {
      console.error(error);
      show9(
        error.response?.data?.message || "Failed to create employee",
        "error",
      );
    }
  };

  const getInputClassName = (fieldName) => {
    const hasError = touched[fieldName] && errors[fieldName];
    return `w-full px-4 py-2.5 rounded-xl border ${hasError ? "border-red-500 ring-1 ring-red-500" : "border-gray-200 dark:border-gray-700"} bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 transition-all`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-w-5xl mx-auto px-4"
    >
      <div className="flex items-center gap-4">
        <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 rounded-2xl text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/50">
          <UserPlusIcon className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
            Add Employee
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Register a new team member to the organization
          </p>
        </div>
      </div>

      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-6 md:p-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Personal Information */}
            <div className="space-y-6 md:col-span-2">
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 dark:border-gray-700 pb-2">
                <UserIcon className="h-4 w-4" /> Personal Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
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
                      <ExclamationCircleIcon className="h-3 w-3" />{" "}
                      {errors.gender}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Employment Details */}
            <div className="space-y-6 md:col-span-2">
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 dark:border-gray-700 pb-2">
                <BriefcaseIcon className="h-4 w-4" /> Employment Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Joining Date <span className="text-red-500">*</span>
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Reporting Manager
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
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-6 md:col-span-2">
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 dark:border-gray-700 pb-2">
                <HomeIcon className="h-4 w-4" /> Contact Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
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
              </div>
            </div>

            {/* Account Credentials */}
            <div className="space-y-6 md:col-span-2">
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 dark:border-gray-700 pb-2">
                <KeyIcon className="h-4 w-4" /> Account Credentials
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Work Email <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <EnvelopeIcon className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={getInputClassName("email") + " pl-11"}
                    />
                  </div>
                  {touched.email && errors.email && (
                    <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                      <ExclamationCircleIcon className="h-3 w-3" />{" "}
                      {errors.email}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Temporary Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <KeyIcon className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={getInputClassName("password") + " pl-11"}
                    />
                  </div>
                  {touched.password && errors.password && (
                    <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                      <ExclamationCircleIcon className="h-3 w-3" />{" "}
                      {errors.password}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-100 dark:border-gray-700">
            <button
              type="submit"
              className="inline-flex justify-center items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium rounded-xl transition-all duration-200 shadow-md hover:shadow-lg w-full sm:w-auto"
            >
              <UserPlusIcon className="h-5 w-5" /> Create Employee
            </button>
            <button
              type="button"
              onClick={() => navigate("/employees")}
              className="inline-flex justify-center items-center gap-2 px-6 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-medium rounded-xl transition-all w-full sm:w-auto"
            >
              <XMarkIcon className="h-5 w-5" /> Cancel
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}
