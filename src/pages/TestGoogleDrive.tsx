import { GoogleDriveImage } from "@/components/ui/google-drive-image";

export default function TestGoogleDrive() {
  const testPhotos = [
    {
      name: 'Foto Frente',
      url: 'https://drive.google.com/open?id=1ZpaQ5EKDJOXFJrAWH1oy5u_VLGs5Xsh5'
    },
    {
      name: 'Foto Lado',
      url: 'https://drive.google.com/open?id=1MWn39wmt62fT6-BcHavfmajwoQjRbTbo'
    },
    {
      name: 'Foto Costas',
      url: 'https://drive.google.com/open?id=1BFnn3SBdL25Ns2WfKzOQaUi_BFVkWKXS'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-900 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">
          🧪 Teste GoogleDriveImage Component
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testPhotos.map((photo, index) => (
            <div key={index} className="bg-slate-800 rounded-lg p-4">
              <h3 className="text-white font-semibold mb-3">{photo.name}</h3>
              
              <div className="bg-slate-700 rounded-lg overflow-hidden" style={{ height: '400px' }}>
                <GoogleDriveImage
                  src={photo.url}
                  alt={photo.name}
                  className="w-full h-full"
                />
              </div>
              
              <div className="mt-3 text-xs text-slate-400 break-all">
                {photo.url}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 bg-blue-900/30 border border-blue-700 rounded-lg p-6">
          <h2 className="text-xl font-bold text-blue-300 mb-3">📋 Instruções</h2>
          <ul className="text-blue-200 space-y-2">
            <li>✅ Se as fotos aparecerem: GoogleDriveImage funciona!</li>
            <li>❌ Se não aparecerem: problema no componente ou permissões</li>
            <li>🔍 Abra o console (F12) para ver os logs de debug</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
