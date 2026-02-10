import React, { useCallback } from 'react';

interface ImageUploaderProps {
  onImageSelect: (file: File, imageUrl: string) => void;
  selectedImage: File | null;
  imageUrl: string | null;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  onImageSelect,
  imageUrl,
}) => {
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const files = Array.from(e.dataTransfer.files);
      const imageFile = files.find((file) =>
        file.type.startsWith('image/')
      );

      if (imageFile) {
        const url = URL.createObjectURL(imageFile);
        onImageSelect(imageFile, url);
      }
    },
    [onImageSelect]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file);
        onImageSelect(file, url);
      }
    },
    [onImageSelect]
  );

  return (
    <div className="w-full">
      {imageUrl ? (
        <div className="relative">
          <img
            src={imageUrl}
            alt="Selected boulder problem"
            className="max-w-full max-h-96 mx-auto rounded-lg shadow-lg"
          />
          <button
            onClick={() => onImageSelect(null as any, null as any)}
            className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600 transition-colors"
          >
            ×
          </button>
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-gray-400 transition-colors cursor-pointer bg-gray-50"
        >
          <div className="space-y-4">
            <div className="text-6xl text-gray-400">📸</div>
            <div>
              <p className="text-lg font-medium text-gray-700 mb-2">
                볼더링 문제 이미지를 업로드하세요
              </p>
              <p className="text-sm text-gray-500 mb-4">
                드래그 앤 드롭하거나 파일을 선택하세요
              </p>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileInput}
                className="hidden"
                id="file-input"
              />
              <label
                htmlFor="file-input"
                className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors cursor-pointer inline-block"
              >
                파일 선택
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};