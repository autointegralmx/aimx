import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/shared/lib/database.types";
import { readPublicSupabaseEnv } from "@/shared/lib/supabase/env";
import { readCloudinaryEnv } from "@/shared/lib/cloudinary/env";
import { destroyCloudinaryAsset } from "@/shared/lib/cloudinary/destroy";
import { logCloudinaryServerError } from "@/shared/lib/cloudinary/server";
import {
  isExpectedCloudinaryVehiclePublicId,
} from "@/modules/inventory/domain/cloudinary-vehicle-paths";
import { resolveVehicleImageUrl } from "@/modules/inventory/domain/resolve-vehicle-image-url";
import {
  buildVehicleStorageObjectPath,
  isAllowedVehicleImageMime,
  isExpectedVehicleStorageObjectPath,
  validateVehicleImageFile,
  VEHICLE_IMAGE_BUCKET,
  type AllowedVehicleImageMime,
} from "@/modules/inventory/domain/vehicle-media-rules";
import { validateMediaAssetProviderFields } from "@/modules/inventory/domain/media-asset-provider";

export type MediaSupabase = SupabaseClient<Database>;

export type VehicleMediaItem = {
  media_asset_id: string;
  vehicle_id: string;
  position: number;
  is_cover: boolean;
  provider: "supabase" | "cloudinary";
  bucket: string | null;
  object_path: string | null;
  public_id: string | null;
  resource_type: string | null;
  version: number | null;
  format: string | null;
  original_filename: string;
  mime_type: string;
  byte_size: number;
  width: number | null;
  height: number | null;
  alt_text: string | null;
  url: string;
};

type MediaAssetJoin = {
  provider: string | null;
  bucket: string | null;
  object_path: string | null;
  public_id: string | null;
  resource_type: string | null;
  version: number | null;
  format: string | null;
  secure_url: string | null;
  original_filename: string;
  mime_type: string;
  byte_size: number;
  width: number | null;
  height: number | null;
  alt_text: string | null;
  deleted_at: string | null;
};

const MEDIA_SELECT =
  "media_asset_id, vehicle_id, position, is_cover, media_assets ( provider, bucket, object_path, public_id, resource_type, version, format, secure_url, original_filename, mime_type, byte_size, width, height, alt_text, deleted_at )";

