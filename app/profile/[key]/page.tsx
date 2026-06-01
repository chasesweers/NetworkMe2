import { ProfileView } from '@/components/profile/ProfileView'

export default async function ProfilePage({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params
  return <ProfileView personKey={key} />
}
