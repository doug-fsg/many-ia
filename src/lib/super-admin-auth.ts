export const isSuperAdmin = (): boolean => {
  if (typeof window === 'undefined') return false
  return sessionStorage.getItem('super_admin_token') === 'authenticated'
}

export const requireSuperAdmin = () => {
  if (!isSuperAdmin()) {
    if (typeof window !== 'undefined') {
      window.location.href = '/super_admin/sign_in'
    }
    return false
  }
  return true
}

export const logoutSuperAdmin = () => {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('super_admin_token')
    window.location.href = '/super_admin/sign_in'
  }
}
