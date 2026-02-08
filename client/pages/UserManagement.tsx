import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { PageHeader } from "@/components/PageHeader";
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
  Users,
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
        <PageHeader
          title="User Management"
          description={`Manage ${users.length} user${users.length !== 1 ? 's' : ''} and permissions`}
          breadcrumbs={[{ label: "User Management" }]}
          icon={<Users className="w-6 h-6 text-teal-600 dark:text-teal-400" />}
          actions={
            !showForm ? (
              <button
                onClick={() => {
                  setShowForm(!showForm);
                  if (!showForm) {
                    setMessage("");
                  }
                }}
                className="flex items-center gap-2 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white font-bold py-2.5 px-5 rounded-xl transition-all shadow-elevation-3 hover:shadow-elevation-5 transform hover:scale-105 hover:-translate-y-0.5 whitespace-nowrap text-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Add User</span>
              </button>
            ) : null
          }
        />

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
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-8">
            <h3 className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-teal-700 dark:from-teal-400 dark:to-teal-500 bg-clip-text text-transparent mb-6">
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

              <div className="flex gap-3 pt-6">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white font-bold py-2.5 px-4 rounded-lg transition-all shadow-md hover:shadow-lg transform hover:scale-105"
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
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-800 dark:from-indigo-900 dark:via-indigo-900 dark:to-indigo-950 border-b-2 border-indigo-700 dark:border-indigo-800 sticky top-0">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider whitespace-nowrap">
                      Username
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider whitespace-nowrap">
                      Role
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider whitespace-nowrap">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider whitespace-nowrap">
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
                    paginatedUsers.map((user, idx) => (
                      <tr
                        key={user._id}
                        className={`transition-all group border-l-4 border-l-transparent hover:border-l-indigo-500 cursor-pointer ${
                          idx % 2 === 0
                            ? "hover:bg-indigo-50 dark:hover:bg-slate-700/50"
                            : "bg-slate-50 dark:bg-slate-800/50 hover:bg-indigo-50 dark:hover:bg-slate-700/50"
                        }`}
                        onClick={() => navigate(`/users/${user._id}`)}
                      >
                        <td className="px-6 py-4 text-sm font-semibold text-indigo-600 dark:text-indigo-400 cursor-pointer group-hover:text-indigo-700 dark:group-hover:text-indigo-300 transition-colors">
                          {user.username}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400 cursor-pointer">
                          {user.email}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                          {getRoleName(user.role_id)}
                        </td>
                        <td className="px-6 py-4 text-sm cursor-pointer">
                          <span
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold inline-block ${
                              user.status === "active"
                                ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                                : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                            }`}
                          >
                            {user.status === "active" ? "Active" : "Blocked"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400 cursor-pointer whitespace-nowrap">
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
              <div className="px-6 py-5 border-t-2 border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-indigo-50 dark:from-slate-800/50 dark:to-slate-800/30 flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    Items per page:
                  </span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(parseInt(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="px-4 py-2 rounded-lg bg-white dark:bg-slate-700 border-2 border-teal-200 dark:border-teal-900/50 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all font-semibold hover:border-teal-300"
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

                <div className="flex items-center gap-6">
                  <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                    <span className="font-bold text-teal-600 dark:text-teal-400">
                      {(currentPage - 1) * itemsPerPage + 1}-
                      {Math.min(currentPage * itemsPerPage, users.length)}
                    </span>{" "}
                    of{" "}
                    <span className="font-bold text-slate-900 dark:text-slate-200">
                      {users.length}
                    </span>
                  </span>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(prev - 1, 1))
                      }
                      disabled={currentPage === 1}
                      className="inline-flex items-center justify-center p-2.5 rounded-lg border-2 border-teal-300 dark:border-teal-900/50 text-teal-600 dark:text-teal-400 hover:bg-teal-100 dark:hover:bg-teal-900/30 disabled:opacity-40 disabled:cursor-not-allowed disabled:border-slate-300 disabled:text-slate-400 transition-all hover:border-teal-500 dark:hover:border-teal-800"
                    >
                      ←
                    </button>
                    <span className="text-sm font-semibold text-slate-600 dark:text-slate-400 min-w-[100px] text-center">
                      Page{" "}
                      <span className="font-bold text-teal-600 dark:text-teal-400">
                        {currentPage}
                      </span>{" "}
                      of{" "}
                      <span className="font-bold text-slate-900 dark:text-slate-200">
                        {totalPages}
                      </span>
                    </span>
                    <button
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                      }
                      disabled={currentPage === totalPages}
                      className="inline-flex items-center justify-center p-2.5 rounded-lg border-2 border-teal-300 dark:border-teal-900/50 text-teal-600 dark:text-teal-400 hover:bg-teal-100 dark:hover:bg-teal-900/30 disabled:opacity-40 disabled:cursor-not-allowed disabled:border-slate-300 disabled:text-slate-400 transition-all hover:border-teal-500 dark:hover:border-teal-800"
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
