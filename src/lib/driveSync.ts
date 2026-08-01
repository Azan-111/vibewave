import JSZip from 'jszip';

declare global {
  interface Window {
    google: any;
  }
}

export interface CodeFile {
  path: string;
  content: string;
}

export interface DriveExportResult {
  folderId: string;
  folderUrl: string;
  zipUrl?: string;
  fileCount: number;
}

// Strictly filter out any environment or sensitive key files
export function filterNecessaryFiles(files: CodeFile[]): CodeFile[] {
  return files.filter((f) => {
    const p = f.path.toLowerCase();
    const name = p.split('/').pop() || '';
    
    // Explicitly exclude .env files and sensitive keys
    if (name.startsWith('.env') || name.includes('.env.')) return false;
    if (name === '.git' || p.startsWith('.git/')) return false;
    if (name === 'node_modules' || p.startsWith('node_modules/')) return false;
    if (name === 'dist' || p.startsWith('dist/')) return false;
    if (name === 'bun.lock') return false;

    return true;
  });
}

// Fetch project files from the backend server
export async function fetchProjectFiles(): Promise<CodeFile[]> {
  const res = await fetch('/api/project-files');
  if (!res.ok) {
    throw new Error(`Server returned status ${res.status} when fetching files`);
  }
  const data = await res.json();
  const rawFiles: CodeFile[] = data.files || [];
  return filterNecessaryFiles(rawFiles);
}

// Generate ZIP blob of project code files
export async function generateCodebaseZip(files: CodeFile[]): Promise<Blob> {
  const zip = new JSZip();
  const filtered = filterNecessaryFiles(files);

  for (const file of filtered) {
    zip.file(file.path, file.content);
  }

  return await zip.generateAsync({ type: 'blob' });
}

// Request Google Drive OAuth Token via Google Identity Services (GIS)
export function requestGoogleDriveToken(): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!window.google || !window.google.accounts || !window.google.accounts.oauth2) {
      return reject(new Error('Google Identity Services SDK is not loaded. Please refresh the page and try again.'));
    }

    try {
      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: '', // GIS uses current origin auth or applet session scope
        scope: 'https://www.googleapis.com/auth/drive.file',
        callback: (response: any) => {
          if (response.error) {
            reject(new Error(response.error_description || response.error || 'Google authorization failed'));
          } else if (response.access_token) {
            resolve(response.access_token);
          } else {
            reject(new Error('No access token received from Google'));
          }
        },
        error_callback: (err: any) => {
          reject(new Error(err.message || 'OAuth authorization window encountered an error'));
        }
      });

      tokenClient.requestAccessToken({ prompt: 'consent' });
    } catch (err: any) {
      reject(err);
    }
  });
}

// Push code files & ZIP archive into Google Drive
export async function pushFilesToDrive(
  token: string,
  files: CodeFile[],
  onProgress?: (progressText: string, current: number, total: number) => void
): Promise<DriveExportResult> {
  const filtered = filterNecessaryFiles(files);

  onProgress?.('Creating Drive folder...', 0, filtered.length);

  // 1. Create Folder in Google Drive
  const folderTitle = `ViberAI Codebase (${new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })})`;

  const folderResp = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: folderTitle,
      mimeType: 'application/vnd.google-apps.folder',
      description: 'Exported Viber AI application codebase (env files excluded)',
    }),
  });

  if (!folderResp.ok) {
    const errText = await folderResp.text();
    throw new Error(`Failed to create folder in Google Drive: ${errText}`);
  }

  const folderData = await folderResp.json();
  const folderId = folderData.id;
  const folderUrl = `https://drive.google.com/drive/folders/${folderId}`;

  // Cache created subfolder IDs
  const folderCache: Record<string, string> = { '': folderId };

  async function getOrCreateSubFolder(dirPath: string): Promise<string> {
    if (!dirPath) return folderId;
    if (folderCache[dirPath]) return folderCache[dirPath];

    const parts = dirPath.split('/');
    let parentId = folderId;
    let currentPath = '';

    for (const part of parts) {
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      if (folderCache[currentPath]) {
        parentId = folderCache[currentPath];
        continue;
      }

      const res = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: part,
          mimeType: 'application/vnd.google-apps.folder',
          parents: [parentId],
        }),
      });

      if (!res.ok) {
        throw new Error(`Failed to create subfolder ${part} in Drive`);
      }

      const created = await res.json();
      folderCache[currentPath] = created.id;
      parentId = created.id;
    }

    return parentId;
  }

  // 2. Upload individual files
  let completedCount = 0;
  for (const file of filtered) {
    completedCount++;
    const pathParts = file.path.split('/');
    const fileName = pathParts.pop() || file.path;
    const dirPath = pathParts.join('/');

    onProgress?.(`Uploading ${file.path}...`, completedCount, filtered.length);

    const targetFolderId = await getOrCreateSubFolder(dirPath);

    const metadata = {
      name: fileName,
      parents: [targetFolderId],
    };

    const formData = new FormData();
    formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    formData.append('file', new Blob([file.content], { type: 'text/plain;charset=utf-8' }));

    const fileResp = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    if (!fileResp.ok) {
      console.warn(`Warning: file ${file.path} failed to upload: ${fileResp.statusText}`);
    }
  }

  // 3. Upload ready-to-use ZIP Archive of entire codebase
  onProgress?.('Generating & uploading viberai-codebase.zip archive...', filtered.length, filtered.length);
  let zipUrl: string | undefined;
  try {
    const zipBlob = await generateCodebaseZip(filtered);
    const zipMetadata = {
      name: 'viberai-codebase.zip',
      mimeType: 'application/zip',
      parents: [folderId],
    };
    const zipFormData = new FormData();
    zipFormData.append('metadata', new Blob([JSON.stringify(zipMetadata)], { type: 'application/json' }));
    zipFormData.append('file', zipBlob);

    const zipResp = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: zipFormData,
    });

    if (zipResp.ok) {
      const zipData = await zipResp.json();
      zipUrl = `https://drive.google.com/file/d/${zipData.id}/view`;
    }
  } catch (zipErr) {
    console.warn('Zip upload skipped or failed:', zipErr);
  }

  return {
    folderId,
    folderUrl,
    zipUrl,
    fileCount: filtered.length,
  };
}
