import { Search } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { useParams } from 'next/navigation'
import {
  ScaffoldActionsContainer,
  ScaffoldActionsGroup,
  ScaffoldContainerLegacy,
  ScaffoldFilterAndContent,
  ScaffoldSectionContent,
} from 'components/layouts/Scaffold'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { useOrganizationMemberDeleteMutation } from 'data/organizations/organization-member-delete-mutation'
import { useOrganizationMembersQuery } from 'data/organizations/organization-members-query'
import { useOrganizationRolesQuery } from 'data/organizations/organization-roles-query'
import { usePermissionsQuery } from 'data/permissions/permissions-query'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { useProfile } from 'lib/profile'
import { Input } from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { InviteMemberButton } from './invite-member-button'
import MembersView from 'app/(org)/org/[slug]/team/members-view'
import { hasMultipleOwners, useGetRolesManagementPermissions } from './team-settings.utils'

export function TeamSettings() {
  const params = useParams()
  const { slug } = params as { slug: string }

  const {
    organizationMembersCreate: organizationMembersCreationEnabled,
    organizationMembersDelete: organizationMembersDeletionEnabled,
  } = useIsFeatureEnabled(['organization_members:create', 'organization_members:delete'])

  const { profile } = useProfile()
  const selectedOrganization = useSelectedOrganization()
  const isOwner = selectedOrganization?.is_owner

  const { data: permissions } = usePermissionsQuery()
  const { data: rolesData } = useOrganizationRolesQuery({ slug: slug as string })
  const { data: members } = useOrganizationMembersQuery({ slug: slug as string })

  console.log(permissions)

  const roles = rolesData?.roles ?? []

  const { rolesAddable } = useGetRolesManagementPermissions(
    selectedOrganization?.slug,
    roles,
    permissions
  )

  const [isLeaving, setIsLeaving] = useState(false)
  const [searchString, setSearchString] = useState('')

  const canAddMembers = rolesAddable.length > 0
  const canLeave = !isOwner || (isOwner && hasMultipleOwners(members, roles))
  const [isLeaveTeamModalOpen, setIsLeaveTeamModalOpen] = useState(false)

  const { mutate: deleteMember } = useOrganizationMemberDeleteMutation({
    onSuccess: () => {
      setIsLeaving(false)
      setIsLeaveTeamModalOpen(false)
      window?.location.replace('/') // Force reload to clear Store
    },
    onError: (error) => {
      setIsLeaving(false)
      toast.error(`Failed to leave organization: ${error?.message}`)
    },
  })

  const leaveTeam = async () => {
    if (!slug) return console.error('Org slug is required')

    setIsLeaving(true)
    deleteMember({ slug: slug as string, gotrueId: profile!.gotrue_id })
  }

  return (
    <>
      <ScaffoldContainerLegacy>
        <ScaffoldFilterAndContent>
          <ScaffoldActionsContainer className="justify-between">
            <Input
              icon={<Search size={12} />}
              size="small"
              value={searchString}
              onChange={(e: any) => setSearchString(e.target.value)}
              name="email"
              id="email"
              placeholder="Filter members"
            />
            <ScaffoldActionsGroup>
              {organizationMembersCreationEnabled &&
                canAddMembers &&
                profile !== undefined &&
                selectedOrganization !== undefined && <InviteMemberButton />}
              {organizationMembersDeletionEnabled && (
                <>
                  <ButtonTooltip
                    type="default"
                    loading={isLeaving}
                    disabled={!canLeave}
                    tooltip={{
                      content: {
                        side: 'bottom',
                        text: !canLeave ? 'An organization requires at least 1 owner' : undefined,
                      },
                    }}
                    onClick={() => setIsLeaveTeamModalOpen(true)}
                  >
                    Leave team
                  </ButtonTooltip>
                </>
              )}
            </ScaffoldActionsGroup>
          </ScaffoldActionsContainer>
          <ScaffoldSectionContent className="w-full">
            <MembersView searchString={searchString} />
          </ScaffoldSectionContent>
        </ScaffoldFilterAndContent>
      </ScaffoldContainerLegacy>

      <ConfirmationModal
        size="medium"
        visible={isLeaveTeamModalOpen}
        title="Confirm to leave organization"
        confirmLabel="Leave"
        variant="warning"
        alert={{
          title: 'All of your user content will be permanently removed.',
          description: (
            <div>
              <p>
                Leaving the organization will delete all of your saved content in the projects of
                the organization, which includes:
              </p>
              <ul className="list-disc pl-4">
                <li>
                  SQL snippets <span className="text-foreground">(both private and shared)</span>
                </li>
                <li>Custom reports</li>
                <li>Log Explorer queries</li>
              </ul>
            </div>
          ),
        }}
        onCancel={() => setIsLeaveTeamModalOpen(false)}
        onConfirm={() => leaveTeam()}
      >
        <p className="text-sm text-foreground-light">
          Are you sure you want to leave this organization? This is permanent.
        </p>
      </ConfirmationModal>
    </>
  )
}
