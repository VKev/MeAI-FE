import type { Route } from './+types/home';

export function meta({}: Route.MetaArgs) {
  return [{ title: 'MeAI App' }, { name: 'description', content: 'Welcome to MeAI App!' }];
}

export default function Home() {
  return (
    <>
      <h1 className='text-2xl font-extrabold'>hello world</h1>
    </>
  );
}
