/**
 * Meshy AI API Client
 * Converts 2D images to textured 3D models
 * API Documentation: https://docs.meshy.ai/api/image-to-3d
 */

const MESHY_API_URL = 'https://api.meshy.ai/openapi/v1';
const API_KEY = process.env.MESHY_API_KEY;

export interface MeshyModelUrls {
  glb?: string;
  fbx?: string;
  obj?: string;
  usdz?: string;
}

export interface MeshyTaskStatus {
  id: string;
  type: string;
  model_urls: MeshyModelUrls;
  thumbnail_url?: string;
  progress: number;
  status: 'PENDING' | 'IN_PROGRESS' | 'SUCCEEDED' | 'FAILED' | 'CANCELED';
  task_error: { message: string };
}

export async function createImageTo3DTask(
  imageBase64: string,
  mimeType: string = 'image/png'
): Promise<{ taskId: string } | { error: string }> {
  if (!API_KEY) {
    return { error: 'MESHY_API_KEY not configured' };
  }

  try {
    const imageUrl = `data:${mimeType};base64,${imageBase64}`;

    const response = await fetch(`${MESHY_API_URL}/image-to-3d`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image_url: imageUrl,
        model_type: 'standard',
        ai_model: 'meshy-6',
        should_texture: true,
        enable_pbr: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Meshy API error:', response.status, errorText);
      return { error: `Meshy API error: ${response.status}` };
    }

    const data = await response.json();
    return { taskId: data.result };
  } catch (error) {
    console.error('Failed to create Meshy task:', error);
    return { error: 'Failed to create 3D model task' };
  }
}

export async function getTaskStatus(taskId: string): Promise<MeshyTaskStatus | { error: string }> {
  if (!API_KEY) {
    return { error: 'MESHY_API_KEY not configured' };
  }

  try {
    const response = await fetch(`${MESHY_API_URL}/image-to-3d/${taskId}`, {
      headers: { Authorization: `Bearer ${API_KEY}` },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { error: `Meshy API error: ${response.status} - ${errorText}` };
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to get Meshy task status:', error);
    return { error: 'Failed to get task status' };
  }
}
