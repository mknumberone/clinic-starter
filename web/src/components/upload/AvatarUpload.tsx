import { useState, useEffect } from 'react';
import { Upload, message, Avatar, Spin } from 'antd';
import { LoadingOutlined, CameraOutlined, UserOutlined } from '@ant-design/icons';
import type { UploadChangeParam } from 'antd/es/upload';
import type { RcFile, UploadFile } from 'antd/es/upload/interface';
import { uploadService } from '@/services/upload.service';

interface AvatarUploadProps {
  currentAvatar?: string;
  onUploadSuccess?: (url: string) => void;
  size?: number;
  disabled?: boolean;
}

const beforeUpload = (file: RcFile) => {
  const isImage = file.type.startsWith('image/');
  if (!isImage) {
    message.error('Bạn chỉ có thể upload file ảnh!');
    return false;
  }

  const isLt5M = file.size / 1024 / 1024 < 5;
  if (!isLt5M) {
    message.error('Ảnh phải nhỏ hơn 5MB!');
    return false;
  }

  return true;
};

export default function AvatarUpload({
  currentAvatar,
  onUploadSuccess,
  size = 100,
  disabled = false,
}: AvatarUploadProps) {
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | undefined>(
    currentAvatar ? uploadService.getFileUrl(currentAvatar) : undefined
  );

  // Update imageUrl when currentAvatar prop changes
  useEffect(() => {
    if (currentAvatar) {
      setImageUrl(uploadService.getFileUrl(currentAvatar));
    } else {
      setImageUrl(undefined);
    }
  }, [currentAvatar]);

  const handleChange = async (info: UploadChangeParam<UploadFile>) => {
    if (info.file.status === 'uploading') {
      setLoading(true);
      return;
    }

    if (info.file.status === 'done') {
      setLoading(false);
    }
  };

  const customUpload = async ({ file, onSuccess, onError }: any) => {
    try {
      setLoading(true);

      // Upload với options tối ưu
      const result = await uploadService.uploadImage(file as File, {
        width: 400,
        height: 400,
        quality: 85,
      });

      const fullUrl = uploadService.getFileUrl(result.url);
      setImageUrl(fullUrl);

      if (onUploadSuccess) {
        onUploadSuccess(result.url); // Return relative URL to save in DB
      }

      message.success('Tải ảnh lên thành công!');
      onSuccess?.(result);
    } catch (error) {
      console.error('Upload error:', error);
      message.error('Tải ảnh lên thất bại!');
      onError?.(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <Upload
        name="avatar"
        listType="picture-circle"
        className="avatar-uploader"
        showUploadList={false}
        beforeUpload={beforeUpload}
        onChange={handleChange}
        customRequest={customUpload}
        disabled={disabled || loading}
      >
        <div
          style={{
            width: size,
            height: size,
            borderRadius: '50%',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: disabled ? 'not-allowed' : 'pointer',
            position: 'relative',
          }}
        >
          {loading ? (
            <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
          ) : imageUrl ? (
            <div className="relative group">
              <Avatar
                src={imageUrl}
                size={size}
                icon={<UserOutlined />}
                className="transition-opacity"
              />
              <div
                className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 
                           flex items-center justify-center transition-all duration-200 rounded-full"
              >
                <CameraOutlined
                  className="text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ fontSize: 24 }}
                />
              </div>
            </div>
          ) : (
            <div
              className="flex flex-col items-center justify-center bg-gray-100 rounded-full"
              style={{ width: size, height: size }}
            >
              <CameraOutlined style={{ fontSize: 32, color: '#999' }} />
              <div style={{ marginTop: 8, color: '#999', fontSize: 12 }}>
                Upload
              </div>
            </div>
          )}
        </div>
      </Upload>

      <style>{`
        .avatar-uploader .ant-upload.ant-upload-select {
          width: ${size}px !important;
          height: ${size}px !important;
          margin: 0 !important;
        }
        
        .avatar-uploader .ant-upload-list-item-container {
          width: ${size}px !important;
          height: ${size}px !important;
        }
      `}</style>
    </div>
  );
}
