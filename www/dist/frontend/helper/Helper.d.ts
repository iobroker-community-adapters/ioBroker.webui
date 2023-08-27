export declare function sleep(ms: any): Promise<unknown>;
export declare function openFileDialog(extension: string, multiple?: boolean, readMode?: 'file' | 'text'): Promise<{
    name: string;
    data: (string | File);
}[]>;
export declare function readFiles(files: FileList | File[]): Promise<{
    name: string;
    data: string;
    size: number;
}[]>;
export declare function exportData(data: string | ArrayBuffer, fileName: string, mimeType?: string): Promise<string>;
