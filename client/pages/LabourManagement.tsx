import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Search, Users, TrendingUp, DollarSign } from "lucide-react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

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
          editingId ? "Labour updated successfully" : "Labour added successfully"
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
  const filteredLabour = labour.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination
  const totalPages = Math.ceil(filteredLabour.length / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const paginatedLabour = filteredLabour.slice(
    startIdx,
    startIdx + itemsPerPage
  );

  // Calculate statistics
  const totalLabour = labour.length;
  const totalDailyCost = labour.reduce((sum, l) => sum + l.salaryPerDay, 0);
  const avgSalaryPerDay = labour.length > 0 ? totalDailyCost / labour.length : 0;

  return (
    <Layout
      title="Labour Management"
      headerActions={
        <Button
          onClick={() => handleOpenDialog()}
          className="flex-shrink-0"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Labour
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Total Labour Card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-slate-600 text-sm font-semibold uppercase tracking-wider">Total Labour</p>
                <h3 className="text-3xl sm:text-4xl font-bold mt-2 text-slate-900">{totalLabour}</h3>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <p className="text-slate-600 text-xs font-medium">Factory workers</p>
          </div>

          {/* Total Daily Cost Card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-slate-600 text-sm font-semibold uppercase tracking-wider">Total Daily Cost</p>
                <h3 className="text-2xl sm:text-3xl font-bold mt-2 text-slate-900">₹{totalDailyCost.toFixed(0)}</h3>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <p className="text-slate-600 text-xs font-medium">Daily salary total</p>
          </div>

          {/* Average Salary Card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 sm:col-span-2 lg:col-span-1">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-slate-600 text-sm font-semibold uppercase tracking-wider">Avg Salary/Day</p>
                <h3 className="text-2xl sm:text-3xl font-bold mt-2 text-slate-900">₹{avgSalaryPerDay.toFixed(2)}</h3>
              </div>
              <div className="bg-orange-100 p-3 rounded-lg">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <p className="text-slate-600 text-xs font-medium">Per worker average</p>
          </div>
        </div>

        {/* Labour Header and Search */}
        <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6 border border-slate-100">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex-1 w-full sm:max-w-md">
              <div className="relative">
                <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                <Input
                  placeholder="Search by name, code, or department..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-12 border-2 border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent rounded-lg"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Labour Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-slate-600">
              <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <p className="mt-2">Loading labour...</p>
            </div>
          ) : paginatedLabour.length === 0 ? (
            <div className="p-8 text-center text-slate-600">
              {filteredLabour.length === 0
                ? "No labour found. Add your first labour to get started."
                : "No results found."}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gradient-to-r from-blue-600 to-blue-700 border-b-2 border-blue-700 sticky top-0">
                    <tr>
                      <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold text-white uppercase tracking-widest">
                        Labour ID
                      </th>
                      <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold text-white uppercase tracking-widest">
                        Name
                      </th>
                      <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold text-white uppercase tracking-widest">
                        Department
                      </th>
                      <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold text-white uppercase tracking-widest">
                        Salary / Day
                      </th>
                      <th className="px-3 sm:px-6 py-3 sm:py-4 text-right text-xs font-bold text-white uppercase tracking-widest">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {paginatedLabour.map((item, idx) => (
                      <tr
                        key={item.id}
                        className={`transition-all group border-l-4 border-l-transparent hover:border-l-blue-500 ${
                          idx % 2 === 0
                            ? "hover:bg-slate-50"
                            : "bg-slate-50 hover:bg-slate-100"
                        }`}
                      >
                        <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-bold text-white cursor-pointer transition-colors">
                          <span className="inline-flex items-center justify-center px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 text-xs sm:text-sm">
                            {item.code}
                          </span>
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                          {item.name}
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium text-slate-700">
                          <span className="inline-block px-2 sm:px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-semibold">
                            {item.department}
                          </span>
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-bold text-blue-600">
                          ₹{item.salaryPerDay.toFixed(2)}
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 text-right">
                          <div className="flex justify-end gap-1 sm:gap-2">
                            <button
                              onClick={() => handleOpenDialog(item)}
                              className="p-2 hover:bg-blue-100 rounded-lg transition-colors text-blue-600 text-xs sm:text-sm"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="p-2 hover:bg-red-100 rounded-lg transition-colors text-red-600"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-4 sm:px-6 py-4 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50">
                  <div className="text-xs sm:text-sm font-semibold text-slate-600">
                    Showing <span className="font-bold text-blue-600">{startIdx + 1}</span> to <span className="font-bold text-blue-600">{Math.min(startIdx + itemsPerPage, filteredLabour.length)}</span> of{" "}
                    <span className="font-bold text-slate-900">{filteredLabour.length}</span> labour
                  </div>
                  <div className="flex gap-2 flex-wrap justify-center sm:justify-end">
                    <Button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="border-2 border-blue-300 text-blue-600 hover:bg-blue-100 disabled:opacity-40 disabled:cursor-not-allowed text-xs sm:text-sm"
                    >
                      Previous
                    </Button>
                    <div className="flex items-center gap-1 sm:gap-2">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`w-6 h-6 sm:w-8 sm:h-8 rounded-lg transition-colors font-semibold text-xs sm:text-sm ${
                            currentPage === page
                              ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white"
                              : "hover:bg-slate-200 text-slate-700"
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>
                    <Button
                      onClick={() =>
                        setCurrentPage(Math.min(totalPages, currentPage + 1))
                      }
                      disabled={currentPage === totalPages}
                      className="border-2 border-blue-300 text-blue-600 hover:bg-blue-100 disabled:opacity-40 disabled:cursor-not-allowed text-xs sm:text-sm"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="sm:max-w-md w-[95vw]">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit Labour" : "Add Labour"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Labour Name *</Label>
              <Input
                id="name"
                placeholder="e.g., John Doe"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">Department *</Label>
              <Input
                id="department"
                placeholder="e.g., Production, Packing"
                value={formData.department}
                onChange={(e) =>
                  setFormData({ ...formData, department: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="salaryPerDay">Salary Per Day (₹) *</Label>
              <Input
                id="salaryPerDay"
                type="number"
                placeholder="e.g., 500"
                value={formData.salaryPerDay}
                onChange={(e) =>
                  setFormData({ ...formData, salaryPerDay: e.target.value })
                }
                required
                step="0.01"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                onClick={handleCloseDialog}
                className="border-2 border-slate-300 text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </Button>
              <Button type="submit">
                {editingId ? "Update Labour" : "Add Labour"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
