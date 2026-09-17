import React, { useState, useEffect, useRef } from 'react';
import { User } from '../../types';
import { storageService } from '../../services/storageService';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import {
  Plus,
  Users,
  Phone,
  Mail,
  Award,
  DollarSign,
  Edit2,
  Trash2,
  CheckCircle2,
  Upload,
  X,
  Camera,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../lib/formatters';
import { uploadOrProcessAvatar } from '../../lib/imageUtils';

export const UsersView: React.FC = () => {
  const { showToast } = useToast();
  const { currentUser, setUser } = useAuth();
  const [users, setUsers] = useState<User[]>(storageService.getUsers());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  useEffect(() => {
    const handleUpdate = () => {
      setUsers(storageService.getUsers());
    };
    window.addEventListener('amrit_data_updated', handleUpdate);
    return () => window.removeEventListener('amrit_data_updated', handleUpdate);
  }, []);

  // Form state
  const [fullName, setFullName] = useState('');
  const [designation, setDesignation] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [salary, setSalary] = useState('');
  const [active, setActive] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setFullName('');
    setDesignation('');
    setSpecialization('');
    setPhone('');
    setEmail('');
    setSalary('');
    setActive(true);
    setAvatarUrl('');
    setEditingUserId(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: User) => {
    setEditingUserId(user.id);
    setFullName(user.fullName);
    setDesignation(user.designation || '');
    setSpecialization(user.specialization || '');
    setPhone(user.phone || '');
    setEmail(user.email || '');
    setSalary(user.salary ? String(user.salary) : '');
    setActive(user.active);
    setAvatarUrl(user.avatarUrl || '');
    setIsModalOpen(true);
  };

  const handlePhotoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsProcessingPhoto(true);
      const url = await uploadOrProcessAvatar(file, editingUserId || 'staff');
      setAvatarUrl(url);
      showToast('Profile photo ready to save', 'info');
    } catch (err: any) {
      showToast(err.message || 'Failed to process image', 'error');
    } finally {
      setIsProcessingPhoto(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      showToast('Please enter full name', 'error');
      return;
    }

    const salaryNum = salary ? parseFloat(salary) : undefined;

    if (editingUserId) {
      storageService.updateUser(editingUserId, {
        fullName: fullName.trim(),
        designation: designation.trim() || 'Staff Member',
        specialization: specialization.trim() || undefined,
        phone: phone.trim(),
        email: email.trim(),
        salary: salaryNum,
        active,
        avatarUrl: avatarUrl || undefined,
      });
      showToast(`Updated details for ${fullName}`);
    } else {
      storageService.addUser({
        fullName: fullName.trim(),
        designation: designation.trim() || 'Staff Member',
        specialization: specialization.trim() || undefined,
        phone: phone.trim(),
        email: email.trim(),
        salary: salaryNum,
        active,
        avatarUrl: avatarUrl || undefined,
      });
      showToast(`Added ${fullName} to staff directory`);
    }

    setUsers(storageService.getUsers());
    setIsModalOpen(false);
    resetForm();
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Remove ${name} from staff directory?`)) {
      storageService.deleteUser(id);
      setUsers(storageService.getUsers());
      showToast(`Removed ${name}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Staff & Instructors Directory</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage yoga teachers, instructors, and center administrative personnel for batch assignments and payroll.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-brand-700 hover:bg-brand-800 rounded-md shadow-2xs transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          + Add Staff / Instructor
        </button>
      </div>

      {/* Staff User Accounts Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
            <Users className="w-4 h-4 text-brand-700" />
            Registered Staff & Instructors ({users.length})
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold uppercase text-[11px]">
              <tr>
                <th className="py-2.5 px-4">Staff Name</th>
                <th className="py-2.5 px-4">Designation</th>
                <th className="py-2.5 px-4">Specialization</th>
                <th className="py-2.5 px-4">Contact Phone & Email</th>
                <th className="py-2.5 px-4 text-right">Monthly Salary</th>
                <th className="py-2.5 px-4 text-center">Status</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map(u => {
                const isCurrentActive = u.id === currentUser.id;
                return (
                  <tr
                    key={u.id}
                    className={`transition-colors ${
                      isCurrentActive ? 'bg-amber-50/30 hover:bg-amber-50/50' : 'hover:bg-slate-50/70'
                    }`}
                  >
                    <td className="py-2.5 px-4">
                      <div className="flex items-center gap-2.5">
                        {u.avatarUrl ? (
                          <img
                            src={u.avatarUrl}
                            alt={u.fullName}
                            className={`w-8 h-8 rounded-full object-cover shrink-0 border ${
                              isCurrentActive
                                ? 'border-brand-600 ring-2 ring-brand-300 shadow-xs'
                                : 'border-slate-200 shadow-2xs'
                            }`}
                          />
                        ) : (
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                              isCurrentActive
                                ? 'bg-brand-700 text-white shadow-2xs ring-2 ring-brand-300'
                                : 'bg-brand-100 text-brand-800'
                            }`}
                          >
                            {u.fullName.charAt(0)}
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">{u.fullName}</span>
                            {isCurrentActive && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-bold bg-brand-100 text-brand-800 border border-brand-200">
                                <CheckCircle2 className="w-2.5 h-2.5" />
                                Active Profile
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 px-4 font-medium text-slate-800">
                      {u.designation || 'Staff'}
                    </td>
                    <td className="py-2.5 px-4 text-slate-600">
                      {u.specialization ? (
                        <span className="inline-flex items-center gap-1">
                          <Award className="w-3 h-3 text-amber-600 shrink-0" />
                          {u.specialization}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-2.5 px-4">
                      <div className="space-y-0.5 text-slate-600">
                        {u.phone && (
                          <div className="flex items-center gap-1.5 font-mono">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{u.phone}</span>
                          </div>
                        )}
                        {u.email && (
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                            <Mail className="w-3 h-3 text-slate-400" />
                            <span>{u.email}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 px-4 text-right font-medium text-slate-900">
                      {u.salary ? formatCurrency(u.salary) : <span className="text-slate-400">—</span>}
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      {u.active ? (
                        <Badge variant="success">Active</Badge>
                      ) : (
                        <Badge variant="neutral">Inactive</Badge>
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        {!isCurrentActive && (
                          <button
                            type="button"
                            onClick={() => {
                              setUser(u);
                              showToast(`Active profile set to ${u.fullName}`);
                            }}
                            className="px-2 py-1 text-[11px] font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 hover:text-brand-800 border border-brand-200 rounded transition-colors"
                            title="Switch active user to this profile"
                          >
                            Set Active
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(u)}
                          className="p-1 rounded text-slate-500 hover:text-brand-700 hover:bg-slate-100"
                          title="Edit staff details"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(u.id, u.fullName)}
                          className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                          title="Remove staff member"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Staff Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          resetForm();
        }}
        title={editingUserId ? 'Edit Staff Details' : 'Add Staff Member / Instructor'}
        subtitle="Manage personnel records for batch allocations and administration"
        maxWidth="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Staff Photo / DP Upload Section */}
          <div className="flex items-center gap-4 p-3.5 bg-slate-50 rounded-lg border border-slate-200">
            <div className="relative shrink-0">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Staff Profile Preview"
                  className="w-16 h-16 rounded-full object-cover border-2 border-brand-600 shadow-sm"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-brand-100 text-brand-800 flex items-center justify-center font-bold text-xl border-2 border-slate-200 shadow-2xs">
                  {fullName.trim() ? fullName.trim().charAt(0).toUpperCase() : <Camera className="w-6 h-6 text-brand-700" />}
                </div>
              )}
            </div>

            <div className="space-y-1.5 flex-1">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Profile Photo / DP
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/png,image/jpeg,image/webp,image/jpg"
                  onChange={handlePhotoFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  disabled={isProcessingPhoto}
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-brand-700 bg-white hover:bg-brand-50 border border-brand-300 rounded-md shadow-2xs transition-colors cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  {isProcessingPhoto ? 'Optimizing...' : avatarUrl ? 'Change Photo' : 'Upload Photo / DP'}
                </button>

                {avatarUrl && (
                  <button
                    type="button"
                    onClick={() => setAvatarUrl('')}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                    Remove
                  </button>
                )}
              </div>
              <p className="text-[11px] text-slate-500">
                Square photo recommended (JPG, PNG, WebP). Scaled & compressed automatically.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Full Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="e.g. Acharya Ramesh Joshi"
              className="w-full text-sm rounded-md border border-slate-300 px-3 py-2 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-700"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Designation / Position
              </label>
              <input
                type="text"
                value={designation}
                onChange={e => setDesignation(e.target.value)}
                placeholder="e.g. Senior Yoga Instructor"
                className="w-full text-sm rounded-md border border-slate-300 px-3 py-2 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-700"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Specialization / Discipline
              </label>
              <input
                type="text"
                value={specialization}
                onChange={e => setSpecialization(e.target.value)}
                placeholder="e.g. Hatha & Pranayama"
                className="w-full text-sm rounded-md border border-slate-300 px-3 py-2 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-700"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="e.g. 9823012345"
                className="w-full text-sm rounded-md border border-slate-300 px-3 py-2 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-700"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="e.g. ramesh@amrityoga.com"
                className="w-full text-sm rounded-md border border-slate-300 px-3 py-2 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-700"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Monthly Salary / Remuneration (₹)
              </label>
              <input
                type="number"
                value={salary}
                onChange={e => setSalary(e.target.value)}
                placeholder="e.g. 28000"
                min="0"
                step="any"
                className="w-full text-sm rounded-md border border-slate-300 px-3 py-2 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-700"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Status
              </label>
              <select
                value={active ? 'Active' : 'Inactive'}
                onChange={e => setActive(e.target.value === 'Active')}
                className="w-full text-sm rounded-md border border-slate-300 px-3 py-2 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-700"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setIsModalOpen(false);
                resetForm();
              }}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 rounded-md border border-slate-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-brand-700 hover:bg-brand-800 rounded-md transition-colors shadow-sm"
            >
              {editingUserId ? 'Save Changes' : 'Add Staff Member'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
