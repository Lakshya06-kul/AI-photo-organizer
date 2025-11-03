
import React, { useState, useEffect } from 'react';
import type { Photo, OrganizedFolder } from './types';
import { organizePhotos } from './services/geminiService';
import FileUpload from './components/FileUpload';
import Spinner from './components/Spinner';
import FolderViewModal from './components/FolderViewModal';

const App: React.FC = () => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [organizedFolders, setOrganizedFolders] = useState<OrganizedFolder[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<OrganizedFolder | null>(null);

  useEffect(() => {
    // Clean up object URLs to prevent memory leaks
    return () => {
      photos.forEach(photo => URL.revokeObjectURL(photo.previewUrl));
    };
  }, [photos]);

  const handleFilesSelected = (selectedPhotos: Photo[]) => {
    // Revoke old URLs before setting new photos
    photos.forEach(photo => URL.revokeObjectURL(photo.previewUrl));
    setPhotos(selectedPhotos);
    setOrganizedFolders(null);
    setError(null);
  };

  const handleOrganizeClick = async () => {
    if (photos.length === 0) {
      setError("Please upload some photos first.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setOrganizedFolders(null);

    try {
      const folders = await organizePhotos(photos);
      setOrganizedFolders(folders);
    } catch (err: any) {
      setError(err.message || "An unknown error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    photos.forEach(photo => URL.revokeObjectURL(photo.previewUrl));
    setPhotos([]);
    setOrganizedFolders(null);
    setError(null);
    setIsLoading(false);
  };

  const FolderIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-cyan-400" viewBox="0 0 20 20" fill="currentColor">
      <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
    </svg>
  );

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col items-center p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-4xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-teal-500">
            AI Photo Organizer
          </h1>
          <p className="mt-2 text-lg text-gray-400">
            Upload your memories and let AI sort them into beautiful collections.
          </p>
        </header>

        <main className="bg-gray-800/50 rounded-2xl shadow-xl p-6 backdrop-blur-sm border border-gray-700">
          {!organizedFolders && (
            <div className="flex flex-col items-center space-y-6">
              <FileUpload onFilesSelected={handleFilesSelected} disabled={isLoading} />
              
              {photos.length > 0 && (
                <div className="w-full text-center">
                  <p className="mb-4 text-gray-300">{photos.length} photo(s) selected. Ready to organize!</p>
                  <div className="flex justify-center items-center gap-4">
                     <button
                        onClick={handleOrganizeClick}
                        disabled={isLoading}
                        className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-teal-600 text-white font-bold rounded-lg shadow-lg hover:scale-105 transform transition-transform duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                     >
                        {isLoading ? 'Organizing...' : 'Organize Photos'}
                     </button>
                     <button
                        onClick={handleReset}
                        disabled={isLoading}
                        className="px-6 py-3 bg-gray-700 text-gray-300 font-semibold rounded-lg hover:bg-gray-600 transition-colors duration-200 disabled:opacity-50"
                      >
                        Reset
                      </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {isLoading && <Spinner />}

          {error && <div className="text-center text-red-400 bg-red-900/50 p-4 rounded-lg">{error}</div>}
          
          {organizedFolders && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-200">Your Organized Folders</h2>
                <button
                  onClick={handleReset}
                  className="px-6 py-2 bg-gray-700 text-gray-300 font-semibold rounded-lg hover:bg-gray-600 transition-colors duration-200"
                >
                  Start Over
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {organizedFolders.map((folder, index) => (
                  <button 
                    key={index}
                    onClick={() => setSelectedFolder(folder)}
                    className="group bg-gray-800 p-4 rounded-xl text-center flex flex-col items-center justify-center aspect-square transform transition-transform duration-300 hover:-translate-y-2 hover:shadow-cyan-500/20 shadow-lg border border-gray-700 hover:border-cyan-500"
                  >
                    <FolderIcon />
                    <h3 className="mt-2 font-semibold text-gray-200 truncate w-full">{folder.folderName}</h3>
                    <p className="text-xs text-gray-400">{folder.photoIndices.length} photos</p>
                  </button>
                ))}
              </div>
            </div>
          )}

        </main>
      </div>

      {selectedFolder && (
        <FolderViewModal 
          folder={selectedFolder}
          allPhotos={photos}
          onClose={() => setSelectedFolder(null)}
        />
      )}
    </div>
  );
};

export default App;
