import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * Global Auth Store — persisted to localStorage.
 * Stores the current user object and JWT token.
 */
const useAuthStore = create(
    persist(
        (set) => ({
            user: null,
            token: null,

            setAuth: (user, token) => {
                localStorage.setItem('ms_token', token)
                set({ user, token })
            },

            clearAuth: () => {
                localStorage.removeItem('ms_token')
                localStorage.removeItem('ms_user')
                set({ user: null, token: null })
            },

            isAdmin: () => useAuthStore.getState().user?.role === 'ADMIN',
            isCustomer: () => useAuthStore.getState().user?.role === 'CUSTOMER',
        }),
        {
            name: 'ms_user',
            partialize: (state) => ({ user: state.user, token: state.token }),
        }
    )
)

export default useAuthStore
