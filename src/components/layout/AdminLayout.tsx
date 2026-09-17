import React, { useState, useEffect } from 'react';
import { Sidebar, NavigationTab } from './Sidebar';
import { Header } from './Header';
import { MobileNav } from './MobileNav';
import { storageService } from '../../services/storageService';
import { Student, Receipt, Enquiry, TrialClass } from '../../types';

// Modals
import { GlobalSearchModal } from '../common/GlobalSearchModal';
import { CollectFeeModal } from '../payments/CollectFeeModal';
import { ReceiptModal } from '../receipts/ReceiptModal';
import { EditReceiptModal } from '../receipts/EditReceiptModal';
import { WhatsAppModal } from '../whatsapp/WhatsAppModal';
import { StudentFormModal } from '../../features/students/StudentFormModal';
import { StudentProfileModal } from '../../features/students/StudentProfileModal';
import { ExpenseFormModal } from '../../features/expenses/ExpenseFormModal';
import { EnquiryFormModal } from '../../features/enquiries/EnquiryFormModal';
import { TrialFormModal } from '../../features/trials/TrialFormModal';

// Views
import { DashboardView } from '../../features/dashboard/DashboardView';
import { StudentsView } from '../../features/students/StudentsView';
import { BatchesView } from '../../features/batches/BatchesView';
import { FeesView } from '../../features/fees/FeesView';
import { PaymentsLedgerView } from '../../features/payments/PaymentsLedgerView';
import { ReceiptsView } from '../../features/receipts/ReceiptsView';
import { ExpensesView } from '../../features/expenses/ExpensesView';
import { EnquiriesView } from '../../features/enquiries/EnquiriesView';
import { TrialsView } from '../../features/trials/TrialsView';
import { FinancialReportsView } from '../../features/reports/FinancialReportsView';
import { StudentReportsView } from '../../features/reports/StudentReportsView';
import { UsersView } from '../../features/users/UsersView';
import { SettingsView } from '../../features/settings/SettingsView';

const VALID_TABS: NavigationTab[] = [
  'dashboard',
  'students',
  'batches',
  'enquiries',
  'trials',
  'fees',
  'payments',
  'receipts',
  'expenses',
  'student-reports',
  'financial-reports',
  'users',
  'settings',
];

