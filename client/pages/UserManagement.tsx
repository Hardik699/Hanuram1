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
          description={`Manage ${users.length} user${users.length !== 1 ? "s" : ""} and permissions`}
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
                className="prof-btn-primary whitespace-nowrap"
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
            className={
              messageType === "success"
                ? "prof-msg-success"
                : "prof-msg-error"
            }
          >
            <div className="flex items-center gap-3">
              {messageType === "success" ? (
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
              )}
              <span>{message}</span>
            </div>
          </div>
        )}

        {/* Create Form */}
        {showForm && (
          <div className="prof-form">
            <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-400 dark:to-blue-500 bg-clip-text text-transparent mb-6">
              {editingUserId ? "Edit User" : "Create New User"}
            </h3>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="prof-form-group">
                  <label className="prof-form-label">
                    Username
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Enter username"
                      value={formData.username}
                      onChange={(e) =>
                        setFormData({ ...formData, username: e.target.value })
                      }
                      disabled={!!editingUserId}
                      className="prof-form-input pl-10"
                    />
                  </div>
                </div>

                <div className="prof-form-group">
                  <label className="prof-form-label">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                    <input
                      type="email"
                      placeholder="Enter email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="prof-form-input pl-10"
                    />
                  </div>
                </div>

                {!editingUserId && (
                  <div className="prof-form-group">
                    <label className="prof-form-label">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                      <input
                        type="password"
                        placeholder="Enter password"
                        value={formData.password}
                        onChange={(e) =>
                          setFormData({ ...formData, password: e.target.value })
                        }
                        className="prof-form-input pl-10"
                      />
                    </div>
                  </div>
                )}

                <div className="prof-form-group">
                  <label className="prof-form-label">
                    Role
                  </label>
                  <select
                    value={formData.role_id}
                    onChange={(e) => {
                      setFormData({ ...formData, role_id: e.target.value });
                    }}
                    className="prof-form-select"
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
              <div className="mt-6 p-6 bg-slate-50 dark:bg-slate-700/50 rounded-2xl border-2 border-slate-200 dark:border-slate-700">
                <h4 className="text-sm font-bold text-blue-700 dark:text-blue-400 uppercase tracking-widest mb-6">
                  Module Access Control
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {AVAILABLE_MODULES.map((module) => {
                    const isChecked = selectedModules.includes(module.key);
                    return (
                      <label
                        key={module.key}
                        className={`flex items-start gap-3 p-4 rounded-xl cursor-pointer transition-all border-2 ${
                          isChecked
                            ? "bg-blue-50 dark:bg-blue-900/20 border-blue-500 shadow-elevation-2"
                            : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-800"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleModule(module.key)}
                          className="w-5 h-5 rounded border-2 border-blue-500 mt-0.5 flex-shrink-0 cursor-pointer accent-blue-600"
                        />
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-sm font-bold truncate ${
                              isChecked
                                ? "text-blue-700 dark:text-blue-300"
                                : "text-slate-700 dark:text-slate-300"
                            }`}
                          >
                            {module.label}
                          </p>
                          <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-500 uppercase">
                            {module.key}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-6">
                <button
                  type="submit"
                  className="prof-btn-primary flex-1"
                >
                  {editingUserId ? "Update User" : "Create User"}
                </button>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="prof-btn-secondary flex-1"
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
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-elevation-4 border border-slate-200 dark:border-slate-700 overflow-hidden animate-page-load">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="prof-table-head">
                  <tr>
                    <th className="prof-table-head-cell">
                      Username
                    </th>
                    <th className="prof-table-head-cell">
                      Email
                    </th>
                    <th className="prof-table-head-cell">
                      Role
                    </th>
                    <th className="prof-table-head-cell text-center">
                      Status
                    </th>
                    <th className="prof-table-head-cell">
                      Created
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {paginatedUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400 font-bold">
                        No users found
                      </td>
                    </tr>
                  ) : (
                    paginatedUsers.map((user, idx) => (
                      <tr
                        key={user._id}
                        className={cn(
                          "prof-table-row prof-table-row-hover",
                          idx % 2 === 0 && "prof-table-row-even"
                        )}
                        onClick={() => navigate(`/users/${user._id}`)}
                      >
                        <td className="prof-table-cell-bold text-blue-600 dark:text-blue-400">
                          {user.username}
                        </td>
                        <td className="prof-table-cell text-slate-600 dark:text-slate-400">
                          {user.email}
                        </td>
                        <td className="prof-table-cell font-bold text-slate-700 dark:text-slate-300">
                          {getRoleName(user.role_id)}
                        </td>
                        <td className="prof-table-cell text-center">
                          <span
                            className={
                              user.status === "active"
                                ? "prof-badge-green"
                                : "prof-badge-red"
                            }
                          >
                            {user.status === "active" ? "Active" : "Blocked"}
                          </span>
                        </td>
                        <td className="prof-table-cell text-slate-600 dark:text-slate-400 whitespace-nowrap">
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
              <div className="px-6 py-5 border-t-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between flex-wrap gap-4">
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
                    className="prof-form-select px-4 py-2 w-24 text-sm"
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
                    <span className="font-bold text-blue-600 dark:text-blue-400">
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
                      className="inline-flex items-center justify-center p-2 rounded-xl border-2 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-300 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      ←
                    </button>
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300 min-w-[100px] text-center">
                      Page{" "}
                      <span className="font-bold text-blue-600 dark:text-blue-400">
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
                      className="inline-flex items-center justify-center p-2 rounded-xl border-2 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-300 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
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
