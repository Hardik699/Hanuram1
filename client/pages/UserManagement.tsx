import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useAuth } from "@/hooks/useAuth";
import {
  Plus,
  Trash2,
  Edit,
  Lock,
  Mail,
  User,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

interface User {
  _id: string;
  username: string;
  email: string;
  role_id: number;
  status: "active" | "blocked";
  createdAt: string;
}

interface Role {
  role_id: number;
  role_name: string;
}

interface Permission {
  permission_id: number;
  permission_key: string;
  description: string;
}

// Available modules for assignment
const AVAILABLE_MODULES = [
  { key: "DASHBOARD", label: "Dashboard" },
  { key: "CATEGORY_UNIT", label: "Category & Unit" },
  { key: "RAW_MATERIAL", label: "Raw Material" },
  { key: "LABOUR", label: "Labour" },
  { key: "RAW_MATERIAL_COSTING", label: "Raw Material Costing" },
  { key: "USER_MANAGEMENT", label: "User Management" },
  { key: "REPORTS", label: "Reports" },
  { key: "SETTINGS", label: "Settings" },
];

export default function UserManagement() {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">(
    "success",
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedModules, setSelectedModules] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    role_id: "2",
  });
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!hasPermission("user_manage")) {
      navigate("/raw-materials");
      return;
    }

    fetchUsers();
    fetchRoles();
    fetchPermissions();
  }, [hasPermission, navigate]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/users");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        setUsers(data.data);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      setMessage("Failed to fetch users");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await fetch("/api/roles");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        setRoles(data.data);
      }
    } catch (error) {
      console.error("Error fetching roles:", error);
    }
  };

  const fetchPermissions = async () => {
    try {
      const response = await fetch("/api/permissions");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        setPermissions(data.data);
      }
    } catch (error) {
      console.error("Error fetching permissions:", error);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    if (
      !formData.username.trim() ||
      !formData.email.trim() ||
      !formData.password
    ) {
      setMessage("All fields are required");
      setMessageType("error");
      return;
    }

    if (selectedModules.length === 0) {
      setMessage("Please select at least one module");
      setMessageType("error");
      return;
    }

    try {
      if (editingUserId) {
        // Update existing user
        const response = await fetch(`/api/users/${editingUserId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: formData.email,
            role_id: parseInt(formData.role_id),
            modules: selectedModules,
          }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          setMessage("User updated successfully");
          setMessageType("success");
          setFormData({ username: "", email: "", password: "", role_id: "2" });
          setSelectedModules([]);
          setShowForm(false);
          setEditingUserId(null);
          fetchUsers();
        } else {
          setMessage(data.message || "Failed to update user");
          setMessageType("error");
        }
      } else {
        // Create new user
        const response = await fetch("/api/users", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...formData,
            role_id: parseInt(formData.role_id),
            modules: selectedModules,
          }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          setMessage("User created successfully");
          setMessageType("success");
          setFormData({ username: "", email: "", password: "", role_id: "2" });
          setSelectedModules([]);
          setShowForm(false);
          fetchUsers();
        } else {
          setMessage(data.message || "Failed to create user");
          setMessageType("error");
        }
      }
    } catch (error) {
      console.error("Error saving user:", error);
      setMessage("Connection error. Please try again.");
      setMessageType("error");
    }
  };

  const handleEditUser = async (user: User) => {
    try {
      // Fetch user with modules
      const response = await fetch(`/api/users/${user._id}`);
      const data = await response.json();

      if (data.success && data.data) {
        const userData = data.data;
        setFormData({
          username: userData.username,
          email: userData.email,
          password: "",
          role_id: userData.role_id.toString(),
        });
        setSelectedModules(userData.modules || []);
        setEditingUserId(user._id);
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch (error) {
      console.error("Error fetching user:", error);
      setMessage("Failed to load user details");
      setMessageType("error");
    }
  };

  const handleCancelEdit = () => {
    setFormData({ username: "", email: "", password: "", role_id: "2" });
    setSelectedModules([]);
    setShowForm(false);
    setEditingUserId(null);
  };

  const handleDeleteUser = async (userId: string, username: string) => {
    if (
      !window.confirm(
        `Are you sure you want to delete user "${username}"? This action cannot be undone.`,
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setMessage("User deleted successfully");
        setMessageType("success");
        fetchUsers();
      } else {
        setMessage("Failed to delete user");
        setMessageType("error");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      setMessage("Connection error. Please try again.");
      setMessageType("error");
    }
  };

  const handleToggleStatus = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "blocked" : "active";

    try {
      const response = await fetch(`/api/users/${userId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(`User ${newStatus} successfully`);
        setMessageType("success");
        fetchUsers();
      } else {
        setMessage(data.message || "Failed to update user status");
        setMessageType("error");
      }
    } catch (error) {
      console.error("Error updating user status:", error);
      setMessage("Connection error. Please try again.");
      setMessageType("error");
    }
  };

  const getRoleName = (roleId: number) => {
    return roles.find((r) => r.role_id === roleId)?.role_name || "Unknown";
  };

  const handleToggleModule = (moduleKey: string) => {
    setSelectedModules((prev) =>
      prev.includes(moduleKey)
        ? prev.filter((key) => key !== moduleKey)
        : [...prev, moduleKey],
    );
  };

  const paginatedUsers = users.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const totalPages = Math.ceil(users.length / itemsPerPage);

  return (
    <Layout title="User Management">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            All Users <span className="text-teal-600">({users.length})</span>
          </h2>
          <button
            onClick={() => {
              setShowForm(!showForm);
              if (!showForm) {
                setMessage("");
              }
            }}
            className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add User
          </button>
        </div>

        {/* Messages */}
        {message && (
          <div
            className={`flex items-center gap-3 p-4 rounded-lg border ${
              messageType === "success"
                ? "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800"
                : "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800"
            }`}
          >
            {messageType === "success" ? (
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
            )}
            <span
              className={`text-sm font-medium ${
                messageType === "success"
                  ? "text-green-700 dark:text-green-300"
                  : "text-red-700 dark:text-red-300"
              }`}
            >
              {message}
            </span>
          </div>
        )}

        {/* Create Form */}
        {showForm && (
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">
              Create New User
            </h3>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Username
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Enter username"
                      value={formData.username}
                      onChange={(e) =>
                        setFormData({ ...formData, username: e.target.value })
                      }
                      className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                    <input
                      type="email"
                      placeholder="Enter email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                    <input
                      type="password"
                      placeholder="Enter password"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Role
                  </label>
                  <select
                    value={formData.role_id}
                    onChange={(e) => {
                      setFormData({ ...formData, role_id: e.target.value });
                    }}
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  >
                    {roles.map((role, idx) => (
                      <option
                        key={role.role_id || `role-${idx}`}
                        value={role.role_id}
                      >
                        {role.role_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Modules Selection */}
              <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600">
                <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">
                  Select Modules to Grant Access
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {AVAILABLE_MODULES.map((module) => {
                    const isChecked = selectedModules.includes(module.key);
                    return (
                      <label
                        key={module.key}
                        className={`flex items-start gap-3 p-3 rounded cursor-pointer transition-all border ${
                          isChecked
                            ? "bg-teal-50 dark:bg-teal-900/30 border-teal-300 dark:border-teal-700"
                            : "border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700/50"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleModule(module.key)}
                          className="w-5 h-5 rounded border-2 border-teal-500 mt-0.5 flex-shrink-0 cursor-pointer accent-teal-500"
                        />
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-sm font-medium ${
                              isChecked
                                ? "text-teal-700 dark:text-teal-300"
                                : "text-slate-700 dark:text-slate-300"
                            }`}
                          >
                            {module.label}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {module.key}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors"
                >
                  Create User
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setSelectedModules([]);
                    setMessage("");
                  }}
                  className="flex-1 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-900 dark:text-white font-semibold py-2.5 px-4 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Users Table */}
        {loading ? (
          <LoadingSpinner message="Loading users..." />
        ) : (
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead className="bg-slate-100 dark:bg-slate-700 border-b border-slate-200 dark:border-slate-600">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Username
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Created
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {paginatedUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center">
                        <p className="text-slate-600 dark:text-slate-400">
                          No users found
                        </p>
                      </td>
                    </tr>
                  ) : (
                    paginatedUsers.map((user) => (
                      <tr
                        key={user._id}
                        className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors cursor-pointer"
                        onClick={() => navigate(`/users/${user._id}`)}
                      >
                        <td className="px-6 py-4 text-sm font-medium text-teal-600 dark:text-teal-400 hover:underline">
                          {user.username}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                          {user.email}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                          {getRoleName(user.role_id)}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              user.status === "active"
                                ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
                                : "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300"
                            }`}
                          >
                            {user.status === "active" ? "Active" : "Blocked"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {users.length > 0 && (
              <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    Items per page:
                  </span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(parseInt(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="px-3 py-1.5 rounded-md bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                  >
                    <option key="items-10" value="10">
                      10
                    </option>
                    <option key="items-20" value="20">
                      20
                    </option>
                    <option key="items-30" value="30">
                      30
                    </option>
                  </select>
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    {(currentPage - 1) * itemsPerPage + 1} -{" "}
                    {Math.min(currentPage * itemsPerPage, users.length)} of{" "}
                    {users.length}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(prev - 1, 1))
                      }
                      disabled={currentPage === 1}
                      className="inline-flex items-center justify-center p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      ←
                    </button>
                    <span className="text-sm text-slate-600 dark:text-slate-400 min-w-[60px] text-center">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                      }
                      disabled={currentPage === totalPages}
                      className="inline-flex items-center justify-center p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      →
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
