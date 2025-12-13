-- =====================================================
-- CONFIGURAÇÕES DE MARCA/LOGO PARA PDF
-- =====================================================

-- Adicionar configurações de branding ao system_config
INSERT INTO system_config (key, value, description) VALUES
  ('pdf_branding', 
   '{
     "logo_url": null,
     "primary_color": "#00C98A",
     "secondary_color": "#222222",
     "company_name": "Grow Nutri",
     "footer_text": "Sistema de Controle de Pacientes",
     "show_logo": true,
     "show_company_name": true
   }'::jsonb,
   'Configurações de marca para geração de PDFs')
ON CONFLICT (key) DO UPDATE 
SET value = EXCLUDED.value,
    description = EXCLUDED.description;





