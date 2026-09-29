import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { useSessionStore } from '@/features/auth/store/session-store'

import { adminUserKeys } from '../../hooks/admin-query-keys'
import type { AdminUsersQuery, UserFormValues, UserUpdatePayload } from '../model/admin-user'
import { createUser, deleteUser, fetchAdminUsers, updateUser } from '../services/admin-users.service'

export function useAdminUsers(query: AdminUsersQuery) {
  return useQuery({
    queryKey: adminUserKeys.list(query),
    queryFn: () => fetchAdminUsers(query),
    placeholderData: keepPreviousData,
  })
}

function useInvalidateUsers() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: adminUserKeys.all })
}

export function useCreateUser() {
  const invalidate = useInvalidateUsers()
  return useMutation({ mutationFn: (values: UserFormValues) => createUser(values), onSuccess: invalidate })
}

export function useUpdateUser() {
  const invalidate = useInvalidateUsers()
  return useMutation({
    mutationFn: ({ userId, payload }: { userId: string; payload: UserUpdatePayload }) => updateUser(userId, payload),
    onSuccess: ({ data: user }) => {
      // Editing your own name must show up in the header right away.
      const session = useSessionStore.getState()
      if (session.user?.id === user.id) session.updateProfile(user)
      return invalidate()
    },
  })
}

export function useDeleteUser() {
  const invalidate = useInvalidateUsers()
  return useMutation({ mutationFn: (userId: string) => deleteUser(userId), onSuccess: invalidate })
}
