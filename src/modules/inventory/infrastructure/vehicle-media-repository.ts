import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/shared/lib/database.types";
import { readPublicSupabaseEnv } from "@/shared/lib/supabase/env";
import {
  buildVehicleStorageObjectPath,
  isAllowedVehicleImageMime,
  publicStorageUrl,
  validateVehicleImageFile,
  VEHICLE_IMAGE_BUCKET,
  type AllowedVehicleImageMime,
} from "@/modules/inventory/domain/vehicle-media-rules";

export type MediaSupabase = SupabaseClient<Database>;

export type VehicleMediaItem = {
  media_asset_id: string;
  vehicle_id: string;
  position: number;
  is_cover: boolean;
  bucket: string;
  object_path: string;
  original_filename: string;
  mime_type: string;
  byte_size: number;
  width: number | null;
  height: number | null;
  alt_text: string | null;
  url: string;
};

export function createVehicleMediaRepository(
  client: MediaSupabase,
  options?: { supabaseUrl?: string },
) {
  const supabaseUrl =
    options?.supabaseUrl ?? readPublicSupabaseEnv().url ?? "";

  function toItem(row: {
    media_asset_id: string;
    vehicle_id: string;
    position: number;
    is_cover: boolean;
    media_assets:
      | {
          bucket: string;
          object_path: string;
          original_filename: string;
          mime_type: string;
          byte_size: number;
          width: number | null;
          height: number | null;
          alt_text: string | null;
          deleted_at: string | null;
        }
      | null
      | Array<unknown>;
  }): VehicleMediaItem | null {
    const asset = row.media_assets;
    if (!asset || Array.isArray(asset) || asset.deleted_at) return null;
    return {
      media_asset_id: row.media_asset_id,
      vehicle_id: row.vehicle_id,
      position: row.position,
      is_cover: row.is_cover,
      bucket: asset.bucket,
      object_path: asset.object_path,
      original_filename: asset.original_filename,
      mime_type: asset.mime_type,
      byte_size: asset.byte_size,
      width: asset.width,
      height: asset.height,
      alt_text: asset.alt_text,
      url: publicStorageUrl(supabaseUrl, asset.bucket, asset.object_path),
    };
  }

  return {
    async listVehicleMedia(vehicleId: string): Promise<VehicleMediaItem[]> {
      const { data, error } = await client
        .from("vehicle_media")
        .select(
          "media_asset_id, vehicle_id, position, is_cover, media_assets ( bucket, object_path, original_filename, mime_type, byte_size, width, height, alt_text, deleted_at )",
        )
        .eq("vehicle_id", vehicleId)
        .order("position", { ascending: true });

      if (error) {
        throw new Error(`No se pudieron cargar las imágenes: ${error.message}`);
      }

      return (data ?? [])
        .map((row) => toItem(row))
        .filter((item): item is VehicleMediaItem => Boolean(item));
    },

    async countVehicleMedia(vehicleId: string): Promise<number> {
      const { count, error } = await client
        .from("vehicle_media")
        .select("media_asset_id", { count: "exact", head: true })
        .eq("vehicle_id", vehicleId);

      if (error) {
        throw new Error(`No se pudo contar imágenes: ${error.message}`);
      }
      return count ?? 0;
    },

    async uploadVehicleImage(input: {
      vehicleId: string;
      actorId: string;
      fileName: string;
      mimeType: string;
      bytes: ArrayBuffer;
      makeCoverIfEmpty?: boolean;
    }): Promise<VehicleMediaItem> {
      const byteSize = input.bytes.byteLength;
      const currentCount = await this.countVehicleMedia(input.vehicleId);
      const validation = validateVehicleImageFile({
        mimeType: input.mimeType,
        byteSize,
        currentCount,
      });
      if (!validation.ok) {
        throw new Error(validation.error);
      }
      if (!isAllowedVehicleImageMime(input.mimeType)) {
        throw new Error("Formato no permitido.");
      }
      const mime = input.mimeType as AllowedVehicleImageMime;

      const assetId = crypto.randomUUID();
      const objectPath = buildVehicleStorageObjectPath(
        input.vehicleId,
        assetId,
        mime,
      );

      const { error: uploadError } = await client.storage
        .from(VEHICLE_IMAGE_BUCKET)
        .upload(objectPath, input.bytes, {
          contentType: mime,
          upsert: false,
        });

      if (uploadError) {
        throw new Error(`No se pudo subir la imagen: ${uploadError.message}`);
      }

      const { data: asset, error: assetError } = await client
        .from("media_assets")
        .insert({
          id: assetId,
          bucket: VEHICLE_IMAGE_BUCKET,
          object_path: objectPath,
          original_filename: input.fileName.slice(0, 240),
          mime_type: mime,
          byte_size: byteSize,
          created_by: input.actorId,
        })
        .select("*")
        .single();

      if (assetError || !asset) {
        await client.storage.from(VEHICLE_IMAGE_BUCKET).remove([objectPath]);
        throw new Error(
          `No se pudo registrar el archivo: ${assetError?.message ?? "sin datos"}`,
        );
      }

      const makeCover =
        input.makeCoverIfEmpty !== false ? currentCount === 0 : false;

      const { error: linkError } = await client.from("vehicle_media").insert({
        vehicle_id: input.vehicleId,
        media_asset_id: assetId,
        position: currentCount,
        is_cover: makeCover,
      });

      if (linkError) {
        await client.from("media_assets").delete().eq("id", assetId);
        await client.storage.from(VEHICLE_IMAGE_BUCKET).remove([objectPath]);
        throw new Error(`No se pudo vincular la imagen: ${linkError.message}`);
      }

      const items = await this.listVehicleMedia(input.vehicleId);
      const created = items.find((item) => item.media_asset_id === assetId);
      if (!created) {
        throw new Error("La imagen se subió pero no se pudo leer.");
      }
      return created;
    },

    async setCover(input: {
      vehicleId: string;
      mediaAssetId: string;
    }): Promise<void> {
      const { error: clearError } = await client
        .from("vehicle_media")
        .update({ is_cover: false })
        .eq("vehicle_id", input.vehicleId)
        .eq("is_cover", true);

      if (clearError) {
        throw new Error(`No se pudo actualizar la portada: ${clearError.message}`);
      }

      const { data, error } = await client
        .from("vehicle_media")
        .update({ is_cover: true })
        .eq("vehicle_id", input.vehicleId)
        .eq("media_asset_id", input.mediaAssetId)
        .select("media_asset_id")
        .maybeSingle();

      if (error || !data) {
        throw new Error(
          `No se pudo marcar la portada: ${error?.message ?? "imagen no encontrada"}`,
        );
      }
    },

    async reorderMedia(input: {
      vehicleId: string;
      orderedMediaAssetIds: string[];
    }): Promise<void> {
      for (let index = 0; index < input.orderedMediaAssetIds.length; index += 1) {
        const mediaAssetId = input.orderedMediaAssetIds[index];
        if (!mediaAssetId) continue;
        const { error } = await client
          .from("vehicle_media")
          .update({ position: index })
          .eq("vehicle_id", input.vehicleId)
          .eq("media_asset_id", mediaAssetId);
        if (error) {
          throw new Error(`No se pudo guardar el orden: ${error.message}`);
        }
      }
    },

    async updateAltText(input: {
      mediaAssetId: string;
      altText: string | null;
    }): Promise<void> {
      const { error } = await client
        .from("media_assets")
        .update({ alt_text: input.altText })
        .eq("id", input.mediaAssetId);
      if (error) {
        throw new Error(`No se pudo actualizar el alt text: ${error.message}`);
      }
    },

    async deleteVehicleImage(input: {
      vehicleId: string;
      mediaAssetId: string;
      isPublished: boolean;
    }): Promise<{ promotedCoverId: string | null }> {
      const items = await this.listVehicleMedia(input.vehicleId);
      const target = items.find(
        (item) => item.media_asset_id === input.mediaAssetId,
      );
      if (!target) {
        throw new Error("La imagen no existe en este vehículo.");
      }

      if (input.isPublished && items.length <= 1) {
        throw new Error(
          "No puedes eliminar la última imagen de un vehículo publicado. Despublícalo primero.",
        );
      }

      const { error: unlinkError } = await client
        .from("vehicle_media")
        .delete()
        .eq("vehicle_id", input.vehicleId)
        .eq("media_asset_id", input.mediaAssetId);

      if (unlinkError) {
        throw new Error(`No se pudo eliminar la relación: ${unlinkError.message}`);
      }

      const { count: refs } = await client
        .from("vehicle_media")
        .select("media_asset_id", { count: "exact", head: true })
        .eq("media_asset_id", input.mediaAssetId);

      if ((refs ?? 0) === 0) {
        await client
          .from("media_assets")
          .update({ deleted_at: new Date().toISOString() })
          .eq("id", input.mediaAssetId);

        const { error: storageError } = await client.storage
          .from(target.bucket)
          .remove([target.object_path]);

        if (storageError) {
          throw new Error(
            `Imagen desvinculada, pero Storage falló: ${storageError.message}. Requiere limpieza pendiente.`,
          );
        }
      }

      let promotedCoverId: string | null = null;
      const remaining = await this.listVehicleMedia(input.vehicleId);
      if (remaining.length > 0 && !remaining.some((item) => item.is_cover)) {
        const first = remaining[0];
        if (first) {
          await this.setCover({
            vehicleId: input.vehicleId,
            mediaAssetId: first.media_asset_id,
          });
          promotedCoverId = first.media_asset_id;
        }
      }

      // Normalize positions
      await this.reorderMedia({
        vehicleId: input.vehicleId,
        orderedMediaAssetIds: remaining.map((item) => item.media_asset_id),
      });

      return { promotedCoverId };
    },
  };
}

export type VehicleMediaRepository = ReturnType<
  typeof createVehicleMediaRepository
>;