const getInitialTab = (): NavigationTab => {
  try {
    const hash = window.location.hash.replace(/^#/, '') as NavigationTab;
    if (VALID_TABS.includes(hash)) return hash;
    const stored = localStorage.getItem('ayc_active_tab') as NavigationTab;
    if (VALID_TABS.includes(stored)) return stored;
  } catch {}
  return 'dashboard';
};

export const AdminLayout: React.FC = () => {
  const [currentTab, setCurrentTabState] = useState<NavigationTab>(getInitialTab);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [, setTick] = useState(0);

  const setCurrentTab = (tab: NavigationTab) => {
    setCurrentTabState(tab);
    try {
      window.location.hash = tab;
      localStorage.setItem('ayc_active_tab', tab);
    } catch {}
  };

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace(/^#/, '') as NavigationTab;
      if (VALID_TABS.includes(hash)) {
        setCurrentTabState(hash);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    const handleUpdate = () => {
      setTick(t => t + 1);
    };
    window.addEventListener('amrit_data_updated', handleUpdate);
    // Automatically trigger background Supabase cloud sync on mount
    storageService.initCloudSync();
    return () => window.removeEventListener('amrit_data_updated', handleUpdate);
  }, []);

  // Global modals
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Collect Fee Modal State
  const [isCollectFeeOpen, setIsCollectFeeOpen] = useState(false);
  const [collectFeeStudentId, setCollectFeeStudentId] = useState<string | undefined>(undefined);
  const [collectFeeAmount, setCollectFeeAmount] = useState<number | undefined>(undefined);

  // Receipt Modal State
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [receiptStudentPhone, setReceiptStudentPhone] = useState<string>('');

  // Edit Receipt Modal State
  const [receiptToEdit, setReceiptToEdit] = useState<Receipt | null>(null);
  const [isEditReceiptOpen, setIsEditReceiptOpen] = useState(false);

  // Student Form & Profile Modal State
  const [isStudentFormOpen, setIsStudentFormOpen] = useState(false);
  const [studentToEdit, setStudentToEdit] = useState<Student | null>(null);
  const [studentInitialData, setStudentInitialData] = useState<Partial<Student> | undefined>(undefined);
  const [selectedStudentProfile, setSelectedStudentProfile] = useState<Student | null>(null);
  const [isStudentProfileOpen, setIsStudentProfileOpen] = useState(false);

  // WhatsApp Modal State
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(false);
  const [whatsAppPhone, setWhatsAppPhone] = useState('');
  const [whatsAppRecipient, setWhatsAppRecipient] = useState('');
  const [whatsAppTemplate, setWhatsAppTemplate] = useState<any>('fee_reminder');
  const [whatsAppParams, setWhatsAppParams] = useState<any>({});

  // Expense Modal State
  const [isExpenseFormOpen, setIsExpenseFormOpen] = useState(false);

  // Enquiry & Trial Modals
  const [isEnquiryFormOpen, setIsEnquiryFormOpen] = useState(false);
  const [isTrialFormOpen, setIsTrialFormOpen] = useState(false);
  const [trialInitialLead, setTrialInitialLead] = useState<any>(undefined);

  const settings = storageService.getSettings();
  const metrics = storageService.getDashboardMetrics();

  // Handlers
  const handleOpenCollectFee = (studentId?: string, amount?: number) => {
    setCollectFeeStudentId(studentId);
    setCollectFeeAmount(amount);
    setIsCollectFeeOpen(true);
  };

  const handleOpenWhatsApp = (phone: string, name: string, template: any = 'fee_reminder', params: any = {}) => {
    setWhatsAppPhone(phone);
    setWhatsAppRecipient(name);
    setWhatsAppTemplate(template);
    setWhatsAppParams(params);
    setIsWhatsAppOpen(true);
  };

  const handleViewReceipt = (receipt: Receipt) => {
    let student = storageService.getStudentById(receipt.studentId);
    if (!student) {
      student = storageService.getStudents().find(
        s => s.id === receipt.studentId || (s.studentId && s.studentId === receipt.studentCode) || s.fullName.toLowerCase() === (receipt.studentName || '').toLowerCase()
      );
    }
    setReceiptStudentPhone(student?.whatsappNumber || student?.mobileNumber || '');
    setSelectedReceipt(receipt);
    setIsReceiptModalOpen(true);
  };

  const handleEditReceipt = (receipt: Receipt) => {
    setReceiptToEdit(receipt);
    setIsEditReceiptOpen(true);
  };

  const handleViewStudent = (student: Student) => {
    setSelectedStudentProfile(student);
    setIsStudentProfileOpen(true);
  };

  const handleViewStudentById = (studentId: string) => {
    const s = storageService.getStudentById(studentId);
    if (s) {
      handleViewStudent(s);
    }
  };

  const handleEditStudent = (student: Student) => {
    setIsStudentProfileOpen(false);
    setStudentToEdit(student);
    setStudentInitialData(undefined);
    setIsStudentFormOpen(true);
  };

  const handleAddNewStudent = (initial?: Partial<Student>) => {
    setStudentToEdit(null);
    setStudentInitialData(initial);
    setIsStudentFormOpen(true);
  };

  const handleScheduleTrialForEnquiry = (enquiry: Enquiry) => {
    setTrialInitialLead({
      enquiryId: enquiry.id,
      name: enquiry.name,
      phone: enquiry.phone,
      preferredBatchId: enquiry.preferredBatchId,
    });
    setIsTrialFormOpen(true);
  };

  const handleConvertTrialToStudent = (trial: TrialClass) => {
    handleAddNewStudent({
      fullName: trial.studentName,
      mobileNumber: trial.phone,
      whatsappNumber: trial.phone,
      batchId: trial.batchId,
      notes: `Converted from trial class (${trial.trialDate})`,
    });
  };

  const handleConvertEnquiryToStudent = (enquiry: Enquiry) => {
    handleAddNewStudent({
      fullName: enquiry.name,
      mobileNumber: enquiry.phone,
      whatsappNumber: enquiry.whatsapp || enquiry.phone,
      batchId: enquiry.preferredBatchId,
      feePlan: enquiry.interestedPlan,
      notes: `Enrolled from prospect enquiry (${enquiry.source})`,
    });
  };

  const getPageTitle = () => {
    switch (currentTab) {
      case 'dashboard': return 'Dashboard';
      case 'students': return 'Students';
      case 'batches': return 'Batches';
      case 'fees': return 'Fees';
      case 'payments': return 'Payments';
      case 'receipts': return 'Receipts';
      case 'expenses': return 'Expenses';
      case 'enquiries': return 'Enquiries';
      case 'trials': return 'Trial Classes';
      case 'financial-reports': return 'Reports';
      case 'student-reports': return 'Student Reports';
      case 'users': return 'Staff';
      case 'settings': return 'Settings';
      default: return 'Amrit Yoga';
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans text-slate-900">
      {/* Desktop Persistent Left Sidebar */}
      <div className="hidden md:flex h-full">
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          pendingCount={metrics.overdueCount}
          enquiriesCount={metrics.newEnquiriesCount}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Header */}
        <Header
          title={getPageTitle()}
          onOpenSearch={() => setIsSearchOpen(true)}
          onOpenCollectFee={() => handleOpenCollectFee()}
          onOpenAddStudent={() => handleAddNewStudent()}
          onToggleMobileNav={() => setIsMobileNavOpen(true)}
        />

        {/* Scrollable Viewport - Fluid full-width ERP layout with mobile bottom-nav padding */}
        <main className="flex-1 overflow-y-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 pb-24 md:pb-8">
          <div className="w-full">
            {currentTab === 'dashboard' && (
              <DashboardView
                onNavigateTab={setCurrentTab}
                onOpenCollectFeeForStudent={(studentId, amount) => handleOpenCollectFee(studentId, amount)}
                onOpenWhatsApp={handleOpenWhatsApp}
                onViewReceipt={handleViewReceipt}
                onViewStudent={handleViewStudent}
                onOpenAddStudent={() => handleAddNewStudent()}
                onOpenAddEnquiry={() => setIsEnquiryFormOpen(true)}
                onOpenAddExpense={() => setIsExpenseFormOpen(true)}
              />
            )}

            {currentTab === 'students' && (
              <StudentsView
                onViewStudent={handleViewStudent}
                onEditStudent={handleEditStudent}
                onCollectFee={s => handleOpenCollectFee(s.id, s.monthlyFee)}
                onOpenWhatsApp={(phone, name) => handleOpenWhatsApp(phone, name, 'fee_reminder', { studentName: name })}
                onOpenAddStudent={() => handleAddNewStudent()}
              />
            )}

            {currentTab === 'batches' && (
              <BatchesView onViewStudent={handleViewStudent} />
            )}

            {currentTab === 'fees' && (
              <FeesView
                onCollectFee={(studentId, amount) => handleOpenCollectFee(studentId, amount)}
                onOpenWhatsApp={handleOpenWhatsApp}
                onViewStudentById={handleViewStudentById}
              />
            )}

            {currentTab === 'payments' && (
              <PaymentsLedgerView
                onViewReceipt={handleViewReceipt}
                onEditReceipt={handleEditReceipt}
              />
            )}

            {currentTab === 'receipts' && (
              <ReceiptsView
                onViewReceipt={handleViewReceipt}
                onOpenWhatsApp={handleOpenWhatsApp}
                onEditReceipt={handleEditReceipt}
              />
            )}

            {currentTab === 'expenses' && (
              <ExpensesView
                isAddModalOpen={isExpenseFormOpen}
                onCloseAddModal={() => setIsExpenseFormOpen(false)}
              />
            )}

            {currentTab === 'enquiries' && (
              <EnquiriesView
                onOpenWhatsApp={handleOpenWhatsApp}
                onScheduleTrialForEnquiry={handleScheduleTrialForEnquiry}
                onConvertToStudent={handleConvertEnquiryToStudent}
              />
            )}

            {currentTab === 'trials' && (
              <TrialsView
                onOpenWhatsApp={handleOpenWhatsApp}
                onConvertTrialToStudent={handleConvertTrialToStudent}
              />
            )}

            {currentTab === 'financial-reports' && (
              <FinancialReportsView />
            )}

            {currentTab === 'student-reports' && (
              <StudentReportsView />
            )}

            {currentTab === 'users' && (
              <UsersView />
            )}

            {currentTab === 'settings' && (
              <SettingsView />
            )}
          </div>
        </main>
      </div>

      {/* Mobile Drawer & Bottom Navigation */}
      <MobileNav
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        isOpen={isMobileNavOpen}
        onClose={() => setIsMobileNavOpen(false)}
        onOpenCollectFee={() => handleOpenCollectFee()}
        onOpenAddStudent={() => handleAddNewStudent()}
      />

      {/* GLOBAL MODALS */}
      {/* 1. Global Search (Ctrl+K) */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectStudent={handleViewStudent}
        onSelectReceipt={handleViewReceipt}
        onSelectEnquiry={e => {
          setCurrentTab('enquiries');
        }}
      />

      {/* 2. Fast Collect Fee Modal */}
      <CollectFeeModal
        isOpen={isCollectFeeOpen}
        onClose={() => setIsCollectFeeOpen(false)}
        preselectedStudentId={collectFeeStudentId}
        preselectedAmount={collectFeeAmount}
        onSuccess={(receipt, student) => {
          handleViewReceipt(receipt);
        }}
      />

      {/* 3. Official Printable Receipt Modal */}
      <ReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => {
          setIsReceiptModalOpen(false);
          setSelectedReceipt(null);
        }}
        receipt={selectedReceipt}
        settings={settings}
        studentPhone={receiptStudentPhone}
        onEdit={handleEditReceipt}
      />

      {/* 3b. Edit Receipt Modal */}
      <EditReceiptModal
        isOpen={isEditReceiptOpen}
        onClose={() => {
          setIsEditReceiptOpen(false);
          setReceiptToEdit(null);
        }}
        receipt={receiptToEdit}
        onSuccess={(updatedReceipt) => {
          if (selectedReceipt && selectedReceipt.receiptNo === updatedReceipt.receiptNo) {
            setSelectedReceipt(updatedReceipt);
          }
        }}
      />

      {/* 4. Student Form Modal (Add / Edit) */}
      <StudentFormModal
        isOpen={isStudentFormOpen}
        onClose={() => setIsStudentFormOpen(false)}
        studentToEdit={studentToEdit}
        initialData={studentInitialData}
        onSaved={(student, receipt) => {
          if (receipt) {
            handleViewReceipt(receipt);
          } else {
            handleViewStudent(student);
          }
        }}
      />

      {/* 5. Student Profile Modal */}
      <StudentProfileModal
        isOpen={isStudentProfileOpen}
        onClose={() => setIsStudentProfileOpen(false)}
        student={selectedStudentProfile}
        onEdit={handleEditStudent}
        onCollectFee={s => {
          setIsStudentProfileOpen(false);
          handleOpenCollectFee(s.id, s.monthlyFee);
        }}
        onOpenWhatsApp={(phone, name) => handleOpenWhatsApp(phone, name, 'fee_reminder', { studentName: name })}
        onViewReceipt={handleViewReceipt}
      />

      {/* 6. WhatsApp Message Preview & Dispatch Modal */}
      <WhatsAppModal
        isOpen={isWhatsAppOpen}
        onClose={() => setIsWhatsAppOpen(false)}
        phone={whatsAppPhone}
        recipientName={whatsAppRecipient}
        template={whatsAppTemplate}
        params={whatsAppParams}
      />

      {/* 7. New Enquiry Modal */}
      <EnquiryFormModal
        isOpen={isEnquiryFormOpen}
        onClose={() => setIsEnquiryFormOpen(false)}
        onSaved={() => setCurrentTab('enquiries')}
      />

      {/* 8. Trial Class Modal */}
      <TrialFormModal
        isOpen={isTrialFormOpen}
        onClose={() => setIsTrialFormOpen(false)}
        initialLead={trialInitialLead}
        onSaved={() => setCurrentTab('trials')}
      />
    </div>
  );
};
