import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Search, Users, TrendingUp, DollarSign } from "lucide-react";
import { Layout } from "@/components/Layout";
import { PageHeader } from "@/components/PageHeader";
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
    <Layout>
      <PageHeader
        title="Labour Management"
        description="Manage factory labour and track salary costs"
        breadcrumbs={[
          { label: "Category/Unit", path: "#" },
          { label: "Labour", path: "/labour" },
        ]}
        icon={<Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />}
        actions={
          <Button
            onClick={() => handleOpenDialog()}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-2.5 px-5 rounded-xl transition-all shadow-elevation-3 hover:shadow-elevation-5 transform hover:scale-105 hover:-translate-y-0.5 whitespace-nowrap text-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Labour
          </Button>
        }
      />

      <div className="space-y-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Total Labour Card */}
          <div className="bg-gradient-to-br from-indigo-500 via-indigo-600 to-indigo-700 dark:from-indigo-900 dark:to-indigo-950 rounded-2xl p-6 shadow-lg border border-indigo-400/30 dark:border-indigo-800/30 text-white">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-indigo-100 text-sm font-semibold uppercase tracking-wide">Total Labour</p>
                <h3 className="text-4xl font-bold mt-2">{totalLabour}</h3>
              </div>
              <div className="bg-indigo-400/30 dark:bg-indigo-800/50 p-3 rounded-lg">
                <Users className="w-6 h-6 text-indigo-200" />
              </div>
            </div>
            <p className="text-indigo-200 text-xs font-medium">Factory workers</p>
          </div>

          {/* Total Daily Cost Card */}
          <div className="bg-gradient-to-br from-purple-500 via-purple-600 to-purple-700 dark:from-purple-900 dark:to-purple-950 rounded-2xl p-6 shadow-lg border border-purple-400/30 dark:border-purple-800/30 text-white">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-purple-100 text-sm font-semibold uppercase tracking-wide">Total Daily Cost</p>
                <h3 className="text-3xl font-bold mt-2">₹{totalDailyCost.toFixed(0)}</h3>
              </div>
              <div className="bg-purple-400/30 dark:bg-purple-800/50 p-3 rounded-lg">
                <DollarSign className="w-6 h-6 text-purple-200" />
              </div>
            </div>
            <p className="text-purple-200 text-xs font-medium">Daily salary total</p>
          </div>

          {/* Average Salary Card */}
          <div className="bg-gradient-to-br from-pink-500 via-pink-600 to-pink-700 dark:from-pink-900 dark:to-pink-950 rounded-2xl p-6 shadow-lg border border-pink-400/30 dark:border-pink-800/30 text-white">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-pink-100 text-sm font-semibold uppercase tracking-wide">Avg Salary/Day</p>
                <h3 className="text-3xl font-bold mt-2">₹{avgSalaryPerDay.toFixed(2)}</h3>
              </div>
              <div className="bg-pink-400/30 dark:bg-pink-800/50 p-3 rounded-lg">
                <TrendingUp className="w-6 h-6 text-pink-200" />
              </div>
            </div>
            <p className="text-pink-200 text-xs font-medium">Per worker average</p>
          </div>
        </div>

        {/* Labour Header and Search */}
        <div className="bg-gradient-to-r from-slate-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800 rounded-2xl shadow-md p-5 border border-slate-200 dark:border-slate-700">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-4 top-3.5 w-5 h-5 text-indigo-500 dark:text-indigo-400" />
                <Input
                  placeholder="Search by name, code, or department..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-12 border-2 border-indigo-200 dark:border-indigo-900/50 focus:ring-2 focus:ring-indigo-500 focus:border-transparent rounded-lg"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Labour Table */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-slate-500">
              <div className="inline-block w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <p className="mt-2">Loading labour...</p>
            </div>
          ) : paginatedLabour.length === 0 ? (
            <div className="p-8 text-center text-slate-600 dark:text-slate-400">
              {filteredLabour.length === 0
                ? "No labour found. Add your first labour to get started."
                : "No results found."}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-indigo-600 via-indigo-600 to-purple-600 dark:from-indigo-900 dark:via-indigo-900 dark:to-purple-900 border-b-2 border-indigo-700 dark:border-indigo-800 sticky top-0">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                        Labour ID
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                        Department
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                        Salary / Day
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-white uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {paginatedLabour.map((item, idx) => (
                      <tr
                        key={item.id}
                        className={`transition-all group border-l-4 border-l-transparent hover:border-l-indigo-500 ${
                          idx % 2 === 0
                            ? "hover:bg-indigo-50 dark:hover:bg-slate-700/50"
                            : "bg-slate-50 dark:bg-slate-800/50 hover:bg-indigo-50 dark:hover:bg-slate-700/50"
                        }`}
                      >
                        <td className="px-6 py-4 text-sm font-bold text-white cursor-pointer transition-colors">
                          <span className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-700 dark:from-indigo-700 dark:to-indigo-800">
                            {item.code}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {item.name}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-slate-700 dark:text-slate-300">
                          <span className="inline-block px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-full text-xs font-semibold">
                            {item.department}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-indigo-600 dark:text-indigo-400">
                          ₹{item.salaryPerDay.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleOpenDialog(item)}
                              className="p-2 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 rounded-lg transition-colors text-indigo-600 dark:text-indigo-400"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors text-red-600 dark:text-red-400"
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
                <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center bg-gradient-to-r from-slate-50 to-indigo-50 dark:from-slate-800/50 dark:to-slate-800/30">
                  <div className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                    Showing <span className="font-bold text-indigo-600 dark:text-indigo-400">{startIdx + 1}</span> to <span className="font-bold text-indigo-600 dark:text-indigo-400">{Math.min(startIdx + itemsPerPage, filteredLabour.length)}</span> of{" "}
                    <span className="font-bold text-slate-900 dark:text-white">{filteredLabour.length}</span> labour
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="border-2 border-indigo-300 dark:border-indigo-900/50 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Previous
                    </Button>
                    <div className="flex items-center gap-2">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`w-8 h-8 rounded-lg transition-colors font-semibold ${
                            currentPage === page
                              ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white"
                              : "hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
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
                      className="border-2 border-indigo-300 dark:border-indigo-900/50 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 disabled:opacity-40 disabled:cursor-not-allowed"
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
        <DialogContent className="sm:max-w-md">
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
              <Label htmlFor="salary">Salary / Day (₹) *</Label>
              <Input
                id="salary"
                type="number"
                step="0.01"
                placeholder="e.g., 500"
                value={formData.salaryPerDay}
                onChange={(e) =>
                  setFormData({ ...formData, salaryPerDay: e.target.value })
                }
                required
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseDialog}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-teal-600 hover:bg-teal-700 text-white"
              >
                {editingId ? "Update" : "Add"} Labour
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
