import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar, TabType } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { CrmView } from './components/CrmView';
import { SalesView } from './components/SalesView';
import { FinanceView } from './components/FinanceView';
import { InventoryView } from './components/InventoryView';
import { SuppliersView } from './components/SuppliersView';
import { ReportsView } from './components/ReportsView';
import { AuditLogsView } from './components/AuditLogsView';
import { AdminEmployeesView } from './components/AdminEmployeesView';

// Modals
import { NewSaleModal } from './components/modals/NewSaleModal';
import { NewClientModal } from './components/modals/NewClientModal';
import { CustomerDetailModal } from './components/CustomerDetailModal';
import { ReceivePaymentModal } from './components/modals/ReceivePaymentModal';
import { NewPayableModal } from './components/modals/NewPayableModal';
import { AddStockModal } from './components/modals/AddStockModal';
import { RecordBottleReturnModal } from './components/modals/RecordBottleReturnModal';
import { GlobalSearchModal } from './components/modals/GlobalSearchModal';
import { NotificationsDrawer } from './components/modals/NotificationsDrawer';

import { storageService } from './services/storage';
import { LoginView } from './components/LoginView';
import { ChangePasswordModal } from './components/modals/ChangePasswordModal';
import { Customer, Receivable, Product, SystemUser, CustomerType, CustomerStatus } from './types';

export default function App() {
  const [, setRenderTrigger] = useState(0);
  const [booting, setBooting] = useState(true);
  const [serverError, setServerError] = useState<string | null>(null);

  // Subscribe to storage changes for reactive state
  useEffect(() => {
    const unsubscribe = storageService.subscribeToStore(() => {
      setRenderTrigger(prev => prev + 1);
    });
    return () => unsubscribe();
  }, []);

  // Resume a previous session, if any
  useEffect(() => {
    storageService
      .restoreSession()
      .catch(() => setServerError('Não foi possível ligar ao servidor. Verifique se o sistema está em execução.'))
      .finally(() => setBooting(false));
  }, []);

  if (booting) {
    return (
      <div className="min-h-screen bg-[#0A0F1D] flex items-center justify-center text-slate-400 text-sm">
        A carregar...
      </div>
    );
  }

  if (!storageService.isAuthenticated()) {
    return <LoginView initialError={serverError} />;
  }

  return <AuthenticatedApp currentUser={storageService.getCurrentUser()} />;
}

