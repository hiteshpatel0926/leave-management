import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRightIcon,
  ChevronDownIcon,
  UserIcon,
  BuildingOfficeIcon,
  MagnifyingGlassIcon,
  UserGroupIcon,
  Bars3Icon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";
import { getImageUrl } from "../utils/imageHelper";
import api from "../services/api";

export default function OrgHierarchy() {
  const [employees, setEmployees] = useState([]);
  const [hierarchy, setHierarchy] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedNodes, setExpandedNodes] = useState({});
  const [imageErrors, setImageErrors] = useState({});
  const [activeTab, setActiveTab] = useState("tree");

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      const response = await api.get("/employees");
      setEmployees(response.data);
      buildHierarchy(response.data);
    } catch (error) {
      console.error("Failed to load employees:", error);
    } finally {
      setLoading(false);
    }
  };

  const buildHierarchy = (empList) => {
    const empMap = new Map();
    empList.forEach(emp => {
      empMap.set(emp.id, { ...emp, children: [] });
    });

    const roots = [];
    empList.forEach(emp => {
      const managerId = emp.manager_id;
      if (managerId && empMap.has(managerId) && managerId !== emp.id) {
        empMap.get(managerId).children.push(empMap.get(emp.id));
      } else {
        roots.push(empMap.get(emp.id));
      }
    });

    setHierarchy(roots);
    const defaultExpanded = {};
    const expandLevels = (nodes, level = 0) => {
      if (level >= 2) return;
      nodes.forEach(node => {
        defaultExpanded[node.id] = true;
        if (node.children?.length) expandLevels(node.children, level + 1);
      });
    };
    expandLevels(roots);
    setExpandedNodes(defaultExpanded);
  };

  const toggleNode = (nodeId) => {
    setExpandedNodes(prev => ({ ...prev, [nodeId]: !prev[nodeId] }));
  };

  const filterTree = (node, term) => {
    if (!term.trim()) return true;
    const matches =
      node.first_name?.toLowerCase().includes(term.toLowerCase()) ||
      node.last_name?.toLowerCase().includes(term.toLowerCase()) ||
      node.designation?.toLowerCase().includes(term.toLowerCase()) ||
      node.department?.toLowerCase().includes(term.toLowerCase());
    if (matches) return true;
    if (node.children?.some(child => filterTree(child, term))) return true;
    return false;
  };

  const handleImageError = (empId) => {
    setImageErrors(prev => ({ ...prev, [empId]: true }));
  };

  // ======================= TREE VIEW (vertical collapsible) =======================
  const TreeNode = ({ node, level = 0 }) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes[node.id];
    const matchesSearch = searchTerm.trim() === "" || filterTree(node, searchTerm);
    const hasImageError = imageErrors[node.id];
    const profilePic = node.profile_picture && !hasImageError ? getImageUrl(node.profile_picture) : null;

    if (!matchesSearch) return null;

    return (
      <div className="select-none">
        <div
          className={`flex items-center gap-3 py-3 px-3 rounded-xl cursor-pointer transition-all duration-200 group ${
            hasChildren ? "hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20" : "hover:bg-gray-50/50 dark:hover:bg-gray-800/30"
          }`}
          style={{ paddingLeft: `${level * 1.75 + 0.75}rem` }}
          onClick={() => hasChildren && toggleNode(node.id)}
        >
          {hasChildren && (
            <div className="flex-shrink-0 w-5 text-gray-400 group-hover:text-indigo-500 transition-colors">
              {isExpanded ? <ChevronDownIcon className="h-4 w-4" /> : <ChevronRightIcon className="h-4 w-4" />}
            </div>
          )}
          {!hasChildren && <div className="w-5 flex-shrink-0" />}

          <div className="flex-shrink-0">
            {profilePic ? (
              <img
                src={profilePic}
                alt={`${node.first_name} ${node.last_name}`}
                className="h-10 w-10 rounded-xl object-cover shadow-sm ring-2 ring-transparent group-hover:ring-indigo-200 dark:group-hover:ring-indigo-800 transition-all"
                onError={() => handleImageError(node.id)}
              />
            ) : (
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-100 to-indigo-200 dark:from-indigo-900/40 dark:to-indigo-800/40 flex items-center justify-center shadow-sm">
                <UserIcon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <span className="font-semibold text-gray-900 dark:text-white">
                {node.first_name} {node.last_name}
              </span>
              {node.employee_code && (
                <span className="text-xs text-gray-400 dark:text-gray-500 font-mono">{node.employee_code}</span>
              )}
              {node.designation && (
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-medium">
                  {node.designation}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
              {node.department || "—"} · {node.email || ""}
            </p>
          </div>

          {hasChildren && (
            <div className="flex-shrink-0 flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300">
              <UserGroupIcon className="h-3 w-3" />
              {node.children.length}
            </div>
          )}
        </div>

        <AnimatePresence initial={false}>
          {hasChildren && isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              {node.children.map(child => <TreeNode key={child.id} node={child} level={level + 1} />)}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  // ======================= HORIZONTAL ORG CHART (with Expand/Collapse) =======================
  const HorizontalOrgNode = ({ node, level = 0 }) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes[node.id] ?? true; // Default expanded for chart
    const hasImageError = imageErrors[node.id];
    const profilePic = node.profile_picture && !hasImageError ? getImageUrl(node.profile_picture) : null;

    return (
      <div className="flex items-start gap-8 relative">
        {/* Parent Card */}
        <div className="flex flex-col items-center relative z-10">
          <div 
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 w-72 group cursor-pointer"
            onClick={() => hasChildren && toggleNode(node.id)}
          >
            <div className="p-5">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 relative">
                  {profilePic ? (
                    <img
                      src={profilePic}
                      alt={`${node.first_name} ${node.last_name}`}
                      className="h-16 w-16 rounded-2xl object-cover ring-4 ring-white dark:ring-gray-700 shadow-md group-hover:ring-indigo-200 dark:group-hover:ring-indigo-800/70 transition-all"
                      onError={() => handleImageError(node.id)}
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-violet-600 flex items-center justify-center text-white font-semibold text-2xl shadow-md ring-4 ring-white dark:ring-gray-700">
                      {node.first_name?.charAt(0)}{node.last_name?.charAt(0)}
                    </div>
                  )}
                  {hasChildren && (
                    <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white text-[10px] font-mono w-5 h-5 rounded-full flex items-center justify-center ring-2 ring-white dark:ring-gray-800">
                      {node.children.length}
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-gray-900 dark:text-white text-base leading-tight">
                      {node.first_name} {node.last_name}
                    </p>
                    {hasChildren && (
                      <div className="text-gray-400 group-hover:text-indigo-500 transition-colors">
                        {isExpanded ? <ChevronDownIcon className="h-4 w-4" /> : <ChevronRightIcon className="h-4 w-4" />}
                      </div>
                    )}
                  </div>
                  {node.designation && (
                    <p className="text-sm text-indigo-600 dark:text-indigo-400 font-medium mt-0.5">
                      {node.designation}
                    </p>
                  )}
                  <div className="mt-3 text-xs text-gray-500 dark:text-gray-400 space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <BuildingOfficeIcon className="h-3.5 w-3.5" />
                      <span className="truncate">{node.department || "—"}</span>
                    </div>
                    {node.email && (
                      <div className="truncate font-mono">{node.email}</div>
                    )}
                    {node.employee_code && (
                      <div className="font-mono text-gray-400">#{node.employee_code}</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Bottom accent */}
            <div className="h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-violet-500 rounded-b-2xl"></div>
          </div>
        </div>

        {/* Connector & Children with Expand/Collapse */}
        <AnimatePresence initial={false}>
          {hasChildren && isExpanded && (
            <motion.div
              className="flex-1 relative pt-8"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
            >
              {/* Main horizontal connector from parent */}
              <div className="absolute top-8 left-0 w-8 h-px bg-gradient-to-r from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-500"></div>
              
              {/* Vertical connector line */}
              <div className="absolute top-8 left-8 bottom-0 w-px bg-gradient-to-b from-gray-300 via-gray-400 to-transparent dark:from-gray-600 dark:via-gray-500"></div>

              <div className="pl-16 flex flex-col gap-10">
                {node.children.map((child) => (
                  <div key={child.id} className="relative">
                    {/* Small horizontal connector to each child */}
                    <div className="absolute -left-8 top-8 w-8 h-px bg-gradient-to-r from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-500"></div>
                    <HorizontalOrgNode node={child} level={level + 1} />
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const renderHorizontalOrgChart = () => {
    const filteredRoots = searchTerm.trim()
      ? hierarchy.filter(root => filterTree(root, searchTerm))
      : hierarchy;

    if (filteredRoots.length === 0) {
      return (
        <div className="text-center py-16">
          <BuildingOfficeIcon className="mx-auto h-14 w-14 text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-gray-500 dark:text-gray-400">
            {searchTerm ? "No matching employees found." : "No hierarchy data available."}
          </p>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto overflow-y-auto p-8 bg-gray-50/70 dark:bg-gray-900/50 min-h-[600px] rounded-2xl">
        <div className="inline-flex flex-col gap-16">
          {filteredRoots.map(root => (
            <div key={root.id} className="relative">
              <HorizontalOrgNode node={root} />
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ======================= MAIN RENDER =======================
  if (loading) {
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-w-full mx-auto px-4"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/50">
            <BuildingOfficeIcon className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              Organization Hierarchy
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Visualize your company's complete reporting structure
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex rounded-xl border border-gray-200 dark:border-gray-700 p-1 bg-white dark:bg-gray-800 shadow-sm self-start">
          <button
            onClick={() => setActiveTab("tree")}
            className={`px-4 py-2 text-sm rounded-lg transition-all duration-200 flex items-center gap-2 ${
              activeTab === "tree"
                ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-400 shadow-sm"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
            }`}
          >
            <Bars3Icon className="h-4 w-4" />
            Tree View
          </button>
          <button
            onClick={() => setActiveTab("flowchart")}
            className={`px-4 py-2 text-sm rounded-lg transition-all duration-200 flex items-center gap-2 ${
              activeTab === "flowchart"
                ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-400 shadow-sm"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
            }`}
          >
            <ChartBarIcon className="h-4 w-4" />
            Org Chart
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search by name, title, or department..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm"
        />
      </div>

      {/* Content Container */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-4">
          {activeTab === "tree" ? (
            // Tree View
            <>
              {hierarchy.length === 0 ? (
                <div className="text-center py-16">
                  <BuildingOfficeIcon className="mx-auto h-14 w-14 text-gray-300 dark:text-gray-600 mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">
                    No hierarchy data available. Please assign managers to employees.
                  </p>
                </div>
              ) : (
                hierarchy.map(root => <TreeNode key={root.id} node={root} level={0} />)
              )}

              {/* Expand/Collapse All for Tree View */}
              {hierarchy.length > 0 && activeTab === "tree" && (
                <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                  <button
                    onClick={() => {
                      const expandAll = (nodes) => {
                        nodes.forEach(node => {
                          setExpandedNodes(prev => ({ ...prev, [node.id]: true }));
                          if (node.children?.length) expandAll(node.children);
                        });
                      };
                      expandAll(hierarchy);
                    }}
                    className="text-xs px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300 transition"
                  >
                    Expand All
                  </button>
                  <button
                    onClick={() => {
                      const collapseAll = (nodes) => {
                        nodes.forEach(node => {
                          setExpandedNodes(prev => ({ ...prev, [node.id]: false }));
                          if (node.children?.length) collapseAll(node.children);
                        });
                      };
                      collapseAll(hierarchy);
                    }}
                    className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 transition"
                  >
                    Collapse All
                  </button>
                </div>
              )}
            </>
          ) : (
            // Horizontal Org Chart
            renderHorizontalOrgChart()
          )}
        </div>
      </div>
    </motion.div>
  );
}