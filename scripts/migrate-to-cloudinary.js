// Script de migração do Supabase Storage para Cloudinary
// Execute este script após configurar o Cloudinary para migrar arquivos existentes

import { supabase } from '../src/integrations/supabase/client.js';
import { cloudinaryService } from '../src/services/cloudinary.js';

async function migrateToCloudinary() {
  console.log('🚀 Iniciando migração para Cloudinary...');

  try {
    // Buscar todas as fotos que ainda não têm URL do Cloudinary
    const { data: photos, error } = await supabase
      .from('photos')
      .select('*')
      .is('cloudinary_url', null);

    if (error) {
      throw error;
    }

    if (!photos || photos.length === 0) {
      console.log('✅ Nenhuma foto para migrar. Todas já estão no Cloudinary!');
      return;
    }

    console.log(`📊 Encontradas ${photos.length} fotos para migrar`);

    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i];
      console.log(`📤 Migrando ${i + 1}/${photos.length}: ${photo.storage_path}`);

      try {
        // Baixar arquivo do Supabase
        const { data: fileData, error: downloadError } = await supabase.storage
          .from('wedding-photos')
          .download(photo.storage_path);

        if (downloadError) {
          console.error(`❌ Erro ao baixar ${photo.storage_path}:`, downloadError);
          continue;
        }

        // Converter para File
        const file = new File([fileData], photo.storage_path, {
          type: photo.media_type === 'video' ? 'video/webm' : 'image/jpeg'
        });

        // Upload para Cloudinary
        const uploadResult = await cloudinaryService.uploadFile(file, {
          folder: 'wedding-photos',
          tags: ['wedding', photo.media_type, 'migrated-from-supabase']
        });

        // Atualizar registro no Supabase
        const { error: updateError } = await supabase
          .from('photos')
          .update({
            cloudinary_url: uploadResult.secure_url,
            file_size: uploadResult.bytes,
            width: uploadResult.width,
            height: uploadResult.height,
            // Manter storage_path antigo como backup
            storage_path: uploadResult.public_id
          })
          .eq('id', photo.id);

        if (updateError) {
          console.error(`❌ Erro ao atualizar registro ${photo.id}:`, updateError);
          continue;
        }

        console.log(`✅ Migrado com sucesso: ${photo.storage_path} → ${uploadResult.public_id}`);

        // Pequena pausa para evitar rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (photoError) {
        console.error(`❌ Erro ao migrar ${photo.storage_path}:`, photoError);
      }
    }

    console.log('🎉 Migração concluída!');

  } catch (error) {
    console.error('💥 Erro na migração:', error);
  }
}

// Função para limpeza opcional dos arquivos antigos do Supabase
async function cleanupSupabaseStorage() {
  const confirm = prompt('⚠️  Tem certeza que deseja remover arquivos antigos do Supabase? (digite "yes" para confirmar)');
  
  if (confirm !== 'yes') {
    console.log('❌ Limpeza cancelada pelo usuário');
    return;
  }

  console.log('🧹 Iniciando limpeza do Supabase Storage...');

  try {
    // Buscar fotos que já foram migradas
    const { data: photos, error } = await supabase
      .from('photos')
      .select('storage_path')
      .not('cloudinary_url', 'is', null);

    if (error) throw error;

    if (!photos || photos.length === 0) {
      console.log('📂 Nenhum arquivo para limpar');
      return;
    }

    const paths = photos
      .map(p => p.storage_path)
      .filter(path => path && path.includes('.')); // Apenas arquivos antigos com extensão

    if (paths.length === 0) {
      console.log('📂 Nenhum arquivo antigo para limpar');
      return;
    }

    const { error: removeError } = await supabase.storage
      .from('wedding-photos')
      .remove(paths);

    if (removeError) {
      console.error('❌ Erro na limpeza:', removeError);
    } else {
      console.log(`✅ ${paths.length} arquivos removidos do Supabase Storage`);
    }

  } catch (error) {
    console.error('💥 Erro na limpeza:', error);
  }
}

// Executar migração
if (typeof window === 'undefined') {
  // Node.js environment
  migrateToCloudinary();
} else {
  // Browser environment
  console.log('Para executar a migração, execute este script em Node.js ou use as funções manualmente no console do navegador');
  window.migrateToCloudinary = migrateToCloudinary;
  window.cleanupSupabaseStorage = cleanupSupabaseStorage;
}