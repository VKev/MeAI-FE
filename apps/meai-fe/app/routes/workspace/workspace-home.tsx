import { useParams } from 'react-router';

export default function WorkspaceHome() {
  const { workspaceId } = useParams();
  console.log('🚀 ~ WorkspaceHome ~ workspaceId:', workspaceId);

  return <div className='text-white min-h-screen'>WorkspaceHome</div>;
}
