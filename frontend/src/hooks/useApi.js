import { useState, useCallback } from 'react'

/**
 * Generic data-fetching hook.
 * Usage: const { data, loading, error, execute } = useApi(apiFunction)
 */
export default function useApi(apiFunction) {
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    const execute = useCallback(async (...args) => {
        setLoading(true)
        setError(null)
        try {
            const res = await apiFunction(...args)
            setData(res.data)
            return res.data
        } catch (err) {
            setError(err.response?.data?.message || err.message)
            throw err
        } finally {
            setLoading(false)
        }
    }, [apiFunction])

    return { data, loading, error, execute }
}
