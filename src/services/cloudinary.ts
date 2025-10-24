// Cloudinary configuration and upload service
export interface CloudinaryConfig {
  cloudName: string;
  uploadPreset: string;
  apiKey?: string;
}

export interface UploadResult {
  public_id: string;
  secure_url: string;
  format: string;
  resource_type: 'image' | 'video';
  bytes: number;
  duration?: number;
  width?: number;
  height?: number;
  created_at: string;
}

class CloudinaryService {
  private config: CloudinaryConfig;

  constructor() {
    this.config = {
      cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || '',
      uploadPreset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || '',
      apiKey: import.meta.env.VITE_CLOUDINARY_API_KEY,
    };

    if (!this.config.cloudName || !this.config.uploadPreset) {
      console.warn('Cloudinary não está configurado corretamente. Verifique as variáveis de ambiente.');
    }
  }

  async uploadFile(file: File, options?: {
    folder?: string;
    tags?: string[];
    transformation?: string;
  }): Promise<UploadResult> {
    if (!this.config.cloudName || !this.config.uploadPreset) {
      throw new Error('Cloudinary não está configurado. Configure as variáveis VITE_CLOUDINARY_CLOUD_NAME e VITE_CLOUDINARY_UPLOAD_PRESET');
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', this.config.uploadPreset);
    
    if (options?.folder) {
      formData.append('folder', options.folder);
    }
    
    if (options?.tags) {
      formData.append('tags', options.tags.join(','));
    }

    // Adicionar timestamp para evitar cache
    formData.append('timestamp', Date.now().toString());

    const resourceType = file.type.startsWith('video/') ? 'video' : 'image';
    const url = `https://api.cloudinary.com/v1_1/${this.config.cloudName}/${resourceType}/upload`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upload falhou: ${response.status} - ${errorText}`);
      }

      const result: UploadResult = await response.json();
      return result;
    } catch (error) {
      console.error('Erro no upload para Cloudinary:', error);
      throw error;
    }
  }

  generateUrl(publicId: string, options?: {
    width?: number;
    height?: number;
    crop?: string;
    quality?: string | number;
    format?: string;
  }): string {
    if (!this.config.cloudName) return '';

    const baseUrl = `https://res.cloudinary.com/${this.config.cloudName}/image/upload`;
    const transformations: string[] = [];

    if (options?.width || options?.height) {
      const w = options.width ? `w_${options.width}` : '';
      const h = options.height ? `h_${options.height}` : '';
      const crop = options.crop ? `c_${options.crop}` : 'c_fill';
      transformations.push([w, h, crop].filter(Boolean).join(','));
    }

    if (options?.quality) {
      transformations.push(`q_${options.quality}`);
    }

    if (options?.format) {
      transformations.push(`f_${options.format}`);
    }

    const transformationString = transformations.length > 0 
      ? transformations.join('/') + '/'
      : '';

    return `${baseUrl}/${transformationString}${publicId}`;
  }

  generateVideoUrl(publicId: string, options?: {
    width?: number;
    height?: number;
    quality?: string | number;
    format?: string;
  }): string {
    if (!this.config.cloudName) return '';

    const baseUrl = `https://res.cloudinary.com/${this.config.cloudName}/video/upload`;
    const transformations: string[] = [];

    if (options?.width || options?.height) {
      const w = options.width ? `w_${options.width}` : '';
      const h = options.height ? `h_${options.height}` : '';
      transformations.push([w, h, 'c_fill'].filter(Boolean).join(','));
    }

    if (options?.quality) {
      transformations.push(`q_${options.quality}`);
    }

    if (options?.format) {
      transformations.push(`f_${options.format}`);
    }

    const transformationString = transformations.length > 0 
      ? transformations.join('/') + '/'
      : '';

    return `${baseUrl}/${transformationString}${publicId}`;
  }

  isConfigured(): boolean {
    return !!(this.config.cloudName && this.config.uploadPreset);
  }
}

export const cloudinaryService = new CloudinaryService();