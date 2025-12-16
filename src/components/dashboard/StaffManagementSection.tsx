"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, UserPlus, Eye, Edit2, Trash2, 
  // Shield, 
  ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import CreateStaffModal from "@/components/modals/CreateStaffModal";
import ViewStaffModal from "@/components/modals/ViewStaffModal";
import EditStaffModal from "@/components/modals/EditStaffModal";
import type { UserWithStats, UsersResponse } from "@/types";
import type { MappedStaff } from "@/components/modals/types";

// Staff user type (User with role 'staff')
type StaffUser = UserWithStats & {
  role: 'staff';
};

// Error response type
interface ErrorResponse {
  error: string;
}

// Staff stats type
interface StaffStats {
  total: number;
  active: number;
  suspended: number;
  pending: number;
}

export default function StaffManagementSection() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [staff, setStaff] = useState<MappedStaff[]>([]);
  const [staffStats, setStaffStats] = useState<StaffStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<MappedStaff | null>(null);
  const itemsPerPage = 10;

  const fetchStaff = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch staff users from the users collection (role: "staff")
      const params = new URLSearchParams({
        search: searchQuery,
        ...(statusFilter !== "all" && { status: statusFilter })
      });
      
      const response = await fetch(`/api/admin/users?${params}`);
      if (response.ok) {
        const data = (await response.json()) as UsersResponse;
        
        // Filter to only show users with role "staff"
        const staffUsers = data.users.filter(
          (user): user is StaffUser => user.role === 'staff' && !!user._id
        );
        
        const mappedStaff: MappedStaff[] = staffUsers.map((user) => {
          const createdAt = typeof user.createdAt === 'string' 
            ? new Date(user.createdAt) 
            : user.createdAt;
          
          const joinDate = user.registeredDate || 
            (createdAt ? createdAt.toISOString().split('T')[0] : 'N/A');
          
          let status: "Active" | "Suspended" | "Pending";
          if (user.status === 'active') {
            status = 'Active';
          } else if (user.status === 'suspended') {
            status = 'Suspended';
          } else {
            status = 'Pending';
          }
          
          return {
            id: user._id!,
            name: `${user.firstName} ${user.lastName}`,
            email: user.email,
            username: user.username || 'N/A',
            phone: user.phone || 'N/A',
            joinDate,
            status
          };
        });
        
        setStaff(mappedStaff);
        
        // Calculate stats
        const total = staffUsers.length;
        const active = staffUsers.filter((u) => u.status === 'active').length;
        const suspended = staffUsers.filter((u) => u.status === 'suspended').length;
        const pending = staffUsers.filter((u) => u.status === 'pending').length;
        
        setStaffStats({
          total,
          active,
          suspended,
          pending
        });
      }
    } catch (error) {
      console.error("Failed to fetch staff:", error);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, statusFilter]);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  // Pagination
  const totalPages = Math.ceil(staff.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedStaff = staff.slice(startIndex, startIndex + itemsPerPage);

  const handleDeleteStaff = async (id: string) => {
    if (!confirm("Are you sure you want to remove this staff member?")) return;
    
    try {
      const response = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
      if (response.ok) {
        fetchStaff();
      } else {
        const data = (await response.json()) as ErrorResponse;
        alert(data.error || "Failed to delete staff member");
      }
    } catch (error) {
      console.error("Failed to delete staff:", error);
      alert("An error occurred while deleting the staff member");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">Staff Management</h1>
          <p className="text-gray-600 mt-1">Manage your team members and their roles</p>
        </div>
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-gradient-to-r from-[#315694] to-[#262262] hover:from-[#262262] hover:to-[#315694] text-white flex items-center gap-2"
        >
          <UserPlus className="w-4 h-4" />
          Add Staff Member
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-600">Total Staff</div>
          <div className="text-2xl font-bold text-gray-800 mt-1">{staffStats?.total || 0}</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-600">Active</div>
          <div className="text-2xl font-bold text-green-600 mt-1">
            {staffStats?.active || 0}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-600">Suspended</div>
          <div className="text-2xl font-bold text-red-600 mt-1">
            {staffStats?.suspended || 0}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-600">Pending</div>
          <div className="text-2xl font-bold text-orange-600 mt-1">
            {staffStats?.pending || 0}
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, email, or department..."
                className="pl-10 h-12"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full h-12 px-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#315694]"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>
      </div>

      {/* Staff Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="animate-spin w-12 h-12 border-4 border-[#055b8e] border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Loading staff...</p>
          </div>
        ) : staff.length === 0 ? (
          <div className="p-12 text-center">
            <UserPlus className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-800 mb-2">No staff members found</h3>
            <p className="text-gray-600">Add staff members to get started</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Staff Member
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Username
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Join Date
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedStaff.map((member) => (
                <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#055b8e] rounded-full flex items-center justify-center text-white font-medium">
                        {member.name.split(' ').map((n: string) => n[0]).join('')}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{member.name}</div>
                        <div className="text-xs text-gray-500">{member.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {member.phone}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {member.username}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {member.joinDate}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                      member.status === "Active" ? "text-green-600 bg-green-50" : "text-orange-600 bg-orange-50"
                    }`}>
                      {member.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedStaff(member);
                          setIsViewModalOpen(true);
                        }}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4 text-gray-600" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedStaff(member);
                          setIsEditModalOpen(true);
                        }}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Edit Staff"
                      >
                        <Edit2 className="w-4 h-4 text-blue-600" />
                      </button>
                      {/* <button
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Manage Permissions"
                      >
                        <Shield className="w-4 h-4 text-purple-600" />
                      </button> */}
                      <button
                        onClick={() => handleDeleteStaff(member.id)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Remove Staff"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}

        {/* Pagination */}
        {!isLoading && staff.length > 0 && totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, staff.length)} of {staff.length} results
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Button>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    className={currentPage === page ? "bg-[#055b8e] hover:bg-[#044a73]" : ""}
                  >
                    {page}
                  </Button>
                ))}
                
                <Button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create Staff Modal */}
      {isCreateModalOpen && (
        <CreateStaffModal
          onClose={() => setIsCreateModalOpen(false)}
          onSave={() => {
            fetchStaff();
            setIsCreateModalOpen(false);
          }}
        />
      )}

      {/* View Staff Modal */}
      {isViewModalOpen && selectedStaff && (
        <ViewStaffModal
          staff={selectedStaff}
          onClose={() => {
            setIsViewModalOpen(false);
            setSelectedStaff(null);
          }}
        />
      )}

      {/* Edit Staff Modal */}
      {isEditModalOpen && selectedStaff && (
        <EditStaffModal
          staff={selectedStaff}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedStaff(null);
          }}
          onSave={() => {
            fetchStaff();
            setIsEditModalOpen(false);
            setSelectedStaff(null);
          }}
        />
      )}
    </div>
  );
}


