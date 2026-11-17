"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Users, UserPlus, Eye, Edit2, Trash2, Ban, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import ViewUserModal from "@/components/modals/ViewUserModal";
import EditUserModal from "@/components/modals/EditUserModal";
import CreateUserModal from "@/components/modals/CreateUserModal";
import {
  PaginationBar,
  SearchResultsSummary,
  SearchSubmitBar,
  SimilarMatchBadge,
} from "@/components/dashboard/AdminSearchControls";
import type { SearchMatchType, SearchSummary, UsersResponse } from "@/types";

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
  matchType?: SearchMatchType;
}

export default function UserManagementSection() {
  // What is typed in the box vs. the search that was last submitted.
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchSummary, setSearchSummary] = useState<SearchSummary | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [users, setUsers] = useState<MappedUser[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [userStats, setUserStats] = useState<{ total: number; active: number; suspended: number; pending: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<MappedUser | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const latestRequest = useRef(0);
  const itemsPerPage = 10;

  const fetchUsers = useCallback(async () => {
    const requestId = ++latestRequest.current;
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        status: statusFilter,
        limit: String(itemsPerPage),
        skip: String((currentPage - 1) * itemsPerPage),
      });
      if (searchTerm) params.set("search", searchTerm);

      const response = await fetch(`/api/admin/users?${params}`, { cache: "no-store" });
      // A newer search was started while this one was running; ignore this answer.
      if (requestId !== latestRequest.current) return;
      if (response.ok) {
        const data = (await response.json()) as UsersResponse;
        const visibleUsers = data.users.filter(
          (user): user is typeof user & { _id: string } =>
            user.role !== "super_admin" && Boolean(user._id)
        );

        // Map users to component format
        const mappedUsers: MappedUser[] = visibleUsers.map((user) => ({
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
                      'text-yellow-600 bg-yellow-50',
          matchType: user.matchType,
        }));

        const total = data.total ?? mappedUsers.length;
        const pages = data.totalPages ?? Math.ceil(total / itemsPerPage);
        // The last page emptied (e.g. after a delete): step back to the new last page.
        if (mappedUsers.length === 0 && currentPage > 1 && pages > 0) {
          setCurrentPage(Math.min(currentPage - 1, pages));
          return;
        }

        setUsers(mappedUsers);
        setTotalUsers(total);
        setTotalPages(pages);
        setSearchSummary(data.search ?? null);
        setUserStats(data.stats);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      if (requestId === latestRequest.current) setIsLoading(false);
    }
  }, [statusFilter, searchTerm, currentPage]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearch = () => {
    const term = searchInput.replace(/\s+/g, " ").trim();
    if (term === searchTerm && currentPage === 1) {
      fetchUsers(); // Same search again: refresh the results.
    } else {
      setSearchTerm(term);
      setCurrentPage(1);
    }
  };

  const handleClearSearch = () => {
    setSearchInput("");
    setSearchTerm("");
    setCurrentPage(1);
  };

  const startIndex = (currentPage - 1) * itemsPerPage;

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
            <SearchSubmitBar
              value={searchInput}
              onChange={setSearchInput}
              onSearch={handleSearch}
              onClear={handleClearSearch}
              hasActiveSearch={Boolean(searchTerm)}
              isSearching={isLoading && Boolean(searchInput)}
              placeholder="Search by name, email, username, or phone..."
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full h-12 px-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#055b8e]"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>
        {!isLoading && (
          <SearchResultsSummary summary={searchSummary} noun={{ singular: "user", plural: "users" }} />
        )}
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
            <p className="text-gray-600">
              {searchTerm
                ? <>Nothing matches or sounds like &ldquo;{searchTerm}&rdquo;. Check the spelling, try part of the name or email, or clear the search.</>
                : "Try adjusting your filters or add a new user"}
            </p>
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
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#055b8e] rounded-full flex items-center justify-center text-white font-medium">
                        {user.name.split(' ').map((n: string) => n[0]).join('')}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {user.name}
                          {user.matchType === "similar" && <SimilarMatchBadge />}
                        </div>
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
        {!isLoading && users.length > 0 && (
          <PaginationBar
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            label={`Showing ${startIndex + 1} to ${startIndex + users.length} of ${totalUsers.toLocaleString()} ${searchTerm ? "results" : "users"}`}
          />
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
