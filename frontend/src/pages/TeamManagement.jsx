import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { getImageUrl } from "../utils/imageHelper";
import {
  UsersIcon,
  EnvelopeIcon,
  BuildingOfficeIcon,
  BriefcaseIcon,
  UserGroupIcon,
  ViewColumnsIcon,
  Squares2X2Icon,
  EyeIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import api from "../services/api";
import { useNavigate } from "react-router-dom";

export default function TeamManagement() {
  const navigate = useNavigate();
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("table");
  const [imageErrors, setImageErrors] = useState({});

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    loadTeam();
  }, []);

  const loadTeam = async () => {
    try {
      const res = await api.get("/manager/team");
      setTeam(res.data);
      setImageErrors({});
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (firstName, lastName) => {
    return `${firstName?.charAt(0) || ""}${lastName?.charAt(0) || ""}`.toUpperCase();
  };

  const handleImageError = (empId) => {
    setImageErrors((prev) => ({ ...prev, [empId]: true }));
  };

  // Pagination calculations
  const totalItems = team.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTeam = team.slice(startIndex, endIndex);

  const goToPage = (page) => {
    setCurrentPage(Math.min(Math.max(1, page), totalPages));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="relative">
          <div className="animate-spin rounded-full h-14 w-14 border-b-2 border-indigo-600"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-6 w-6 rounded-full bg-indigo-100 animate-ping"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 px-4"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-2xl text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800/50">
            <UserGroupIcon className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              My Team
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              View all team members and their details
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="flex rounded-xl border border-gray-200 dark:border-gray-700 p-1 bg-white dark:bg-gray-800 shadow-sm">
            <button
              onClick={() => setViewMode("table")}
              className={`px-4 py-2 text-sm rounded-lg transition-all duration-200 flex items-center gap-2 ${
                viewMode === "table"
                  ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-400 shadow-sm"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
              }`}
            >
              <ViewColumnsIcon className="h-4 w-4" />
              Table
            </button>
            <button
              onClick={() => setViewMode("cards")}
              className={`px-4 py-2 text-sm rounded-lg transition-all duration-200 flex items-center gap-2 ${
                viewMode === "cards"
                  ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-400 shadow-sm"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
              }`}
            >
              <Squares2X2Icon className="h-4 w-4" />
              Cards
            </button>
          </div>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl text-sm text-gray-600 dark:text-gray-300 shadow-sm border border-gray-200 dark:border-gray-700">
            <UsersIcon className="h-5 w-5" />
            <span className="font-semibold">{team.length}</span> members
          </div>
        </div>
      </div>

      {/* Table View */}
      {viewMode === "table" && (
        <>
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50/80 dark:bg-gray-900/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Department</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Designation</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-20">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {currentTeam.map((m) => {
                    const hasImageError = imageErrors[m.id];
                    return (
                      <tr
                        key={m.id}
                        className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-all duration-150 group"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            {m.profile_picture && !hasImageError ? (
                              <img
                                src={getImageUrl(m.profile_picture)}
                                alt={m.first_name}
                                className="h-10 w-10 rounded-xl object-cover shadow-sm ring-2 ring-transparent group-hover:ring-indigo-300 transition-all"
                                onError={() => handleImageError(m.id)}
                              />
                            ) : (
                              <div className="flex-shrink-0 h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold shadow-sm group-hover:scale-105 transition-transform">
                                {getInitials(m.first_name, m.last_name)}
                              </div>
                            )}
                            <div>
                              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                {m.first_name} {m.last_name}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                                {m.employee_code}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex items-center gap-1.5">
                            <EnvelopeIcon className="h-4 w-4 text-gray-400" />
                            {m.email}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400 hidden md:table-cell">
                          <div className="flex items-center gap-1.5">
                            <BuildingOfficeIcon className="h-4 w-4 text-gray-400" />
                            {m.department || "-"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400 hidden lg:table-cell">
                          <div className="flex items-center gap-1.5">
                            <BriefcaseIcon className="h-4 w-4 text-gray-400" />
                            {m.designation || "-"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                              m.status === "ACTIVE"
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                : "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"
                            }`}
                          >
                            {m.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            onClick={() => navigate(`/employees/${m.id}?returnTo=team`)}
                            className="inline-flex items-center justify-center p-2 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                            title="View Details"
                          >
                            <EyeIcon className="h-5 w-5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {team.length === 0 && (
              <div className="text-center py-16">
                <UsersIcon className="mx-auto h-14 w-14 text-gray-300 dark:text-gray-600" />
                <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">No team members found</p>
              </div>
            )}
          </div>

          {/* Pagination - dropdown style */}
          {totalItems > 0 && (
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-4">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <span>Show</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                  className="px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                >
                  {[5, 10, 20, 50].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
                <span>entries</span>
                <span className="ml-4">Total: {totalItems} members</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                >
                  <ChevronLeftIcon className="h-5 w-5" />
                </button>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Page</span>
                  <select
                    value={currentPage}
                    onChange={(e) => goToPage(Number(e.target.value))}
                    className="px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
                  >
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                  <span className="text-sm text-gray-600 dark:text-gray-400">of {totalPages}</span>
                </div>
                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                >
                  <ChevronRightIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Cards View */}
      {viewMode === "cards" && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentTeam.map((m) => {
              const hasImageError = imageErrors[m.id];
              return (
                <div
                  key={m.id}
                  className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-5 hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {m.profile_picture && !hasImageError ? (
                        <img
                          src={getImageUrl(m.profile_picture)}
                          alt={m.first_name}
                          className="h-14 w-14 rounded-xl object-cover shadow-sm ring-2 ring-transparent group-hover:ring-indigo-300 transition-all"
                          onError={() => handleImageError(m.id)}
                        />
                      ) : (
                        <div className="flex-shrink-0 h-14 w-14 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-base font-bold shadow-sm group-hover:scale-105 transition-transform">
                          {getInitials(m.first_name, m.last_name)}
                        </div>
                      )}
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {m.first_name} {m.last_name}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                          {m.employee_code}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                        m.status === "ACTIVE"
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                          : "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"
                      }`}
                    >
                      {m.status}
                    </span>
                  </div>
                  <div className="mt-4 space-y-2 text-sm">
                    <p className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Email:</span>
                      <span className="text-gray-700 dark:text-gray-300 truncate ml-2">{m.email}</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Department:</span>
                      <span className="text-gray-700 dark:text-gray-300">{m.department || "-"}</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Designation:</span>
                      <span className="text-gray-700 dark:text-gray-300">{m.designation || "-"}</span>
                    </p>
                  </div>
                  <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-center">
                    <button
                      onClick={() => navigate(`/employees/${m.id}?returnTo=team`)}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl text-blue-700 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/40 transition"
                    >
                      <EyeIcon className="h-4 w-4" /> View Details
                    </button>
                  </div>
                </div>
              );
            })}
            {team.length === 0 && (
              <div className="col-span-full text-center py-16">
                <UsersIcon className="mx-auto h-14 w-14 text-gray-300 dark:text-gray-600" />
                <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">No team members found</p>
              </div>
            )}
          </div>

          {/* Pagination - same dropdown style */}
          {totalItems > 0 && (
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-4">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <span>Show</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                  className="px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                >
                  {[5, 10, 20, 50].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
                <span>entries</span>
                <span className="ml-4">Total: {totalItems} members</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                >
                  <ChevronLeftIcon className="h-5 w-5" />
                </button>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Page</span>
                  <select
                    value={currentPage}
                    onChange={(e) => goToPage(Number(e.target.value))}
                    className="px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
                  >
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                  <span className="text-sm text-gray-600 dark:text-gray-400">of {totalPages}</span>
                </div>
                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                >
                  <ChevronRightIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </motion.div>
  );
}