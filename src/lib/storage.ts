import fs from 'fs';
import path from 'path';

const uploadsDirectory = path.join(process.cwd(), 'private/uploads');

export function getFileUrl(fileId: string) {
  return `/api/files/${fileId}`;
}

export async function getFileData(fileId: string) {
  const filePath = path.join(uploadsDirectory, fileId);
  try {
    const fileData = await fs.promises.readFile(filePath);
    const contentType = getContentType(fileId);
    return { data: fileData, contentType };
  } catch (error) {
    console.error('Error reading file:', error);
    return null;
  }
}

function getContentType(fileId: string) {
  const extname = path.extname(fileId).toLowerCase();
  switch (extname) {
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.png':
      return 'image/png';
    case '.gif':
      return 'image/gif';
    // Adicione mais casos para outros tipos de arquivo, se necessário
    default:
      return 'application/octet-stream';
  }
} 