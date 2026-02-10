import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Edit2,
  Trash2,
  Users,
  TrendingUp,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  Search,
} from "lucide-react";
import { Layout } from "@/components/Layout";
import { PageHeader } from "@/components/PageHeader";
import { toast } from "sonner";
import { LoadingSpinner } from "@/components/LoadingSpinner";

interface Labour {
  _id?: string;
  id?: string;
  code: string;
  name: string;
  department: string;
  salaryPerDay: number;
  createdAt?: string;
  updatedAt?: string;
}

export default function LabourManagement() {
  const navigate = useNavigate();
  const [labour, setLabour] = useState<Labour[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Fetch labour list with retry logic
  const fetchLabour = async (retryCount = 0) => {
    try {
      if (retryCount === 0) {
        setLoading(true);
      }

      const token = localStorage.getItem("auth_token");
      const response = await fetch("/api/labour", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (result.success && Array.isArray(result.data)) {
        setLabour(result.data);
        setLoading(false);
      } else {
        throw new Error(result.message || "Failed to fetch labour");
      }
    } catch (error) {
      console.error("Error fetching labour:", error);

      // Retry logic: retry up to 2 times on failure
      if (retryCount < 2) {
        console.warn(
          `Retrying labour fetch (attempt ${retryCount + 1}/3)...`,
        );
        setTimeout(() => fetchLabour(retryCount + 1), 1000 * (retryCount + 1));
      } else {
        setLoading(false);
        toast.error(
          "Failed to load labour data: " +
            (error instanceof Error ? error.message : "Unknown error"),
        );
        // Set empty array to show empty state instead of loading forever
        setLabour([]);
      }
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      navigate("/");
      return;
    }
    fetchLabour();
  }, [navigate]);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this labour?")) {
      return;
    }

    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(`/api/labour/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
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
      (item.code && item.code.toLowerCase().includes(searchTerm.toLowerCase())) ||
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
    <Layout title="Labour Management">
      <PageHeader
        title="Labour Management"
        description="Manage factory labour and track salary costs"
        breadcrumbs={[{ label: "Labour Management" }]}
        icon={<Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />}
        actions={
          <button
            onClick={() => navigate("/labour/new")}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-2.5 px-5 rounded-xl transition-all shadow-elevation-3 hover:shadow-elevation-5 transform hover:scale-105 hover:-translate-y-0.5 whitespace-nowrap text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Labour</span>
          </button>
        }
      />

      <div className="space-y-4 sm:space-y-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 animate-fade-in-up">
          {/* Total Labour Card - Blue */}
          <div className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-800/50 rounded-2xl p-6 shadow-elevation-2 border border-blue-200/50 dark:border-blue-800/30 hover:shadow-elevation-4 transition-all duration-300 hover:-translate-y-2">
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <p className="text-slate-600 dark:text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">
                  Total Labour
                </p>
                <h3 className="text-5xl font-bold text-blue-600 dark:text-blue-400">
                  {totalLabour}
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">Workers on Staff</p>
              </div>
              <div className="bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/40 dark:to-blue-900/20 p-4 rounded-2xl">
                <Users className="w-7 h-7 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div className="h-1.5 w-full bg-blue-100 dark:bg-blue-900/30 rounded-full overflow-hidden">
              <div className="h-full w-full bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 rounded-full"></div>
            </div>
          </div>

          {/* Total Daily Cost Card - Blue */}
          <div className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-800/50 rounded-2xl p-6 shadow-elevation-2 border border-blue-200/50 dark:border-blue-800/30 hover:shadow-elevation-4 transition-all duration-300 hover:-translate-y-2">
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <p className="text-slate-600 dark:text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">
                  Total Daily Cost
                </p>
                <h3 className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                  ₹{totalDailyCost.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">Daily expenses</p>
              </div>
              <div className="bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/40 dark:to-blue-900/20 p-4 rounded-2xl">
                <DollarSign className="w-7 h-7 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div className="h-1.5 w-full bg-blue-100 dark:bg-blue-900/30 rounded-full overflow-hidden">
              <div className="h-full w-full bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 rounded-full"></div>
            </div>
          </div>

          {/* Avg Salary Card - Blue */}
          <div className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-800/50 rounded-2xl p-6 shadow-elevation-2 border border-blue-200/50 dark:border-blue-800/30 hover:shadow-elevation-4 transition-all duration-300 hover:-translate-y-2">
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <p className="text-slate-600 dark:text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">
                  Avg Salary/Day
                </p>
                <h3 className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                  ₹{avgSalaryPerDay.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">Per worker</p>
              </div>
              <div className="bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/40 dark:to-blue-900/20 p-4 rounded-2xl">
                <TrendingUp className="w-7 h-7 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div className="h-1.5 w-full bg-blue-100 dark:bg-blue-900/30 rounded-full overflow-hidden">
              <div className="h-full w-full bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Search Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <div className="w-1 h-4 bg-blue-600 rounded-full"></div>
            Search Labour
          </h3>
          <div className="bg-gradient-to-br from-blue-50/40 to-blue-50/20 dark:from-blue-900/10 dark:to-blue-900/5 rounded-xl p-5 border border-blue-100/50 dark:border-blue-800/20">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 text-base">🔍</span>
              Search by Name, Code, or Department
            </label>
            <div className="relative">
              <Search className="absolute left-4 top-3.5 w-5 h-5 text-blue-500 dark:text-blue-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search labour..."
                className="w-full pl-12 pr-4 py-3 rounded-lg bg-white dark:bg-slate-700 border-2 border-blue-200 dark:border-blue-800/30 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm font-medium text-base"
              />
            </div>
          </div>
        </div>

        {/* Labour Table Header */}
        <div className="space-y-4 mt-8">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <div className="w-1 h-4 bg-blue-600 rounded-full"></div>
              Labour List
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              <span className="font-bold text-slate-900 dark:text-white">
                {filteredLabour.length}
              </span>{" "}
              record{filteredLabour.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* Labour Table */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-elevation-3 border border-blue-200/50 dark:border-blue-800/20 overflow-hidden animate-fade-in-up">
          {loading ? (
            <div className="p-12 text-center">
              <LoadingSpinner message="Loading labour data..." />
            </div>
          ) : labour.length === 0 ? (
            <div className="p-6 sm:p-12 text-center">
              <Users className="w-12 sm:w-16 h-12 sm:h-16 text-slate-300 dark:text-slate-600 mx-auto mb-3 sm:mb-4" />
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-2">
                No Labour Found
              </h3>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mb-4 sm:mb-6">
                Add your first labour record to start tracking daily costs.
              </p>
              <button
                onClick={() => navigate("/labour/new")}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-2 sm:py-2.5 px-4 sm:px-5 rounded-xl transition-all shadow-elevation-3 hover:shadow-elevation-5 transform hover:scale-105 hover:-translate-y-0.5 text-sm sm:text-base"
              >
                <Plus className="w-4 h-4" />
                Add First Labour
              </button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
                <table className="w-full min-w-[500px]">
                  <thead className="bg-gradient-to-r from-blue-50 to-blue-50/50 dark:from-blue-900/20 dark:to-blue-900/10 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Labour ID</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Name</th>
                      <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Department</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Salary/Day</th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {paginatedLabour.map((item) => (
                      <tr
                        key={item._id}
                        className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
                      >
                        <td className="px-6 py-3 text-sm font-semibold text-blue-600 dark:text-blue-400">
                          {item.code}
                        </td>
                        <td className="px-6 py-3 text-sm font-medium text-slate-900 dark:text-white">
                          <div className="flex flex-col gap-1">
                            <span>{item.name}</span>
                            <span className="md:hidden text-xs text-slate-500 dark:text-slate-400 font-normal">
                              Dept: {item.department}
                            </span>
                          </div>
                        </td>
                        <td className="hidden md:table-cell px-6 py-3 text-sm font-medium text-slate-900 dark:text-white">
                          {item.department}
                        </td>
                        <td className="px-6 py-3 text-sm font-semibold text-blue-600 dark:text-blue-400">
                          ₹{item.salaryPerDay.toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        <td className="px-6 py-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => navigate(`/labour/${item._id}/edit`)}
                              className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors transform hover:scale-110"
                              title="Edit labour"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(item._id || "")}
                              className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors transform hover:scale-110"
                              title="Delete labour"
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

              {/* Pagination Controls */}
              <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                    <span className="font-bold text-slate-900 dark:text-slate-200">
                      {startIdx + 1}-{Math.min(startIdx + itemsPerPage, filteredLabour.length)}
                    </span>
                    {" "}of{" "}
                    <span className="font-bold text-slate-900 dark:text-slate-200">
                      {filteredLabour.length}
                    </span>
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="inline-flex items-center justify-center p-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      title="Previous Page"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-sm font-semibold text-slate-600 dark:text-slate-400 min-w-[60px] text-center">
                      {currentPage}/{totalPages || 1}
                    </span>
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages || totalPages === 0}
                      className="inline-flex items-center justify-center p-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      title="Next Page"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}
