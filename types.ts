
export interface Photo {
  file: File;
  previewUrl: string;
}

export interface OrganizedFolder {
  folderName: string;
  description: string;
  photoIndices: number[];
}