export function createVehicleMediaRepository(
  client: MediaSupabase,
  options?: { supabaseUrl?: string; cloudName?: string },
) {
  const supabaseUrl =
    options?.supabaseUrl ?? readPublicSupabaseEnv().url ?? "";
  const cloudinaryEnv = readCloudinaryEnv();
  const cloudName =
    options?.cloudName ||
    (cloudinaryEnv.configured ? cloudinaryEnv.env.cloudName : "") ||
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
    "";

  function toItem(row: {
    media_asset_id: string;
    vehicle_id: string;
    position: number;
    is_cover: boolean;
    media_assets: MediaAssetJoin | null | Array<unknown>;
  }): VehicleMediaItem | null {
    const asset = row.media_assets;
    if (!asset || Array.isArray(asset) || asset.deleted_at) return null;

    const providerRaw = (asset.provider ?? "supabase").toLowerCase();
    const provider =
      providerRaw === "cloudinary" ? "cloudinary" : "supabase";

    const url = resolveVehicleImageUrl(
      {
        provider,
        public_id: asset.public_id,
        version: asset.version,
        format: asset.format,
        secure_url: asset.secure_url,
        bucket: asset.bucket,
        object_path: asset.object_path,
      },
      "card",
      { cloudName, supabaseUrl },
    );
    if (!url) return null;

    return {
      media_asset_id: row.media_asset_id,
      vehicle_id: row.vehicle_id,
      position: row.position,
      is_cover: row.is_cover,
      provider,
      bucket: asset.bucket,
      object_path: asset.object_path,
      public_id: asset.public_id,
      resource_type: asset.resource_type,
      version: asset.version,
      format: asset.format,
      original_filename: asset.original_filename,
      mime_type: asset.mime_type,
      byte_size: asset.byte_size,
      width: asset.width,
      height: asset.height,
      alt_text: asset.alt_text,
      url,
    };
  }

  return {
    async listVehicleMedia(vehicleId: string): Promise<VehicleMediaItem[]> {
      const { data, error } = await client
        .from("vehicle_media")
        .select(MEDIA_SELECT)
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

    async getMediaAssetForVehicle(input: {
      vehicleId: string;
      mediaAssetId: string;
    }): Promise<VehicleMediaItem | null> {
      const items = await this.listVehicleMedia(input.vehicleId);
      return (
        items.find((item) => item.media_asset_id === input.mediaAssetId) ??
        null
      );
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

      try {
        return await this.attachUploadedVehicleImage({
          vehicleId: input.vehicleId,
          actorId: input.actorId,
          assetId,
          objectPath,
          fileName: input.fileName,
          mimeType: mime,
          byteSize,
          makeCoverIfEmpty: input.makeCoverIfEmpty,
          currentCount,
          skipStorageCheck: true,
        });
      } catch (error) {
        await client.storage.from(VEHICLE_IMAGE_BUCKET).remove([objectPath]);
        throw error;
      }
    },

    /**
     * Registers DB rows after a browser-side Storage upload (legacy).
     */
    async attachUploadedVehicleImage(input: {
      vehicleId: string;
      actorId: string;
      assetId: string;
      objectPath: string;
      fileName: string;
      mimeType: string;
      byteSize: number;
      makeCoverIfEmpty?: boolean;
      currentCount?: number;
      skipStorageCheck?: boolean;
    }): Promise<VehicleMediaItem> {
      if (
        !isExpectedVehicleStorageObjectPath({
          vehicleId: input.vehicleId,
          assetId: input.assetId,
          objectPath: input.objectPath,
          mimeType: input.mimeType,
        })
      ) {
        throw new Error("Ruta de Storage inválida para este vehículo.");
      }

      const currentCount =
        input.currentCount ?? (await this.countVehicleMedia(input.vehicleId));
      const validation = validateVehicleImageFile({
        mimeType: input.mimeType,
        byteSize: input.byteSize,
        currentCount,
      });
      if (!validation.ok) {
        throw new Error(validation.error);
      }
      if (!isAllowedVehicleImageMime(input.mimeType)) {
        throw new Error("Formato no permitido.");
      }
      const mime = input.mimeType as AllowedVehicleImageMime;

      if (!input.skipStorageCheck) {
        const { data: listed, error: listError } = await client.storage
          .from(VEHICLE_IMAGE_BUCKET)
          .list(`vehicles/${input.vehicleId}`, {
            search: input.assetId,
            limit: 20,
          });
        if (listError) {
          throw new Error(
            `No se pudo verificar el archivo en Storage: ${listError.message}`,
          );
        }
        const leaf = input.objectPath.split("/").pop();
        const found = (listed ?? []).some((item) => item.name === leaf);
        if (!found) {
          throw new Error(
            "El archivo no está en Storage. Vuelve a subir la fotografía.",
          );
        }
      }

      const { data: asset, error: assetError } = await client
        .from("media_assets")
        .insert({
          id: input.assetId,
          provider: "supabase",
          bucket: VEHICLE_IMAGE_BUCKET,
          object_path: input.objectPath,
          original_filename: input.fileName.slice(0, 240),
          mime_type: mime,
          byte_size: input.byteSize,
          created_by: input.actorId,
        })
        .select("*")
        .single();

      if (assetError || !asset) {
        throw new Error(
          `No se pudo registrar el archivo: ${assetError?.message ?? "sin datos"}`,
        );
      }

      const makeCover =
        input.makeCoverIfEmpty !== false ? currentCount === 0 : false;

      const { error: linkError } = await client.from("vehicle_media").insert({
        vehicle_id: input.vehicleId,
        media_asset_id: input.assetId,
        position: currentCount,
        is_cover: makeCover,
      });

      if (linkError) {
        await client.from("media_assets").delete().eq("id", input.assetId);
        throw new Error(`No se pudo vincular la imagen: ${linkError.message}`);
      }

      const items = await this.listVehicleMedia(input.vehicleId);
      const created = items.find(
        (item) => item.media_asset_id === input.assetId,
      );
      if (!created) {
        throw new Error("La imagen se subió pero no se pudo leer.");
      }
      return created;
    },

    /**
     * Registers Cloudinary upload metadata after browser → Cloudinary success.
     * Uses RPC for atomic media_assets + vehicle_media; destroys Cloudinary on DB failure.
     */
    async attachCloudinaryVehicleImage(input: {
      vehicleId: string;
      actorId: string;
      assetId: string;
      publicId: string;
      secureUrl: string | null;
      resourceType: string;
      version: number | null;
      format: string | null;
      width: number | null;
      height: number | null;
      byteSize: number;
      fileName: string;
      mimeType: string;
      makeCoverIfEmpty?: boolean;
    }): Promise<VehicleMediaItem> {
      if (
        !isExpectedCloudinaryVehiclePublicId({
          vehicleId: input.vehicleId,
          assetId: input.assetId,
          publicId: input.publicId,
        })
      ) {
        throw new Error("public_id no pertenece a este vehículo.");
      }

      const currentCount = await this.countVehicleMedia(input.vehicleId);
      const validation = validateVehicleImageFile({
        mimeType: input.mimeType,
        byteSize: input.byteSize,
        currentCount,
      });
      if (!validation.ok) {
        throw new Error(validation.error);
      }

      const fieldCheck = validateMediaAssetProviderFields({
        provider: "cloudinary",
        public_id: input.publicId,
        resource_type: input.resourceType,
        version: input.version,
        secure_url: input.secureUrl,
        format: input.format,
        width: input.width,
        height: input.height,
        byte_size: input.byteSize,
      });
      if (!fieldCheck.ok) {
        throw new Error(fieldCheck.error);
      }

      if (
        input.width != null &&
        (input.width < 1 || input.width > 12000)
      ) {
        throw new Error("Ancho de imagen inválido.");
      }
      if (
        input.height != null &&
        (input.height < 1 || input.height > 12000)
      ) {
        throw new Error("Alto de imagen inválido.");
      }

      const makeCover =
        input.makeCoverIfEmpty !== false ? currentCount === 0 : false;

      const { data: rpcData, error: rpcError } = await client.rpc(
        "register_cloudinary_vehicle_media",
        {
          p_asset_id: input.assetId,
          p_vehicle_id: input.vehicleId,
          p_actor_id: input.actorId,
          p_public_id: input.publicId,
          p_secure_url: input.secureUrl ?? "",
          p_resource_type: input.resourceType || "image",
          p_version: input.version,
          p_format: input.format ?? "",
          p_width: input.width,
          p_height: input.height,
          p_byte_size: input.byteSize,
          p_original_filename: input.fileName.slice(0, 240),
          p_mime_type: input.mimeType,
          p_make_cover: makeCover,
        },
      );

      if (rpcError) {
        const destroy = await destroyCloudinaryAsset({
          publicId: input.publicId,
          resourceType: input.resourceType || "image",
        });
        if (!destroy.ok) {
          logCloudinaryServerError(
            "cloudinary.orphan_after_db_failure",
            new Error(destroy.error),
            { publicId: input.publicId, vehicleId: input.vehicleId },
          );
        }
        throw new Error(
          `No se pudo registrar en la base de datos: ${rpcError.message}`,
        );
      }

      void rpcData;

      const items = await this.listVehicleMedia(input.vehicleId);
      const created = items.find(
        (item) => item.media_asset_id === input.assetId,
      );
      if (!created) {
        const destroy = await destroyCloudinaryAsset({
          publicId: input.publicId,
          resourceType: input.resourceType || "image",
        });
        if (!destroy.ok) {
          logCloudinaryServerError(
            "cloudinary.orphan_after_read_failure",
            new Error(destroy.error),
            { publicId: input.publicId },
          );
        }
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

      // Cloudinary: destroy first; never drop DB refs if destroy fails.
      if (target.provider === "cloudinary") {
        if (!target.public_id) {
          throw new Error("El asset Cloudinary no tiene public_id.");
        }
        const destroyed = await destroyCloudinaryAsset({
          publicId: target.public_id,
          resourceType: target.resource_type || "image",
        });
        if (!destroyed.ok) {
          throw new Error(
            `No se pudo eliminar en Cloudinary: ${destroyed.error}. La referencia en la base de datos se conserva.`,
          );
        }
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

        if (
          target.provider === "supabase" &&
          target.bucket &&
          target.object_path
        ) {
          const { error: storageError } = await client.storage
            .from(target.bucket)
            .remove([target.object_path]);

          if (storageError) {
            throw new Error(
              `Imagen desvinculada, pero Storage falló: ${storageError.message}. Requiere limpieza pendiente.`,
            );
          }
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
