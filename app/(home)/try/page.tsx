import { redirect } from 'next/navigation';

/** The demo used to have this page to itself. It is on the home page now. */
export default function TryPage() {
  redirect('/#try');
}