function AuthenticatedApp({ currentUser }: { currentUser: SystemUser }) {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // mobile drawer
  const syncStatus = storageService.getSyncStatus();

  // Guard: if current user is not admin and active tab is admin, fallback to dashboard
  useEffect(() => {
    if (currentUser.role !== 'admin' && activeTab === 'admin') {
      setActiveTab('dashboard');
    }
  }, [currentUser, activeTab]);

  const handleSelectTab = (tab: TabType) => {
    if (tab === 'admin' && currentUser.role !== 'admin') {
      return; // Non-admin cannot access admin tab
    }
    setActiveTab(tab);
    setIsSidebarOpen(false);
  };

  // Modals state
  const [isNewSaleOpen, setIsNewSaleOpen] = useState(false);
  const [newSaleInitialCustomer, setNewSaleInitialCustomer] = useState<Customer | null>(null);

  const [isNewClientOpen, setIsNewClientOpen] = useState(false);
  const [newClientDefaultType, setNewClientDefaultType] = useState<CustomerType>('B2B');
  const [newClientDefaultStatus, setNewClientDefaultStatus] = useState<CustomerStatus>('lead');

  const [customerDetail, setCustomerDetail] = useState<Customer | null>(null);
  const [receivableToPay, setReceivableToPay] = useState<Receivable | null>(null);

  const [isNewPayableOpen, setIsNewPayableOpen] = useState(false);
  const [isAddStockOpen, setIsAddStockOpen] = useState(false);
  const [productForStock, setProductForStock] = useState<Product | null>(null);

  const [customerForBottleReturn, setCustomerForBottleReturn] = useState<Customer | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // Calculate badge counts
  const products = storageService.getProducts();
  const receivables = storageService.getReceivables();
  const customers = storageService.getCustomers();
  const notifications = storageService.getNotifications();

  const stockAlertsCount = products.filter(p => !p.isService && p.currentStock <= p.minStock).length;
  const todayIso = new Date().toISOString().split('T')[0];
  const overdueReceivablesCount = receivables.filter(
    r => r.status !== 'pago' && r.status !== 'cancelado' && r.remainingAmount > 0 && r.dueDate < todayIso
  ).length;
  const inactiveClientsCount = customers.filter(c => {
    if (c.status === 'cliente_inativo') return true;
    if (!c.lastPurchaseDate) return false;
    const diff = (Date.now() - new Date(c.lastPurchaseDate).getTime()) / (1000 * 3600 * 24);
    return diff > 30;
  }).length;
  const unreadNotificationsCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="min-h-screen bg-[#0A0F1D] flex flex-col text-slate-100 font-sans antialiased selection:bg-cyan-500 selection:text-white">
      {syncStatus === 'error' && (
        <div className="bg-rose-900/80 border-b border-rose-700 text-rose-100 text-xs px-4 py-2 flex items-center justify-between gap-3">
          <span>Sem ligação ao servidor — as alterações recentes ainda não foram guardadas no banco de dados.</span>
          <button
            onClick={() => storageService.retrySync()}
            className="px-2.5 py-1 rounded-lg bg-rose-700 hover:bg-rose-600 font-semibold cursor-pointer"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {/* Top Navbar */}
      <Navbar
        currentUser={currentUser}
        onToggleSidebar={() => setIsSidebarOpen(o => !o)}
        onLogout={() => storageService.logout()}
        onChangePassword={() => setIsChangePasswordOpen(true)}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onOpenNewSale={() => {
          setNewSaleInitialCustomer(null);
          setIsNewSaleOpen(true);
        }}
        unreadNotificationsCount={unreadNotificationsCount}
      />

      {/* Main Layout Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Backdrop for the mobile drawer */}
        {isSidebarOpen && (
          <div
            className="fixed inset-x-0 bottom-0 top-[4.5rem] z-40 bg-black/60 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Left Navigation Sidebar */}
        <Sidebar
          isOpen={isSidebarOpen}
          activeTab={activeTab}
          onSelectTab={handleSelectTab}
          userRole={currentUser.role}
          currentUserName={currentUser.name}
          currentUserRoleTitle={currentUser.roleTitle}
          badgeCounts={{
            stockAlerts: stockAlertsCount,
            overdueReceivables: overdueReceivablesCount,
            inactiveClients: inactiveClientsCount
          }}
        />

        {/* Dynamic Main Workspace View */}
        <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden p-3 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto min-w-0">
            {activeTab === 'dashboard' && (
              <DashboardView
                onNavigateToTab={handleSelectTab}
                onOpenNewSale={() => {
                  setNewSaleInitialCustomer(null);
                  setIsNewSaleOpen(true);
                }}
                onOpenNewClient={() => {
                  setNewClientDefaultType('B2B');
                  setNewClientDefaultStatus('lead');
                  setIsNewClientOpen(true);
                }}
                onOpenNewPayable={() => setIsNewPayableOpen(true)}
                onOpenAddStock={() => {
                  setProductForStock(null);
                  setIsAddStockOpen(true);
                }}
                onOpenNotifications={() => setIsNotificationsOpen(true)}
              />
            )}

            {activeTab === 'crm' && (
              <CrmView
                onSelectCustomer={setCustomerDetail}
                onOpenNewClient={(type = 'B2B', status?: CustomerStatus) => {
                  setNewClientDefaultType(type);
                  setNewClientDefaultStatus(status || (type === 'B2B' ? 'lead' : 'cliente'));
                  setIsNewClientOpen(true);
                }}
              />
            )}

            {activeTab === 'vendas' && (
              <SalesView
                onOpenNewSale={() => {
                  setNewSaleInitialCustomer(null);
                  setIsNewSaleOpen(true);
                }}
              />
            )}

            {activeTab === 'financeiro' && (
              <FinanceView
                onOpenReceivePayment={setReceivableToPay}
                onOpenNewPayable={() => setIsNewPayableOpen(true)}
              />
            )}

            {activeTab === 'estoque' && (
              <InventoryView
                onOpenAddStock={(prod) => {
                  setProductForStock(prod || null);
                  setIsAddStockOpen(true);
                }}
              />
            )}

            {activeTab === 'fornecedores' && <SuppliersView />}

            {activeTab === 'relatorios' && <ReportsView />}

            {activeTab === 'auditoria' && <AuditLogsView />}

            {activeTab === 'admin' && currentUser.role === 'admin' && (
              <AdminEmployeesView currentUser={currentUser} />
            )}
          </div>
        </main>
      </div>

      {/* MODALS */}
      {/* 1. New Sale Modal */}
      <NewSaleModal
        isOpen={isNewSaleOpen}
        onClose={() => setIsNewSaleOpen(false)}
        initialCustomer={newSaleInitialCustomer}
        onSaleCreated={() => {
          // Triggered when sale is successfully made
        }}
      />

      {/* 2. New Client Modal */}
      <NewClientModal
        isOpen={isNewClientOpen}
        onClose={() => setIsNewClientOpen(false)}
        defaultType={newClientDefaultType}
        defaultStatus={newClientDefaultStatus}
        onClientCreated={() => {
          // Triggered when client is added
        }}
      />

      {/* 3. Customer 360 Detail Modal */}
      <CustomerDetailModal
        customer={customerDetail}
        onClose={() => setCustomerDetail(null)}
        onOpenNewSaleForCustomer={(cust) => {
          setCustomerDetail(null);
          setNewSaleInitialCustomer(cust);
          setIsNewSaleOpen(true);
        }}
        onRecordBottleReturn={(cust) => {
          setCustomerForBottleReturn(cust);
        }}
      />

      {/* 4. Receive Payment Modal */}
      <ReceivePaymentModal
        receivable={receivableToPay}
        onClose={() => setReceivableToPay(null)}
        onPaymentProcessed={() => {
          // Triggered when payment is received
        }}
      />

      {/* 5. New Payable Modal */}
      <NewPayableModal
        isOpen={isNewPayableOpen}
        onClose={() => setIsNewPayableOpen(false)}
        onPayableCreated={() => {
          // Triggered when payable is added
        }}
      />

      {/* 6. Add / Adjust Stock Modal */}
      <AddStockModal
        isOpen={isAddStockOpen}
        onClose={() => setIsAddStockOpen(false)}
        initialProduct={productForStock}
        onStockAdded={() => {
          // Triggered when stock is replenished
        }}
      />

      {/* 7. Record Bottle Return Modal */}
      <RecordBottleReturnModal
        customer={customerForBottleReturn}
        onClose={() => setCustomerForBottleReturn(null)}
        onReturned={() => {
          // Refresh customer detail if open
          if (customerDetail && customerForBottleReturn?.id === customerDetail.id) {
            const updated = storageService.getCustomers().find(c => c.id === customerDetail.id);
            setCustomerDetail(updated || null);
          }
        }}
      />

      {/* 8. Global Search (Cmd+K) Modal */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectCustomer={(c) => {
          setCustomerDetail(c);
        }}
        onSelectOrder={() => {
          handleSelectTab('vendas');
        }}
        onNavigateTab={(tab) => {
          handleSelectTab(tab);
        }}
      />

      <ChangePasswordModal isOpen={isChangePasswordOpen} onClose={() => setIsChangePasswordOpen(false)} />

      {/* 9. Notifications Drawer */}
      <NotificationsDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        onNavigateTab={(tab) => {
          handleSelectTab(tab);
        }}
      />
    </div>
  );
}
