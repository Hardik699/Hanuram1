import { useState, useEffect } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  Users,
  TrendingUp,
  DollarSign,
} from "lucide-react";
import { Layout } from "@/components/Layout";
import { toast } from "sonner";
import { ProfessionalPage, EmptyState } from "@/components/ProfessionalPage";
import {
  ProfessionalForm,
  FormGroup,
  FormActions,
} from "@/components/ProfessionalForm";
import { DataTable } from "@/components/DataTable";
import Modal from "@/components/ui/Modal";
import { cn } from "@/lib/utils";

interface Labour {
  id: string;
  _id?: string;
  code: string;
  name: string;
  department: string;
  salaryPerDay: number;
  createdAt?: string;
  updatedAt?: string;
}

export default function LabourManagement() {
  const [labour, setLabour] = useState<Labour[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    department: "",
    salaryPerDay: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Fetch labour list with retry logic
  const fetchLabour = async (retryCount = 0) => {
    setLoading(true);
    try {
      const response = await fetch("/api/labour", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (result.success && Array.isArray(result.data)) {
        setLabour(result.data);
      } else {
        throw new Error(result.message || "Failed to fetch labour");
      }
    } catch (error) {
      console.error("Error fetching labour:", error);

      // Retry logic: retry up to 3 times on failure
      if (retryCount < 3) {
        console.warn(`Retrying labour fetch (attempt ${retryCount + 1}/3)...`);
        setTimeout(() => fetchLabour(retryCount + 1), 1000 * (retryCount + 1));
      } else {
        toast.error(
          "Failed to fetch labour: " +
            (error instanceof Error ? error.message : "Unknown error"),
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLabour();
  }, []);

  const handleOpenDialog = (labourItem?: Labour) => {
    if (labourItem) {
      setEditingId(labourItem.id);
      setFormData({
        name: labourItem.name,
        department: labourItem.department,
        salaryPerDay: labourItem.salaryPerDay.toString(),
      });
    } else {
      setEditingId(null);
      setFormData({
        name: "",
        department: "",
        salaryPerDay: "",
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingId(null);
    setFormData({
      name: "",
      department: "",
      salaryPerDay: "",
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.department || !formData.salaryPerDay) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      const url = editingId ? `/api/labour/${editingId}` : "/api/labour";
      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          department: formData.department,
          salaryPerDay: parseFloat(formData.salaryPerDay),
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(
          editingId
            ? "Labour updated successfully"
            : "Labour added successfully",
        );
        fetchLabour();
        handleCloseDialog();
      } else {
        toast.error(result.message || "Failed to save labour");
      }
    } catch (error) {
      console.error("Error saving labour:", error);
      toast.error("Failed to save labour");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this labour?")) {
      return;
    }

    try {
      const response = await fetch(`/api/labour/${id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Labour deleted successfully");
        fetchLabour();
      } else {
        toast.error(result.message || "Failed to delete labour");
      }
    } catch (error) {
      console.error("Error deleting labour:", error);
      toast.error("Failed to delete labour");
    }
  };

  // Filter labour
  const filteredLabour = labour.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.department.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Pagination
  const totalPages = Math.ceil(filteredLabour.length / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const paginatedLabour = filteredLabour.slice(
    startIdx,
    startIdx + itemsPerPage,
  );

  // Calculate statistics
  const totalLabour = labour.length;
  const totalDailyCost = labour.reduce((sum, l) => sum + l.salaryPerDay, 0);
  const avgSalaryPerDay =
    labour.length > 0 ? totalDailyCost / labour.length : 0;

  return (
    <Layout>
      <ProfessionalPage
        title="Labour Management"
        description="Manage factory labour and track salary costs"
        headerAction={
          <button
            onClick={() => handleOpenDialog()}
            className="prof-btn-primary"
          >
            <Plus className="w-4 h-4" />
            <span>Add Labour</span>
          </button>
        }
      >
        <div className="space-y-6">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in-up">
            <div className="prof-card">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="prof-form-label mb-1">Total Labour</p>
                  <h3 className="text-4xl font-black text-blue-600 dark:text-blue-400">
                    {totalLabour}
                  </h3>
                </div>
                <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-xl">
                  <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <div className="h-1.5 w-full bg-blue-100 dark:bg-blue-900/30 rounded-full overflow-hidden">
                <div className="h-full w-full bg-blue-600 rounded-full"></div>
              </div>
            </div>

            <div className="prof-card">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="prof-form-label mb-1">Total Daily Cost</p>
                  <h3 className="text-4xl font-black text-green-600 dark:text-green-400">
                    ₹
                    {totalDailyCost.toLocaleString("en-IN", {
                      maximumFractionDigits: 0,
                    })}
                  </h3>
                </div>
                <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-xl">
                  <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <div className="h-1.5 w-full bg-green-100 dark:bg-green-900/30 rounded-full overflow-hidden">
                <div className="h-full w-full bg-green-600 rounded-full"></div>
              </div>
            </div>

            <div className="prof-card">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="prof-form-label mb-1">Avg Salary/Day</p>
                  <h3 className="text-4xl font-black text-amber-600 dark:text-amber-400">
                    ₹
                    {avgSalaryPerDay.toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </h3>
                </div>
                <div className="bg-amber-100 dark:bg-amber-900/30 p-3 rounded-xl">
                  <TrendingUp className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
              <div className="h-1.5 w-full bg-amber-100 dark:bg-amber-900/30 rounded-full overflow-hidden">
                <div className="h-full w-full bg-amber-600 rounded-full"></div>
              </div>
            </div>
          </div>

          {/* Labour Table */}
          <div className="prof-section">
            {loading ? (
              <div className="p-12 text-center">
                <LoadingSpinner message="Loading labour data..." />
              </div>
            ) : labour.length === 0 ? (
              <EmptyState
                icon={<Users size={48} />}
                title="No Labour Found"
                description="Add your first labour record to start tracking daily costs."
                action={
                  <button
                    onClick={() => handleOpenDialog()}
                    className="prof-btn-primary"
                  >
                    Add First Labour
                  </button>
                }
              />
            ) : (
              <DataTable
                data={labour}
                searchPlaceholder="Search by name, code, or department..."
                columns={[
                  {
                    key: "code",
                    label: "Labour ID",
                    render: (val) => (
                      <span className="prof-badge-blue">{val}</span>
                    ),
                  },
                  {
                    key: "name",
                    label: "Full Name",
                    className: "font-bold text-slate-900 dark:text-white",
                  },
                  {
                    key: "department",
                    label: "Department",
                    render: (val) => (
                      <span className="prof-badge-purple">{val}</span>
                    ),
                  },
                  {
                    key: "salaryPerDay",
                    label: "Salary / Day",
                    render: (val) => (
                      <span className="font-bold text-green-700 dark:text-green-400">
                        ₹
                        {val.toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    ),
                  },
                  {
                    key: "id",
                    label: "Actions",
                    className: "text-right",
                    render: (_, row) => (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenDialog(row)}
                          className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-blue-600 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(row.id)}
                          className="p-2 hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ),
                  },
                ]}
              />
            )}
          </div>
        </div>
      </ProfessionalPage>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={openDialog}
        onClose={handleCloseDialog}
        title={editingId ? "Edit Labour Information" : "Add New Labour"}
      >
        <ProfessionalForm onSubmit={handleSave} onCancel={handleCloseDialog}>
          <div className="grid grid-cols-1 gap-6">
            <FormGroup label="Labour Name *">
              <input
                type="text"
                placeholder="e.g., John Doe"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="prof-form-input"
                required
              />
            </FormGroup>

            <FormGroup label="Department *">
              <input
                type="text"
                placeholder="e.g., Production, Packing"
                value={formData.department}
                onChange={(e) =>
                  setFormData({ ...formData, department: e.target.value })
                }
                className="prof-form-input"
                required
              />
            </FormGroup>

            <FormGroup label="Salary / Day (₹) *">
              <input
                type="number"
                step="0.01"
                placeholder="e.g., 500"
                value={formData.salaryPerDay}
                onChange={(e) =>
                  setFormData({ ...formData, salaryPerDay: e.target.value })
                }
                className="prof-form-input"
                required
              />
            </FormGroup>
          </div>

          <FormActions>
            <button type="submit" className="prof-btn-primary">
              {editingId ? "Update Labour" : "Add Labour"}
            </button>
            <button
              type="button"
              onClick={handleCloseDialog}
              className="prof-btn-secondary"
            >
              Cancel
            </button>
          </FormActions>
        </ProfessionalForm>
      </Modal>
    </Layout>
  );
}
