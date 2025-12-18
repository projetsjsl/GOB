
export class GalleryService {
    private baseUrl = '/api/images';

    async listImages(): Promise<string[]> {
        try {
            const resp = await fetch(this.baseUrl);
            if (!resp.ok) throw new Error('Failed to list images');
            return await resp.json();
        } catch (e) {
            console.error(e);
            return [];
        }
    }

    async uploadImage(file: File): Promise<string | null> {
        try {
            const formData = new FormData();
            formData.append('image', file);

            const resp = await fetch(this.baseUrl, {
                method: 'POST',
                body: formData
            });

            if (!resp.ok) throw new Error('Upload failed');
            const data = await resp.json();
            return data.url;
        } catch (e) {
            console.error(e);
            return null;
        }
    }

    async deleteImage(url: string): Promise<boolean> {
        try {
            const resp = await fetch(`${this.baseUrl}?url=${encodeURIComponent(url)}`, {
                method: 'DELETE'
            });
            return resp.ok;
        } catch (e) {
            console.error(e);
            return false;
        }
    }
}
