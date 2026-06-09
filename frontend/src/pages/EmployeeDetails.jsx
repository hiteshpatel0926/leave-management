import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { getImageUrl } from "../utils/imageHelper";
import {
  ArrowLeftIcon,
  UserIcon,
  BriefcaseIcon,
  CalendarIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  ChartBarIcon,
  EnvelopeIcon,
  UsersIcon,
  BuildingOfficeIcon,
  CameraIcon,
  IdentificationIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  HomeIcon,
  PhoneIcon,
  MapPinIcon,
  PlusCircleIcon,
} from "@heroicons/react/24/outline";
import api from "../services/api";
import ImageCropUpload from "../components/ImageCropUpload";

export default function EmployeeDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [imgError, setImgError] = useState(false);
  const [showCrop, setShowCrop] = useState(false);

  // Pagination for Leave History
  const [currentLeavePage, setCurrentLeavePage] = useState(1);
  const [leavesPerPage, setLeavesPerPage] = useState(5);

  // Award Comp Off modal state
  const [showAwardModal, setShowAwardModal] = useState(false);
  const [awardDays, setAwardDays] = useState("");
  const [awardReason, setAwardReason] = useState("");
  const [awardLoading, setAwardLoading] = useState(false);

  useEffect(() => {
    loadEmployee();
  }, [id]);

  const loadEmployee = async () => {
    try {
      const response = await api.get(`/employees/${id}/details`);
      setEmployee(response.data);
      setImgError(false);
      setCurrentLeavePage(1);
    } catch (error) {
      console.error(error);
    }
  };

  const handleUploadSuccess = () => {
    loadEmployee();
  };

  // Get current user role from localStorage
  const storedUser = localStorage.getItem("user");
  const currentUser = storedUser ? JSON.parse(storedUser) : null;
  const currentUserRole = currentUser?.role || "";

  const awardCompOff = async () => {
    if (!awardDays || parseFloat(awardDays) <= 0) {
      alert("Please enter a valid number of days");
      return;
    }
    setAwardLoading(true);
    try {
      await api.post("/employees/award-comp-off", {
        employeeId: id,
        days: parseFloat(awardDays),
        reason: awardReason || "Awarded by manager/admin",
      });
      alert(`Successfully awarded ${awardDays} Comp Off day(s)`);
      // Refresh employee data to show updated balance
      loadEmployee();
      // Close modal and reset fields
      setShowAwardModal(false);
      setAwardDays("");
      setAwardReason("");
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || "Failed to award Comp Off");
    } finally {
      setAwardLoading(false);
    }
  };

  if (!employee) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="relative">
          <div className="animate-spin rounded-full h-14 w-14 border-b-2 border-indigo-600"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-6 w-6 rounded-full bg-indigo-100 animate-ping"></div>
          </div>
        </div>
      </div>
    );
  }

  // Helper to get contact fields from either employee.profile or employee root
  const getContactField = (fieldName) => {
    return employee.profile?.[fieldName] ?? employee[fieldName];
  };

  const address = getContactField("address");
  const city = getContactField("city_name");
  const state = getContactField("state_name");
  const country = getContactField("country_name");
  const zip = getContactField("zip");
  const phoneCode = getContactField("phone_country_code");
  const phoneNumber = getContactField("phone_number");

  const formatPhone = () => {
    if (!phoneCode && !phoneNumber) return null;
    if (phoneCode && phoneNumber) return `${phoneCode} ${phoneNumber}`;
    return phoneCode || phoneNumber;
  };

  // Only PL and CO count toward the active balance
  const activeBalanceCodes = ["PL", "CO"];
  const activeBalances =
    employee.balances?.filter((b) => activeBalanceCodes.includes(b.code)) || [];

  const totalAllocated = activeBalances.reduce(
    (sum, b) => sum + (Number(b.entitled_days) || 0),
    0,
  );
  const totalUsed = activeBalances.reduce(
    (sum, b) => sum + (Number(b.used_days) || 0),
    0,
  );
  const totalBalance = activeBalances.reduce(
    (sum, b) => sum + (Number(b.balance_days) || 0),
    0,
  );

  // Non‑recurring leaves (ML, PTL, BL, etc.) – display separately
  const additionalLeaveCodes = ["ML", "PTL", "BL"];
  const additionalLeaves =
    employee.balances?.filter((b) => additionalLeaveCodes.includes(b.code)) ||
    [];

  const leaves = employee.leaves || [];
  const requestStats = {
    approved: leaves.filter((l) => l.status?.toLowerCase() === "approved")
      .length,
    pending: leaves.filter((l) => l.status?.toLowerCase() === "pending").length,
    rejected: leaves.filter((l) => l.status?.toLowerCase() === "rejected")
      .length,
  };

  const statusBadge = (status) => {
    const s = status?.toLowerCase();
    if (s === "approved")
      return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400";
    if (s === "pending")
      return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400";
    return "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400";
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Pagination for leave history
  const totalLeaves = leaves.length;
  const totalLeavePages = Math.ceil(totalLeaves / leavesPerPage);
  const startLeaveIndex = (currentLeavePage - 1) * leavesPerPage;
  const endLeaveIndex = startLeaveIndex + leavesPerPage;
  const currentLeaves = leaves.slice(startLeaveIndex, endLeaveIndex);

  const goToLeavePage = (page) => {
    setCurrentLeavePage(Math.min(Math.max(1, page), totalLeavePages));
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 p-4 md:p-6 max-w-7xl mx-auto"
    >
      <button
        onClick={() => {
          const returnTo = new URLSearchParams(location.search).get("returnTo");
          if (returnTo === "team") {
            navigate("/manager/team");
          } else {
            navigate("/employees");
          }
        }}
        className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-xl text-gray-700 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm hover:shadow"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        {new URLSearchParams(location.search).get("returnTo") === "team"
          ? "Back to Team Members"
          : "Back to Employees"}
      </button>

      {/* Profile Header Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 shadow-xl">
        <div className="absolute inset-0 bg-black/10 backdrop-blur-[2px]"></div>
        <div className="relative p-6 md:p-8">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="relative">
              {!imgError && employee.profile?.profile_picture ? (
                <img
                  src={getImageUrl(employee.profile.profile_picture)}
                  alt="Profile"
                  className="h-24 w-24 rounded-2xl object-cover border-4 border-white/30 shadow-xl"
                  onError={() => setImgError(true)}
                />
              ) : (
                <div className="bg-white/20 backdrop-blur rounded-2xl p-5">
                  <UserIcon className="h-14 w-14 text-white" />
                </div>
              )}
              <button
                onClick={() => setShowCrop(true)}
                className="absolute -bottom-2 -right-2 bg-white dark:bg-gray-800 rounded-full p-2 shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition transform hover:scale-105"
                title="Upload new photo"
              >
                <CameraIcon className="h-4 w-4 text-gray-600 dark:text-gray-300" />
              </button>
            </div>
            <div className="flex-1 text-white">
              <h1 className="text-3xl font-bold">
                {employee.profile?.first_name || employee.first_name}{" "}
                {employee.profile?.last_name || employee.last_name}
              </h1>
              <div className="flex flex-wrap gap-x-6 gap-y-2 mt-2 text-white/90">
                <span className="flex items-center gap-1.5">
                  <BriefcaseIcon className="h-4 w-4" />
                  {employee.profile?.employee_code || employee.employee_code}
                </span>
                <span className="flex items-center gap-1.5">
                  <BuildingOfficeIcon className="h-4 w-4" />
                  {employee.profile?.designation || employee.designation}
                </span>
                <span className="flex items-center gap-1.5">
                  <UserIcon className="h-4 w-4" />
                  Manager:{" "}
                  {employee.profile?.manager_name ||
                    employee.manager_name ||
                    "None"}
                </span>
                <span className="flex items-center gap-1.5">
                  <CalendarIcon className="h-4 w-4" />
                  Joined:{" "}
                  {formatDate(
                    employee.profile?.joining_date || employee.joining_date,
                  )}
                </span>
                <span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white backdrop-blur-sm">
                    {employee.profile?.status || employee.status}
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Stats Cards (PL + CO only) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-100 dark:border-gray-700 p-5 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                Total Allocated
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                {totalAllocated.toFixed(1)}
              </p>
              <p className="text-xs text-gray-400 mt-1">(PL + CO)</p>
            </div>
            <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-xl">
              <ChartBarIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-100 dark:border-gray-700 p-5 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                Used Days
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                {totalUsed.toFixed(1)}
              </p>
              <p className="text-xs text-gray-400 mt-1">(PL + CO)</p>
            </div>
            <div className="bg-orange-100 dark:bg-orange-900/30 p-3 rounded-xl">
              <ClockIcon className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-100 dark:border-gray-700 p-5 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                Remaining Balance
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                {totalBalance.toFixed(1)}
              </p>
              <p className="text-xs text-gray-400 mt-1">(PL + CO)</p>
            </div>
            <div className="bg-emerald-100 dark:bg-emerald-900/30 p-3 rounded-xl">
              <CheckCircleIcon className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-100 dark:border-gray-700 p-5 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                Leave Requests
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                {leaves.length}
              </p>
              <div className="flex gap-3 mt-1 text-xs font-medium">
                <span className="text-emerald-600">
                  ✓ {requestStats.approved}
                </span>
                <span className="text-amber-600">
                  ⏳ {requestStats.pending}
                </span>
                <span className="text-rose-600">✗ {requestStats.rejected}</span>
              </div>
            </div>
            <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-xl">
              <CalendarIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Employee Information Card */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <IdentificationIcon className="h-5 w-5 text-indigo-500" />
            Employee Information
          </h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-start gap-3">
              <EnvelopeIcon className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Email
                </p>
                <p className="text-gray-900 dark:text-gray-100 font-medium">
                  {employee.profile?.email || employee.email}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <UsersIcon className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Gender
                </p>
                <p className="text-gray-900 dark:text-gray-100 font-medium">
                  {employee.profile?.gender || employee.gender}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CalendarIcon className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Date of Birth
                </p>
                <p className="text-gray-900 dark:text-gray-100 font-medium">
                  {formatDate(employee.profile?.dob || employee.dob)}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <BuildingOfficeIcon className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Department
                </p>
                <p className="text-gray-900 dark:text-gray-100 font-medium">
                  {employee.profile?.department || employee.department}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Information Card */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <HomeIcon className="h-5 w-5 text-indigo-500" />
            Contact Information
          </h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {address && (
              <div className="flex items-start gap-3">
                <HomeIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Address
                  </p>
                  <p className="text-gray-900 dark:text-gray-100 font-medium">
                    {address}
                  </p>
                </div>
              </div>
            )}
            {city && (
              <div className="flex items-start gap-3">
                <MapPinIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    City
                  </p>
                  <p className="text-gray-900 dark:text-gray-100 font-medium">
                    {city}
                  </p>
                </div>
              </div>
            )}
            {state && (
              <div className="flex items-start gap-3">
                <MapPinIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    State
                  </p>
                  <p className="text-gray-900 dark:text-gray-100 font-medium">
                    {state}
                  </p>
                </div>
              </div>
            )}
            {country && (
              <div className="flex items-start gap-3">
                <MapPinIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Country
                  </p>
                  <p className="text-gray-900 dark:text-gray-100 font-medium">
                    {country}
                  </p>
                </div>
              </div>
            )}
            {zip && (
              <div className="flex items-start gap-3">
                <MapPinIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    ZIP / Postal Code
                  </p>
                  <p className="text-gray-900 dark:text-gray-100 font-medium">
                    {zip}
                  </p>
                </div>
              </div>
            )}
            {formatPhone() && (
              <div className="flex items-start gap-3">
                <PhoneIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Phone Number
                  </p>
                  <p className="text-gray-900 dark:text-gray-100 font-medium">
                    {formatPhone()}
                  </p>
                </div>
              </div>
            )}
            {!address &&
              !city &&
              !state &&
              !country &&
              !zip &&
              !formatPhone() && (
                <div className="col-span-2 text-center text-gray-500 dark:text-gray-400 py-4">
                  No contact information available
                </div>
              )}
          </div>
        </div>
      </div>

      {/* Leave Balances Table (all leave types) with Award Comp Off button */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Leave Balances
          </h2>
          {(currentUserRole === "ADMIN" || currentUserRole === "MANAGER") && (
            <button
              onClick={() => setShowAwardModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
            >
              <PlusCircleIcon className="h-4 w-4" />
              Award Comp Off
            </button>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Leave Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Allocated
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Used
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Balance
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {employee.balances?.map((balance, idx) => (
                <tr
                  key={idx}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                    {balance.code} - {balance.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                    {Number(balance.entitled_days).toFixed(1)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                    {Number(balance.used_days).toFixed(1)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-indigo-600 dark:text-indigo-400">
                    {Number(balance.balance_days).toFixed(1)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Other Leave Entitlements (ML, PTL, BL, etc.) */}
      {additionalLeaves.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-indigo-500" />
              Other Leave Entitlements
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              One‑time or event‑based leaves – not included in your active
              balance
            </p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {additionalLeaves.map((leave) => (
                <div
                  key={leave.code}
                  className="border-l-4 border-indigo-400 pl-4 py-2"
                >
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                    {leave.name} ({leave.code})
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {leave.entitled_days} days
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {leave.used_days > 0
                      ? `${leave.used_days} used`
                      : "Not used yet"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Leave History Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Leave History
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Leave Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Start Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  End Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Days
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {currentLeaves.map((leave) => (
                <tr
                  key={leave.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                    {leave.leave_type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                    {formatDate(leave.start_date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                    {formatDate(leave.end_date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                    {Number(leave.total_days).toFixed(1)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${statusBadge(leave.status)}`}
                    >
                      {leave.status}
                    </span>
                  </td>
                </tr>
              ))}
              {currentLeaves.length === 0 && (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-10 text-center text-sm text-gray-500"
                  >
                    No leave requests found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalLeaves > 0 && (
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 px-6 py-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50/30 dark:bg-gray-900/30">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <span>Show</span>
              <select
                value={leavesPerPage}
                onChange={(e) => {
                  setLeavesPerPage(Number(e.target.value));
                  setCurrentLeavePage(1);
                }}
                className="px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
              >
                {[5, 10, 20, 50].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
              <span>entries</span>
              <span className="ml-4">Total: {totalLeaves} requests</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => goToLeavePage(currentLeavePage - 1)}
                disabled={currentLeavePage === 1}
                className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              >
                <ChevronLeftIcon className="h-5 w-5" />
              </button>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Page
                </span>
                <select
                  value={currentLeavePage}
                  onChange={(e) => goToLeavePage(Number(e.target.value))}
                  className="px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
                >
                  {Array.from({ length: totalLeavePages }, (_, i) => i + 1).map(
                    (p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ),
                  )}
                </select>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  of {totalLeavePages}
                </span>
              </div>
              <button
                onClick={() => goToLeavePage(currentLeavePage + 1)}
                disabled={currentLeavePage === totalLeavePages}
                className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              >
                <ChevronRightIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Award Comp Off Modal */}
      {showAwardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md p-6 mx-4">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Award Comp Off
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Number of Days
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  value={awardDays}
                  onChange={(e) => setAwardDays(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g., 1 or 0.5"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Reason (optional)
                </label>
                <textarea
                  rows="2"
                  value={awardReason}
                  onChange={(e) => setAwardReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g., Worked on a holiday"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowAwardModal(false)}
                className="px-4 py-2 text-sm font-medium rounded-lg text-gray-700 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={awardCompOff}
                disabled={awardLoading}
                className="px-4 py-2 text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
              >
                {awardLoading ? "Awarding..." : "Award"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showCrop && (
        <ImageCropUpload
          employeeId={employee.profile?.id || employee.id}
          onUploadSuccess={handleUploadSuccess}
          onClose={() => setShowCrop(false)}
        />
      )}
    </motion.div>
  );
}
