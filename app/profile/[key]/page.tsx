import { ProfileView } from '@/components/profile/ProfileView'

export default async function ProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ key: string }>
  searchParams: Promise<{ from?: string }>
}) {
  const { key } = await params
  const { from } = await searchParams
  return <ProfileView personKey={key} from={from} />
}
