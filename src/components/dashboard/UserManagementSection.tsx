"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Users, UserPlus, Eye, Edit2, Trash2, Ban, CheckCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ViewUserModal from "@/components/modals/ViewUserModal";
import EditUserModal from "@/components/modals/EditUserModal";
import CreateUserModal from "@/components/modals/CreateUserModal";
import { User as UserType } from "@/types";

// Mapped user type for internal component use
interface MappedUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  totalShipments: number;
  registeredDate: string;
  status: string;
  statusColor: string;
}

export default function UserManagementSection() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [users, setUsers] = useState<MappedUser[]>([]);
  const [userStats, setUserStats] = useState<{ total: number; active: number; suspended: number; pending: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<MappedUser | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const itemsPerPage = 10;

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        status: statusFilter,
        search: searchQuery
      });
      
      const response = await fetch(`/api/admin/users?${params}`);
      if (response.ok) {
        const data = await response.json();
        
        // Map users to component format
        const mappedUsers: MappedUser[] = data.users.map((user: UserType) => ({
          id: user._id,
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          phone: user.phone || 'N/A',
          totalShipments: user.totalShipments || 0,
          registeredDate: new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          status: user.status === 'active' ? 'Active' :
                  user.status === 'suspended' ? 'Suspended' :
                  'Pending',
          statusColor: user.status === 'active' ? 'text-green-600 bg-green-50' :
                      user.status === 'suspended' ? 'text-red-600 bg-red-50' :
                      'text-yellow-600 bg-yellow-50'
        }));
        
        setUsers(mappedUsers);
        setUserStats(data.stats);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, searchQuery]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Pagination (client-side since we're filtering server-side)
  const totalPages = Math.ceil(users.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedUsers = users.slice(startIndex, startIndex + itemsPerPage);

  const handleViewUser = (id: string) => {
    const user = users.find(u => u.id === id);
    setSelectedUser(user || null);
    setShowViewModal(true);
  };

  const handleEditUser = (id: string) => {
    const user = users.find(u => u.id === id);
    setSelectedUser(user || null);
    setShowEditModal(true);
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    
    try {
      const response = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
      if (response.ok) {
        fetchUsers(); // Refresh list
      }
    } catch (error) {
      console.error("Failed to delete user:", error);
    }
  };

  const handleSuspendUser = async (id: string) => {
    const user = users.find(u => u.id === id);
    const newStatus = user?.status === 'Active' ? 'suspended' : 'active';
    
    try {
      const response = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (response.ok) {
        fetchUsers(); // Refresh list
      }
    } catch (error) {
      console.error("Failed to update user status:", error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">User Management</h1>
          <p className="text-gray-600 mt-1">Manage and monitor all registered users</p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="bg-[#055b8e] hover:bg-[#044a73] text-white flex items-center gap-2"
          style={{ borderRadius: "10px 0px 10px 0px" }}
        >
          <UserPlus className="w-4 h-4" />
          Add New User
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-600">Total Users</div>
          <div className="text-2xl font-bold text-gray-800 mt-1">
            {userStats?.total || 0}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-600">Active Users</div>
          <div className="text-2xl font-bold text-green-600 mt-1">
            {userStats?.active || 0}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-600">Suspended Users</div>
          <div className="text-2xl font-bold text-red-600 mt-1">
            {userStats?.suspended || 0}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-600">Pending Users</div>
          <div className="text-2xl font-bold text-yellow-600 mt-1">
            {userStats?.pending || 0}
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
                placeholder="Search by name, email, or phone..."
                className="pl-10 h-12"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full h-12 px-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#055b8e]"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="animate-spin w-12 h-12 border-4 border-[#055b8e] border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Loading users...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-800 mb-2">No users found</h3>
            <p className="text-gray-600">Try adjusting your filters or add a new user</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Shipments
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Registered Date
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
              {paginatedUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#055b8e] rounded-full flex items-center justify-center text-white font-medium">
                        {user.name.split(' ').map((n: string) => n[0]).join('')}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        <div className="text-xs text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {user.phone}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-gray-900">{user.totalShipments}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {user.registeredDate}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${user.statusColor}`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleViewUser(user.id)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4 text-gray-600" />
                      </button>
                      <button
                        onClick={() => handleEditUser(user.id)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Edit User"
                      >
                        <Edit2 className="w-4 h-4 text-blue-600" />
                      </button>
                      {user.status === "Active" ? (
                        <button
                          onClick={() => handleSuspendUser(user.id)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Suspend User"
                        >
                          <Ban className="w-4 h-4 text-orange-600" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleSuspendUser(user.id)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Activate User"
                        >
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Delete User"
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
        {!isLoading && users.length > 0 && totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, users.length)} of {users.length} results
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

      {/* Modals */}
      {showViewModal && selectedUser && (
        <ViewUserModal
          user={selectedUser}
          onClose={() => {
            setShowViewModal(false);
            setSelectedUser(null);
          }}
        />
      )}

      {showEditModal && selectedUser && (
        <EditUserModal
          user={selectedUser}
          onClose={() => {
            setShowEditModal(false);
            setSelectedUser(null);
          }}
          onSave={() => {
            fetchUsers();
            setShowEditModal(false);
            setSelectedUser(null);
          }}
        />
      )}

      {showCreateModal && (
        <CreateUserModal
          onClose={() => setShowCreateModal(false)}
          onSave={() => {
            fetchUsers();
            setShowCreateModal(false);
          }}
        />
      )}
    </div>
  );
}


