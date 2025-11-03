import React, { useState } from 'react';
import JSZip from 'jszip';
import type { OrganizedFolder, Photo } from '../types';

interface FolderViewModalProps {
  folder: OrganizedFolder;
  allPhotos: Photo[];
  onClose: () => void;
}

const FolderViewModal: React.FC<FolderViewModalProps> = ({ folder, allPhotos, onClose }) => {
  const [isZipping, setIsZipping] = useState(false);
  const photosInFolder = folder.photoIndices.map(index => allPhotos[index]);

  const handleDownload = async () => {
    if (isZipping) return;
    setIsZipping(true);

    try {
      const zip = new JSZip();
      
      const photoPromises = photosInFolder.map(photo =>
        fetch(photo.previewUrl)
          .then(res => {
            if (!res.ok) throw new Error(`Failed to fetch ${photo.file.name}`);
            return res.blob();
          })
          .then(blob => ({ name: photo.file.name, blob }))
      );

      const photoData = await Promise.all(photoPromises);

      photoData.forEach(data => {
        zip.file(data.name, data.blob);
      });

      const content = await zip.generateAsync({ type: 'blob' });

      const link = document.createElement('a');
      link.href = URL.createObjectURL(content);
      // Sanitize folder name for the filename
      const safeFolderName = folder.folderName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      link.download = `${safeFolderName}.zip`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);

    } catch (error) {
      console.error("Failed to create or download the zip file:", error);
      // You could add a user-facing error message here
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 transition-opacity duration-300"
      onClick={onClose}
    >
      <div 
        className="bg-gray-800 rounded-2xl shadow-2xl p-6 w-full max-w-4xl max-h-[90vh] flex flex-col transform transition-all duration-300 scale-95 animate-fade-in"
        onClick={(e) => e.stopPropagation()}
        style={{animation: 'fadeIn 0.3s ease-out forwards'}}
      >
        <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
          <div>
            <h2 className="text-2xl font-bold text-cyan-400">{folder.folderName}</h2>
            <p className="text-gray-400 mt-1">{folder.description}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              disabled={isZipping}
              className="px-4 py-2 bg-cyan-600 text-white font-semibold rounded-lg hover:bg-cyan-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-wait flex items-center gap-2"
            >
              {isZipping ? (
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              )}
              {isZipping ? 'Zipping...' : 'Download Folder'}
            </button>
            <button 
              onClick={onClose} 
              className="text-gray-400 hover:text-white transition-colors p-2 rounded-full bg-gray-700 hover:bg-gray-600"
              aria-label="Close"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        <div className="overflow-y-auto pr-2">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {photosInFolder.map((photo, index) => (
              <div key={index} className="aspect-square rounded-lg overflow-hidden group">
                <img 
                  src={photo.previewUrl} 
                  alt={`Photo ${index + 1} in folder ${folder.folderName}`} 
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" 
                />
              </div>
            ))}
          </div>
        </div>
      </div>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in {
          animation: fadeIn 0.2s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default FolderViewModal;