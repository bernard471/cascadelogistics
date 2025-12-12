"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, UserPlus, Eye, Edit2, Trash2, Shield, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Staff } from "@/types";

// Mapped staff type for internal component use
interface MappedStaff {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  roleColor: string;
  department: string;
  joinDate: string;
  status: string;
}

export default function StaffManagementSection() {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [staff, setStaff] = useState<MappedStaff[]>([]);
  const [staffStats, setStaffStats] = useState<{ total: number; administrators: number; managers: number; onLeave: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const itemsPerPage = 10;

  const fetchStaff = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        role: roleFilter,
        search: searchQuery
      });
      
      const response = await fetch(`/api/admin/staff?${params}`);
      if (response.ok) {
        const data = await response.json();
        
        const mappedStaff: MappedStaff[] = data.staff.map((member: Staff) => ({
          id: member._id,
          name: `${member.firstName} ${member.lastName}`,
          email: member.email,
          phone: member.phone,
          role: member.role.charAt(0).toUpperCase() + member.role.slice(1).replace('-', ' '),
          roleColor: member.role === 'administrator' ? 'text-red-600 bg-red-50' :
                    member.role === 'manager' ? 'text-purple-600 bg-purple-50' :
                    member.role === 'operator' ? 'text-blue-600 bg-blue-50' :
                    member.role === 'support' ? 'text-green-600 bg-green-50' :
                    member.role === 'driver' ? 'text-orange-600 bg-orange-50' :
                    'text-yellow-600 bg-yellow-50',
          department: member.department,
          joinDate: member.joinDate,
          status: member.status === 'active' ? 'Active' : 'On Leave'
        }));
        
        setStaff(mappedStaff);
        setStaffStats(data.stats);
      }
    } catch (error) {
      console.error("Failed to fetch staff:", error);
    } finally {
      setIsLoading(false);
    }
  }, [roleFilter, searchQuery]);

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
      const response = await fetch(`/api/admin/staff/${id}`, { method: "DELETE" });
      if (response.ok) {
        fetchStaff();
      }
    } catch (error) {
      console.error("Failed to delete staff:", error);
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
          className="bg-[#055b8e] hover:bg-[#044a73] text-white flex items-center gap-2"
          style={{ borderRadius: "10px 0px 10px 0px" }}
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
          <div className="text-sm text-gray-600">Administrators</div>
          <div className="text-2xl font-bold text-red-600 mt-1">
            {staffStats?.administrators || 0}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-600">Managers</div>
          <div className="text-2xl font-bold text-purple-600 mt-1">
            {staffStats?.managers || 0}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-600">On Leave</div>
          <div className="text-2xl font-bold text-orange-600 mt-1">
            {staffStats?.onLeave || 0}
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

          {/* Role Filter */}
          <div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full h-12 px-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#055b8e]"
            >
              <option value="all">All Roles</option>
              <option value="administrator">Administrator</option>
              <option value="manager">Manager</option>
              <option value="operator">Operator</option>
              <option value="support">Support</option>
              <option value="driver">Driver</option>
              <option value="warehouse staff">Warehouse Staff</option>
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
                  Role
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Department
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
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${member.roleColor}`}>
                      {member.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {member.department}
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
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4 text-gray-600" />
                      </button>
                      <button
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Edit Staff"
                      >
                        <Edit2 className="w-4 h-4 text-blue-600" />
                      </button>
                      <button
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Manage Permissions"
                      >
                        <Shield className="w-4 h-4 text-purple-600" />
                      </button>
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
    </div>
  );
}


