import { DashboardLayout } from "@/components/dashboard/DashboardLayout";

function BioimpedanciaPage() {
  return (
    <DashboardLayout>
      <div className="animate-fadeIn">
        {/* Iframe Container */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-700/50">
          <div style={{ position: 'relative', width: '100%', height: '0', paddingBottom: '75%' }}>
            <iframe 
              src="https://inshape-premium.vercel.app/"
              style={{
                position: 'absolute',
                top: '0',
                left: '0',
                width: '100%',
                height: '100%',
                border: 'none',
                borderRadius: '12px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
              }}
              title="InShape Premium - Avaliação Corporal"
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default BioimpedanciaPage;
