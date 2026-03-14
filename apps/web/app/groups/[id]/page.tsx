import { redirect } from 'next/navigation';

export default function GroupRedirectPage({ params }: { params: { id: string } }) {
  redirect(`/groupes/${params.id}`);
}
