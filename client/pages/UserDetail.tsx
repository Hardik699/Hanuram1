import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { PageHeader } from "@/components/PageHeader";
import { ArrowLeft, Trash2, Lock, Unlock, Check, User, Mail } from "lucide-react";
import { toast } from "sonner";

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
  _id: string;
  permission_id: number;
  permission_key: string;
  description: string;
}

const roleMap: Record<number, string> = {
  1: "Super Admin",
  2: "Admin",
  3: "Manager",
  4: "Vendor",
  5: "Viewer",
};

export default function UserDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [isManagingPermissions, setIsManagingPermissions] = useState(false);
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    role_id: 2,
  });

  // Fetch user details and permissions
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch user details
        const userResponse = await fetch(`/api/users/${id}`);
        if (!userResponse.ok) throw new Error("Failed to fetch user");
        const userData = await userResponse.json();

        if (userData.success) {
          setUser(userData.user);
          setFormData({
            username: userData.user.username,
            email: userData.user.email,
            role_id: userData.user.role_id,
          });
        }

        // Fetch all permissions
        const permResponse = await fetch("/api/permissions");
        if (permResponse.ok) {
          const permData = await permResponse.json();
          if (permData.success && Array.isArray(permData.data)) {
            setAllPermissions(permData.data);
          }
        }

        // Fetch user permissions
        const userPermResponse = await fetch(`/api/users/${id}/permissions`);
        if (userPermResponse.ok) {
          const userPermData = await userPermResponse.json();
          if (userPermData.success && Array.isArray(userPermData.data)) {
            setUserPermissions(userPermData.data);
            setSelectedPermissions(new Set(userPermData.data));
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load user details");
        navigate("/users");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchData();
  }, [id, navigate]);

  const handleUpdateUser = async () => {
    try {
      const response = await fetch(`/api/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (data.success) {
        toast.success("User updated successfully");
        setUser({ ...user!, ...formData });
        setIsEditing(false);
      } else {
        toast.error(data.message || "Failed to update user");
      }
    } catch (error) {
      console.error("Error updating user:", error);
      toast.error("Failed to update user");
    }
  };

  const handleToggleStatus = async () => {
    if (!window.confirm(
      `Are you sure you want to ${user?.status === "active" ? "block" : "unblock"} this user?`
    )) {
      return;
    }

    try {
      const newStatus = user?.status === "active" ? "blocked" : "active";
      const response = await fetch(`/api/users/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();
      if (data.success) {
        setUser({ ...user!, status: newStatus as "active" | "blocked" });
        toast.success(
          `User ${newStatus === "active" ? "unblocked" : "blocked"} successfully`
        );
      } else {
        toast.error(data.message || "Failed to update status");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status");
    }
  };

  const handleDeleteUser = async () => {
    if (!window.confirm("Are you sure you want to delete this user?")) {
      return;
    }

    try {
      const response = await fetch(`/api/users/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();
      if (data.success) {
        toast.success("User deleted successfully");
        navigate("/users");
      } else {
        toast.error(data.message || "Failed to delete user");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Failed to delete user");
    }
  };

  const handleSavePermissions = async () => {
    try {
      const response = await fetch(`/api/users/${id}/permissions`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permissions: Array.from(selectedPermissions) }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success("Permissions updated successfully");
        setUserPermissions(Array.from(selectedPermissions));
        setIsManagingPermissions(false);
      } else {
        toast.error(data.message || "Failed to update permissions");
      }
    } catch (error) {
      console.error("Error updating permissions:", error);
      toast.error("Failed to update permissions");
    }
  };

  const togglePermission = (permissionKey: string) => {
    const newSelected = new Set(selectedPermissions);
    if (newSelected.has(permissionKey)) {
      newSelected.delete(permissionKey);
    } else {
      newSelected.add(permissionKey);
    }
    setSelectedPermissions(newSelected);
  };

  if (loading) {
    return <LoadingSpinner message="Loading user details..." fullScreen />;
  }

  if (!user) {
    return (
      <Layout>
        <div className="p-6 text-center">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            User not found
          </h1>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <PageHeader
          title={user?.username || "User Details"}
          description={user?.email || "Loading..."}
          breadcrumbs={[
            { label: "Users", href: "/users" },
            { label: user?.username || "Details" },
          ]}
          icon={<User className="w-6 h-6 text-teal-600 dark:text-teal-400" />}
          actions={
            !isEditing ? (
              <Button
                onClick={() => setIsEditing(true)}
                className="bg-teal-600 hover:bg-teal-700"
              >
                Edit User
              </Button>
            ) : null
          }
        />

        {/* User Details Card */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-8">

          {isEditing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Role
                </label>
                <select
                  value={formData.role_id}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      role_id: parseInt(e.target.value),
                    })
                  }
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value={1}>Super Admin</option>
                  <option value={2}>Admin</option>
                  <option value={3}>Manager</option>
                  <option value={4}>Vendor</option>
                  <option value={5}>Viewer</option>
                </select>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleUpdateUser}
                  className="bg-teal-600 hover:bg-teal-700"
                >
                  Save Changes
                </Button>
                <Button
                  onClick={() => setIsEditing(false)}
                  className="bg-slate-300 hover:bg-slate-400 text-slate-900"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Email
                </p>
                <p className="text-lg font-medium text-slate-900 dark:text-white">
                  {user.email}
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Role
                </p>
                <p className="text-lg font-medium text-slate-900 dark:text-white">
                  {roleMap[user.role_id] || "Unknown"}
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Status
                </p>
                <span
                  className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                    user.status === "active"
                      ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
                      : "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300"
                  }`}
                >
                  {user.status === "active" ? "Active" : "Blocked"}
                </span>
              </div>

              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Created
                </p>
                <p className="text-lg font-medium text-slate-900 dark:text-white">
                  {new Date(user.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        {!isEditing && (
          <div className="flex gap-3 mb-6">
            <Button
              onClick={handleToggleStatus}
              className={`flex items-center gap-2 ${
                user.status === "active"
                  ? "bg-blue-600 hover:bg-blue-700"
                  : "bg-green-600 hover:bg-green-700"
              }`}
            >
              {user.status === "active" ? (
                <>
                  <Lock className="w-4 h-4" />
                  Block User
                </>
              ) : (
                <>
                  <Unlock className="w-4 h-4" />
                  Unblock User
                </>
              )}
            </Button>

            <Button
              onClick={handleDeleteUser}
              className="bg-red-600 hover:bg-red-700 flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete User
            </Button>
          </div>
        )}

        {/* Permissions Management Card */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              Permissions
            </h2>
            {!isManagingPermissions && (
              <Button
                onClick={() => setIsManagingPermissions(true)}
                className="bg-teal-600 hover:bg-teal-700"
              >
                Manage Permissions
              </Button>
            )}
          </div>

          {isManagingPermissions ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {allPermissions.map((permission) => (
                  <button
                    key={permission.permission_id}
                    onClick={() => togglePermission(permission.permission_key)}
                    className={`p-4 rounded-lg border-2 transition text-left ${
                      selectedPermissions.has(permission.permission_key)
                        ? "border-teal-500 bg-teal-50 dark:bg-teal-900/20"
                        : "border-slate-200 dark:border-slate-600 hover:border-teal-300"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center transition ${
                        selectedPermissions.has(permission.permission_key)
                          ? "bg-teal-500 border-teal-500"
                          : "border-slate-300 dark:border-slate-500"
                      }`}>
                        {selectedPermissions.has(permission.permission_key) && (
                          <Check className="w-3 h-3 text-white" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-slate-900 dark:text-white">
                          {permission.permission_key}
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                          {permission.description}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-600">
                <Button
                  onClick={handleSavePermissions}
                  className="bg-teal-600 hover:bg-teal-700"
                >
                  Save Permissions
                </Button>
                <Button
                  onClick={() => {
                    setIsManagingPermissions(false);
                    setSelectedPermissions(new Set(userPermissions));
                  }}
                  className="bg-slate-300 hover:bg-slate-400 text-slate-900"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div>
              {userPermissions.length === 0 ? (
                <p className="text-slate-600 dark:text-slate-400">
                  No permissions assigned
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {userPermissions.map((permKey) => {
                    const perm = allPermissions.find((p) => p.permission_key === permKey);
                    return (
                      <div
                        key={permKey}
                        className="p-3 bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 rounded-lg"
                      >
                        <p className="font-medium text-slate-900 dark:text-white">
                          {permKey}
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                          {perm?.description}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
