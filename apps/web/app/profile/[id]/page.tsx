import { redirect } from 'next/navigation';

export default function ProfileRedirectPage({ params }: { params: { id: string } }) {
  redirect(`/profil/${params.id}`);
}
