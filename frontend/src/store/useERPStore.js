import { create } from 'zustand';
import useAuthStore from './authStore';

export const useERPStore = create((set, get) => ({
    // Shared State
    inventory: [],
    transactions: [],
    customers: [],
    dashboardStats: {
        admin: {
            totalRevenue: 0,
            activeVaults: 0,
            todayTransactions: 0,
            totalInventory: 0,
            lowStockAlerts: 0,
        },
        customer: {
            vaultBalance: 0,
            totalDeposits: 0,
            totalWithdrawals: 0,
        }
    },
    // Keep mock data for pages without backend models yet (reports, forecasting)
    reports: [],
    forecast: { nextMonthDemand: 0, predictionAccuracy: 0, topMaterials: [], recentTrends: [] },
    isLoading: false,

    // ── Fetch Admin Data ────────────────────────────────────────────────────────
    fetchAdminData: async () => {
        set({ isLoading: true });
        try {
            const token = useAuthStore.getState().token;
            if (!token) return;
            const headers = { Authorization: `Bearer ${token}` };

            const [invRes, transRes, custRes] = await Promise.all([
                fetch('/api/admin/inventory', { headers }),
                fetch('/api/admin/ledger', { headers }),
                fetch('/api/admin/customers?limit=100', { headers })
            ]);

            const inventoryData = invRes.ok ? await invRes.json() : { inventory: [] };
            const transData = transRes.ok ? await transRes.json() : { entries: [], aggregates: {} };
            const custData = custRes.ok ? await custRes.json() : { customers: [] };

            const rawInventory = inventoryData.inventory || [];
            const rawTransactions = transData.entries || [];
            const rawCustomers = custData.customers || [];

            // 1. Map Inventory to Frontend Format
            const mappedInventory = rawInventory.map(item => ({
                id: item.id.toString(),
                name: item.itemName,
                currentStockKg: item.currentStockKg,
                minThreshold: item.reorderThresholdKg,
                status: item.belowReorder ? "LOW" : "OPTIMAL",
                category: item.category,
                pricePerKg: item.pricePerKg
            }));

            // 2. Map Transactions to Frontend Format
            const mappedTransactions = rawTransactions.map(tx => ({
                id: `TXN-${tx.id}`,
                date: new Date(tx.timestamp).toISOString().split('T')[0],
                time: new Date(tx.timestamp).toLocaleTimeString(),
                type: tx.type === 'DEPOSIT' ? 'VAULT_DEPOSIT' : (tx.type === 'WITHDRAWAL' ? 'VAULT_WITHDRAWAL' : tx.type),
                customerName: tx.customerProfile?.fullName || "Walk-in Customer",
                millId: tx.customerProfile?.millId || "N/A",
                material: tx.itemType,
                quantityKg: tx.weightKg,
                processingFee: tx.processingFeePaid,
                totalAmount: tx.type === 'RETAIL_SALE' ? tx.processingFeePaid : 0,
                status: "Completed"
            }));

            // 3. Map Customers to Frontend Format
            const mappedCustomers = rawCustomers.map(c => ({
                id: c.id.toString(),
                millId: c.millId,
                name: c.fullName,
                phone: c.user?.phone || "",
                password: "Hidden by Admin",
                vaultBalance: c.vaults?.reduce((sum, v) => sum + v.balanceKg, 0) || 0,
                totalDeposits: 0, // Mocked for now
                totalWithdrawals: 0, // Mocked for now
                registeredDate: c.user?.createdAt ? new Date(c.user.createdAt).toISOString().split('T')[0] : "N/A",
                lastTransaction: "N/A"
            }));

            // 4. Compute Dashboard Stats
            const totalInventory = mappedInventory.reduce((sum, item) => sum + item.currentStockKg, 0);
            const lowStockAlerts = mappedInventory.filter(item => item.status !== "OPTIMAL").length;
            const totalRevenue = transData.aggregates?.totalFees || 0;
            const todayCount = rawTransactions.filter(tx => new Date(tx.timestamp).toDateString() === new Date().toDateString()).length;

            set({
                inventory: mappedInventory,
                transactions: mappedTransactions,
                customers: mappedCustomers,
                dashboardStats: {
                    ...get().dashboardStats,
                    admin: {
                        totalRevenue,
                        activeVaults: mappedCustomers.length,
                        todayTransactions: todayCount,
                        totalInventory,
                        lowStockAlerts
                    }
                },
                isLoading: false
            });

        } catch (error) {
            console.error("Failed to fetch admin data", error);
            set({ isLoading: false });
        }
    },

    // ── Fetch Customer Data ─────────────────────────────────────────────────────
    fetchCustomerData: async () => {
        set({ isLoading: true });
        try {
            const token = useAuthStore.getState().token;
            if (!token) return;
            const headers = { Authorization: `Bearer ${token}` };

            // Endpoint for customer profile/transactions
            const profileRes = await fetch('/api/customer/profile', { headers });
            if (!profileRes.ok) throw new Error("Failed to load customer profile");

            const profileData = await profileRes.json();
            const profile = profileData.profile;

            // Map Vaults
            const totalBalance = profile.vaults?.reduce((sum, v) => sum + v.balanceKg, 0) || 0;

            // Map Transactions
            const rawTx = profile.transactions || [];
            const mappedTransactions = rawTx.map(tx => ({
                id: `TXN-${tx.id}`,
                date: new Date(tx.timestamp).toISOString().split('T')[0],
                time: new Date(tx.timestamp).toLocaleTimeString(),
                type: tx.type === 'DEPOSIT' ? 'VAULT_DEPOSIT' : (tx.type === 'WITHDRAWAL' ? 'VAULT_WITHDRAWAL' : tx.type),
                material: tx.itemType,
                quantityKg: tx.weightKg,
                processingFee: tx.processingFeePaid,
                totalAmount: tx.type === 'RETAIL_SALE' ? tx.processingFeePaid : 0,
                status: "Completed"
            }));

            // Calculate deposits vs withdrawals from transactions
            const totalDeposits = rawTx.filter(t => t.type === 'DEPOSIT').reduce((sum, t) => sum + t.weightKg, 0);
            const totalWithdrawals = rawTx.filter(t => t.type === 'WITHDRAWAL').reduce((sum, t) => sum + t.weightKg, 0);

            set({
                transactions: mappedTransactions,
                customers: [{
                    ...profile,
                    name: profile.fullName,
                    vaultBalance: totalBalance,
                    totalDeposits,
                    totalWithdrawals
                }],
                dashboardStats: {
                    ...get().dashboardStats,
                    customer: {
                        vaultBalance: totalBalance,
                        totalDeposits,
                        totalWithdrawals
                    }
                },
                isLoading: false
            });

        } catch (error) {
            console.error("Failed to fetch customer data", error);
            set({ isLoading: false });
        }
    }
}));
