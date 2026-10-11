export interface User {
  id: string
  linkedInId: string
  fullName: string
  email: string
  profilePictureUrl?: string
  isEmailVerified: boolean
  role: 'Student' | 'Admin'
}

export interface Internship {
  id: string
  userId: string
  companyId: string
  status: 'Pending' | 'Approved' | 'Rejected'
  isAnonymous: boolean
}

export interface Company {
  id: string
  name: string
  slug: string
}
