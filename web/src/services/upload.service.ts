import axiosInstance from '@/lib/axios';

export interface UploadImageOptions {
  width?: number;
  height?: number;
  quality?: number;
}

export interface UploadedFile {
  filename: string;
  path: string;
  url: string;
  size: number;
}

export interface UploadImageResponse {
  success: boolean;
  data: UploadedFile;
}

export interface UploadMultipleImagesResponse {
  success: boolean;
  data: UploadedFile[];
  count: number;
}

export interface UploadWithThumbnailResponse {
  success: boolean;
  data: {
    original: UploadedFile;
    thumbnail: UploadedFile;
  };
}

class UploadService {
  private readonly baseUrl = '/upload';

  /**
   * Upload single image
   */
  async uploadImage(
    file: File,
    options?: UploadImageOptions
  ): Promise<UploadedFile> {
    const formData = new FormData();
    formData.append('file', file);

    if (options?.width) {
      formData.append('width', options.width.toString());
    }
    if (options?.height) {
      formData.append('height', options.height.toString());
    }
    if (options?.quality) {
      formData.append('quality', options.quality.toString());
    }

    const response = await axiosInstance.post<UploadImageResponse>(
      `${this.baseUrl}/image`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data.data;
  }

  /**
   * Upload multiple images
   */
  async uploadMultipleImages(
    files: File[],
    options?: UploadImageOptions
  ): Promise<UploadedFile[]> {
    const formData = new FormData();

    files.forEach((file) => {
      formData.append('files', file);
    });

    if (options?.width) {
      formData.append('width', options.width.toString());
    }
    if (options?.height) {
      formData.append('height', options.height.toString());
    }
    if (options?.quality) {
      formData.append('quality', options.quality.toString());
    }

    const response = await axiosInstance.post<UploadMultipleImagesResponse>(
      `${this.baseUrl}/images/multiple`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data.data;
  }

  /**
   * Upload document
   */
  async uploadDocument(file: File): Promise<UploadedFile> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await axiosInstance.post<UploadImageResponse>(
      `${this.baseUrl}/document`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data.data;
  }

  /**
   * Upload image with thumbnail
   */
  async uploadWithThumbnail(
    file: File,
    thumbnailWidth?: number,
    thumbnailHeight?: number
  ): Promise<{ original: UploadedFile; thumbnail: UploadedFile }> {
    const formData = new FormData();
    formData.append('file', file);

    if (thumbnailWidth) {
      formData.append('thumbnailWidth', thumbnailWidth.toString());
    }
    if (thumbnailHeight) {
      formData.append('thumbnailHeight', thumbnailHeight.toString());
    }

    const response = await axiosInstance.post<UploadWithThumbnailResponse>(
      `${this.baseUrl}/thumbnail`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data.data;
  }

  /**
   * Delete uploaded file
   */
  async deleteFile(filepath: string): Promise<void> {
    await axiosInstance.delete(`${this.baseUrl}/file`, {
      data: { filepath },
    });
  }

  /**
   * Get file URL
   */
  getFileUrl(filepath: string): string {
    if (filepath.startsWith('http')) {
      return filepath;
    }
    // Remove leading slash if present
    const cleanPath = filepath.startsWith('/') ? filepath.slice(1) : filepath;
    // Use the backend base URL without /api prefix for static files
    return `http://localhost:3000/${cleanPath}`;
  }
}

export const uploadService = new UploadService();
