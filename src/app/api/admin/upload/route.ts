import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/session';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const admin = await requireAdmin();

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const uploadType = (formData.get('type') as string) || 'image'; // 'image' or 'model3d'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const originalName = file.name;
    const ext = path.extname(originalName).toLowerCase();
    const mimeType = file.type;

    // Validation
    if (uploadType === 'image') {
      const allowedImageMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];
      const allowedImageExts = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif'];

      if (!allowedImageMimes.includes(mimeType) && !allowedImageExts.includes(ext)) {
        return NextResponse.json(
          { error: 'Invalid image format. Allowed formats: JPEG, PNG, WebP, GIF, AVIF' },
          { status: 400 }
        );
      }

      if (buffer.length > 10 * 1024 * 1024) {
        // 10MB limit
        return NextResponse.json({ error: 'Image exceeds 10MB limit' }, { status: 400 });
      }
    } else if (uploadType === 'model3d') {
      const allowed3dExts = ['.glb', '.gltf', '.usdz', '.obj'];
      if (!allowed3dExts.includes(ext)) {
        return NextResponse.json(
          { error: 'Invalid 3D model format. Allowed formats: GLB, GLTF, USDZ, OBJ' },
          { status: 400 }
        );
      }

      if (buffer.length > 50 * 1024 * 1024) {
        // 50MB limit
        return NextResponse.json({ error: '3D model exceeds 50MB limit' }, { status: 400 });
      }
    }

    const randomHash = crypto.randomBytes(12).toString('hex');
    const safeFilename = `${Date.now()}-${randomHash}${ext}`;

    // If Supabase Storage is configured in environment, upload to Supabase bucket
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey && !supabaseUrl.includes('your-supabase-ref')) {
      const bucket = uploadType === 'model3d' ? 'vorquen-3d-models' : 'vorquen-products';
      const storageUrl = `${supabaseUrl}/storage/v1/object/${bucket}/${safeFilename}`;

      const res = await fetch(storageUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${supabaseKey}`,
          'Content-Type': mimeType || 'application/octet-stream',
        },
        body: buffer,
      });

      if (res.ok) {
        const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}/${safeFilename}`;
        return NextResponse.json({
          success: true,
          url: publicUrl,
          filename: safeFilename,
          storage: 'supabase',
        });
      }
      console.warn('[STORAGE] Supabase upload returned error, falling back to local storage adapter');
    }

    // Default Local Storage Adapter (stores in public/uploads)
    const uploadsDir = path.resolve(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const filePath = path.join(uploadsDir, safeFilename);
    fs.writeFileSync(filePath, buffer);

    const publicUrl = `/uploads/${safeFilename}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      filename: safeFilename,
      size: buffer.length,
      storage: 'local',
    });
  } catch (err: any) {
    const isAuth = err.message?.includes('UNAUTHORIZED');
    return NextResponse.json({ error: err.message || 'File upload failed' }, { status: isAuth ? 401 : 500 });
  }
}
