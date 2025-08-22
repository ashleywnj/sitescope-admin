"use client";

import { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, deleteDoc, addDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import Icon from '../../protected/components/Icon';

interface Organization {
  id: string;
  name: string;
  status: 'Active' | 'Inactive' | 'Suspended';
  createdAt: { seconds: number; nanoseconds: number } | Date;
  description?: string;
  contactEmail?: string;
  userCount?: number;
  projectCount?: number;
}

export default function OrganizationManagement() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [addingOrg, setAddingOrg] = useState(false);
  const [newOrg, setNewOrg] = useState({
    name: '',
    description: '',
    contactEmail: '',
    status: 'Active' as const
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'Active' | 'Inactive' | 'Suspended'>('all');

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const fetchOrganizations = async () => {
    if (!db) return;
    
    try {
      setLoading(true);
      const organizationsRef = collection(db, "organizations");
      const q = query(organizationsRef, orderBy("name"));
      const snapshot = await getDocs(q);
      
      const orgsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Organization[];
      
      setOrganizations(orgsData);
    } catch (error) {
      console.error("Error fetching organizations:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (org: Organization) => {
    setEditingOrg({ ...org });
    setSelectedOrg(org);
  };

  const handleSave = async () => {
    if (!editingOrg || !db) return;
    
    try {
      const orgRef = doc(db, "organizations", editingOrg.id);
      await updateDoc(orgRef, {
        name: editingOrg.name,
        status: editingOrg.status,
        description: editingOrg.description,
        contactEmail: editingOrg.contactEmail
      });
      
      // Update local state
      setOrganizations(prev => 
        prev.map(org => 
          org.id === editingOrg.id ? editingOrg : org
        )
      );
      
      setEditingOrg(null);
      setSelectedOrg(null);
    } catch (error) {
      console.error("Error updating organization:", error);
    }
  };

  const handleDelete = async (orgId: string) => {
    if (!db || !confirm("Are you sure you want to delete this organization? This action cannot be undone.")) return;
    
    try {
      await deleteDoc(doc(db, "organizations", orgId));
      setOrganizations(prev => prev.filter(org => org.id !== orgId));
      if (selectedOrg?.id === orgId) {
        setSelectedOrg(null);
        setEditingOrg(null);
      }
    } catch (error) {
      console.error("Error deleting organization:", error);
    }
  };

  const handleAdd = async () => {
    if (!db || !newOrg.name.trim()) return;
    
    try {
      const orgData = {
        ...newOrg,
        createdAt: new Date(),
        name: newOrg.name.trim(),
        description: newOrg.description.trim() || undefined,
        contactEmail: newOrg.contactEmail.trim() || undefined
      };
      
      // Add to Firestore (this will generate an ID)
      const orgRef = await addDoc(collection(db, "organizations"), orgData);
      
      // Add to local state with the generated ID
      const newOrgWithId = { ...orgData, id: orgRef.id };
      setOrganizations(prev => [...prev, newOrgWithId]);
      
      // Reset form
      setNewOrg({
        name: '',
        description: '',
        contactEmail: '',
        status: 'Active'
      });
      setAddingOrg(false);
    } catch (error) {
      console.error("Error adding organization:", error);
    }
  };

  const resetNewOrgForm = () => {
    setNewOrg({
      name: '',
      description: '',
      contactEmail: '',
      status: 'Active'
    });
    setAddingOrg(false);
  };

  const filteredOrganizations = organizations.filter(org => {
    const matchesSearch = org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         org.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         org.contactEmail?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || org.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600"></div>
        <span className="ml-2 text-gray-600 dark:text-gray-400">Loading organizations...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => window.history.back()}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="Go back"
          >
            <Icon 
              path="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" 
              className="w-5 h-5" 
            />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Organization Management</h2>
            <p className="text-gray-600 dark:text-gray-400">Manage all organizations in the system</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Total: {organizations.length} organizations
          </div>
          <button
            onClick={() => setAddingOrg(true)}
            className="bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center"
          >
            <Icon 
              path="M12 4v16m8-8H4" 
              className="w-4 h-4 mr-2" 
            />
            Add Organization
          </button>
        </div>
      </div>

      {/* Add Organization Modal */}
      {addingOrg && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Add New Organization</h3>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Organization Name *
                </label>
                <input
                  type="text"
                  value={newOrg.name}
                  onChange={(e) => setNewOrg({ ...newOrg, name: e.target.value })}
                  placeholder="Enter organization name"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={newOrg.description}
                  onChange={(e) => setNewOrg({ ...newOrg, description: e.target.value })}
                  placeholder="Enter organization description"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Contact Email
                </label>
                <input
                  type="email"
                  value={newOrg.contactEmail}
                  onChange={(e) => setNewOrg({ ...newOrg, contactEmail: e.target.value })}
                  placeholder="contact@example.com"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Status
                </label>
                <select
                  value={newOrg.status}
                  onChange={(e) => setNewOrg({ ...newOrg, status: e.target.value as 'Active' | 'Inactive' | 'Suspended' })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Suspended">Suspended</option>
                </select>
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
              <button
                onClick={resetNewOrgForm}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                disabled={!newOrg.name.trim()}
                className="bg-sky-600 hover:bg-sky-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
              >
                Add Organization
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Icon 
              path="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" 
              className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search organizations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:border-transparent"
            />
          </div>
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as 'all' | 'Active' | 'Inactive' | 'Suspended')}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:border-transparent"
        >
          <option value="all">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
          <option value="Suspended">Suspended</option>
        </select>
      </div>

      {/* Organizations List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Organization
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredOrganizations.map((org) => (
                <tr 
                  key={org.id} 
                  className={`hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer ${
                    selectedOrg?.id === org.id ? 'bg-sky-50 dark:bg-sky-900/20' : ''
                  }`}
                  onClick={() => setSelectedOrg(org)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {editingOrg?.id === org.id ? (
                          <input
                            type="text"
                            value={editingOrg.name}
                            onChange={(e) => setEditingOrg({ ...editingOrg, name: e.target.value })}
                            className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                        ) : (
                          org.name
                        )}
                      </div>
                      {editingOrg?.id === org.id ? (
                        <textarea
                          value={editingOrg.description || ''}
                          onChange={(e) => setEditingOrg({ ...editingOrg, description: e.target.value })}
                          placeholder="Description..."
                          className="w-full mt-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-xs"
                          rows={2}
                        />
                      ) : (
                        org.description && (
                          <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                            {org.description}
                          </div>
                        )
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingOrg?.id === org.id ? (
                      <select
                        value={editingOrg.status}
                        onChange={(e) => setEditingOrg({ ...editingOrg, status: e.target.value as 'Active' | 'Inactive' | 'Suspended' })}
                        className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                        <option value="Suspended">Suspended</option>
                      </select>
                    ) : (
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        org.status === 'Active' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200' :
                        org.status === 'Inactive' ? 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200' :
                        'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
                      }`}>
                        {org.status}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingOrg?.id === org.id ? (
                      <input
                        type="email"
                        value={editingOrg.contactEmail || ''}
                        onChange={(e) => setEditingOrg({ ...editingOrg, contactEmail: e.target.value })}
                        placeholder="contact@example.com"
                        className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                      />
                    ) : (
                      <div className="text-sm text-gray-900 dark:text-white">
                        {org.contactEmail || 'Not specified'}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {org.createdAt ? new Date(org.createdAt.seconds * 1000).toLocaleDateString() : 'Unknown'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {editingOrg?.id === org.id ? (
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSave();
                          }}
                          className="text-sky-600 dark:text-sky-400 hover:text-sky-900 dark:hover:text-sky-300"
                        >
                          Save
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingOrg(null);
                          }}
                          className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(org);
                          }}
                          className="text-sky-600 dark:text-sky-400 hover:text-sky-900 dark:hover:text-sky-300"
                        >
                          Edit
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(org.id);
                          }}
                          className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredOrganizations.length === 0 && (
          <div className="text-center py-12">
            <Icon 
              path="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" 
              className="w-12 h-12 text-gray-400 mx-auto mb-4"
            />
            <p className="text-gray-600 dark:text-gray-400">No organizations found</p>
            {searchTerm || filterStatus !== 'all' ? (
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                Try adjusting your search or filter criteria
              </p>
            ) : null}
          </div>
        )}
      </div>

      {/* Organization Details Sidebar */}
      {selectedOrg && (
        <div className="fixed inset-y-0 right-0 w-96 bg-white dark:bg-gray-800 shadow-xl border-l border-gray-200 dark:border-gray-700 overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Organization Details
              </h3>
              <button
                onClick={() => setSelectedOrg(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <Icon path="M6 18L18 6M6 6l12 12" className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Name
                </label>
                <p className="text-sm text-gray-900 dark:text-white">{selectedOrg.name}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Status
                </label>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  selectedOrg.status === 'Active' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200' :
                  selectedOrg.status === 'Inactive' ? 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200' :
                  'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
                }`}>
                  {selectedOrg.status}
                </span>
              </div>

              {selectedOrg.description && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <p className="text-sm text-gray-900 dark:text-white">{selectedOrg.description}</p>
                </div>
              )}

              {selectedOrg.contactEmail && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Contact Email
                  </label>
                  <p className="text-sm text-gray-900 dark:text-white">{selectedOrg.contactEmail}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Created
                </label>
                <p className="text-sm text-gray-900 dark:text-white">
                  {selectedOrg.createdAt ? new Date(selectedOrg.createdAt.seconds * 1000).toLocaleDateString() : 'Unknown'}
                </p>
              </div>

              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => handleEdit(selectedOrg)}
                  className="w-full bg-sky-600 hover:bg-sky-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Edit Organization
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
