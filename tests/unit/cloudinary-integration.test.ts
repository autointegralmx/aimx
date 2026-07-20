import { describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import {
  buildCloudinaryUploadPublicIdLeaf,
  buildCloudinaryVehicleFolder,
  buildCloudinaryVehiclePublicId,
  isExpectedCloudinaryVehiclePublicId,
  parseCloudinaryVehiclePublicId,
} from "@/modules/inventory/domain/cloudinary-vehicle-paths";
import {
  resolveVehicleImageUrl,
  VEHICLE_IMAGE_TRANSFORM,
  encodeCloudinaryPublicId,
} from "@/modules/inventory/domain/resolve-vehicle-image-url";
import { createCloudinarySignature } from "@/shared/lib/cloudinary/signature";
import {
  sniffImageMimeFromBytes,
  isRejectedImageMime,
} from "@/modules/inventory/domain/image-mime-sniff";
import {
  validateVehicleImageFile,
  MAX_VEHICLE_IMAGES,
} from "@/modules/inventory/domain/vehicle-media-rules";
import { assertStaffCanManageVehicles } from "@/modules/inventory/application/vehicle-use-cases";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const vehicleId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1";
const assetId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1";

describe("cloudinary vehicle paths", () => {
  it("builds folder and full public_id from UUIDs", () => {
    expect(buildCloudinaryVehicleFolder(vehicleId)).toBe(
      `CarrosAutointegral/vehicles/${vehicleId}`,
    );
    expect(buildCloudinaryUploadPublicIdLeaf(assetId)).toBe(assetId);
    expect(buildCloudinaryVehiclePublicId(vehicleId, assetId)).toBe(
      `CarrosAutointegral/vehicles/${vehicleId}/${assetId}`,
    );
  });

  it("rejects invalid uuids", () => {
    expect(() => buildCloudinaryVehicleFolder("not-uuid")).toThrow();
    expect(() => buildCloudinaryUploadPublicIdLeaf("x")).toThrow();
  });

  it("validates expected public_id for vehicle", () => {
    expect(
      isExpectedCloudinaryVehiclePublicId({
        vehicleId,
        assetId,
        publicId: buildCloudinaryVehiclePublicId(vehicleId, assetId),
      }),
    ).toBe(true);
    expect(
      isExpectedCloudinaryVehiclePublicId({
        vehicleId,
        assetId,
        publicId: "CarrosAutointegral/other/id",
      }),
    ).toBe(false);
  });

  it("parses folder public_id", () => {
    const parsed = parseCloudinaryVehiclePublicId(
      buildCloudinaryVehiclePublicId(vehicleId, assetId),
    );
    expect(parsed).toEqual({ vehicleId, assetId });
  });
});

describe("resolveVehicleImageUrl", () => {
  const cloudName = "cniopmlz";
  const publicId = `CarrosAutointegral/vehicles/${vehicleId}/${assetId}`;

  it("builds all cloudinary variants from public_id", () => {
    for (const variant of Object.keys(VEHICLE_IMAGE_TRANSFORM) as Array<
      keyof typeof VEHICLE_IMAGE_TRANSFORM
    >) {
      const url = resolveVehicleImageUrl(
        { provider: "cloudinary", public_id: publicId, version: 7, format: "jpg" },
        variant,
        { cloudName },
      );
      expect(url).toContain(`res.cloudinary.com/${cloudName}/image/upload/`);
      expect(url).toContain(VEHICLE_IMAGE_TRANSFORM[variant]);
      expect(url).toContain("v7/");
      expect(url).toContain(encodeCloudinaryPublicId(publicId));
      expect(url).not.toContain("https://res.cloudinary.com/demo");
    }
  });

  it("works without version and without format", () => {
    const url = resolveVehicleImageUrl(
      { provider: "cloudinary", public_id: publicId },
      "thumb",
      { cloudName },
    );
    expect(url).toContain(VEHICLE_IMAGE_TRANSFORM.thumb);
    expect(url).not.toMatch(/\/v\d+\//);
  });

  it("does not use secure_url as primary source", () => {
    const url = resolveVehicleImageUrl(
      {
        provider: "cloudinary",
        public_id: publicId,
        secure_url: "https://evil.example/not-used.jpg",
      },
      "card",
      { cloudName },
    );
    expect(url).toContain(encodeCloudinaryPublicId(publicId));
    expect(url).not.toContain("evil.example");
  });

  it("rejects arbitrary http public_id", () => {
    expect(
      resolveVehicleImageUrl(
        {
          provider: "cloudinary",
          public_id: "https://res.cloudinary.com/x/image/upload/y",
        },
        "card",
        { cloudName },
      ),
    ).toBeNull();
  });

  it("keeps supabase legacy urls", () => {
    const url = resolveVehicleImageUrl(
      {
        provider: "supabase",
        bucket: "vehicle-images",
        object_path: `vehicles/${vehicleId}/${assetId}.jpg`,
      },
      "card",
      { supabaseUrl: "https://example.supabase.co" },
    );
    expect(url).toBe(
      `https://example.supabase.co/storage/v1/object/public/vehicle-images/vehicles/${vehicleId}/${assetId}.jpg`,
    );
  });
});

describe("createCloudinarySignature", () => {
  it("signs allowed params without exposing secret in output", () => {
    const folder = buildCloudinaryVehicleFolder(vehicleId);
    const publicId = buildCloudinaryUploadPublicIdLeaf(assetId);
    const timestamp = 1_700_000_000;
    const apiSecret = "test-secret-value";
    const signature = createCloudinarySignature(
      { timestamp, folder, public_id: publicId },
      apiSecret,
    );

    const expected = createHash("sha1")
      .update(
        `folder=${folder}&public_id=${publicId}&timestamp=${timestamp}${apiSecret}`,
      )
      .digest("hex");

    expect(signature).toBe(expected);
    expect(signature).not.toContain(apiSecret);
  });
});

describe("staff gates for media signing semantics", () => {
  it("rejects without session", () => {
    expect(() =>
      assertStaffCanManageVehicles({
        supabaseConfigured: true,
        hasSession: false,
        profile: null,
      }),
    ).toThrow(/iniciar sesión/i);
  });

  it("rejects unauthorized inactive staff", () => {
    expect(() =>
      assertStaffCanManageVehicles({
        supabaseConfigured: true,
        hasSession: true,
        profile: { id: "x", role: "editor", is_active: false },
      }),
    ).toThrow(/inactivo/i);
  });
});

describe("mime sniff and validations", () => {
  it("detects jpeg magic bytes", () => {
    const bytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0]);
    expect(sniffImageMimeFromBytes(bytes)).toBe("image/jpeg");
  });

  it("rejects svg/pdf", () => {
    expect(isRejectedImageMime("image/svg+xml")).toBe(true);
    expect(isRejectedImageMime("application/pdf")).toBe(true);
  });

  it("enforces max 30 images", () => {
    expect(
      validateVehicleImageFile({
        mimeType: "image/jpeg",
        byteSize: 100,
        currentCount: MAX_VEHICLE_IMAGES,
      }).ok,
    ).toBe(false);
  });
});

describe("upload client does not send bytes through vercel actions", () => {
  it("upload helper posts to Cloudinary API host", () => {
    const source = readFileSync(
      join(
        process.cwd(),
        "src/modules/inventory/application/upload-vehicle-image-client.ts",
      ),
      "utf8",
    );
    expect(source).toMatch(/api\.cloudinary\.com\/v1_1/);
    expect(source).toMatch(/FormData/);
    expect(source).not.toMatch(/uploadVehicleImagesAction/);
    expect(source).toMatch(/registerCloudinaryVehicleImageAction/);
  });

  it("sign action is server-only and builds server paths", () => {
    const source = readFileSync(
      join(
        process.cwd(),
        "src/modules/inventory/application/cloudinary-sign-action.ts",
      ),
      "utf8",
    );
    expect(source).toMatch(/"use server"/);
    expect(source).toMatch(/buildCloudinaryVehicleFolder/);
    expect(source).toMatch(/buildCloudinaryVehiclePublicId/);
    expect(source).not.toMatch(/apiSecret:/);
  });
});

describe("delete compensation rules in repository source", () => {
  it("destroys cloudinary before deleting db refs", () => {
    const source = readFileSync(
      join(
        process.cwd(),
        "src/modules/inventory/infrastructure/vehicle-media-repository.ts",
      ),
      "utf8",
    );
    const destroyIdx = source.indexOf("destroyCloudinaryAsset");
    const unlinkIdx = source.indexOf("from(\"vehicle_media\")\n        .delete()");
    expect(destroyIdx).toBeGreaterThan(0);
    expect(unlinkIdx).toBeGreaterThan(destroyIdx);
    expect(source).toMatch(/La referencia en la base de datos se conserva/);
  });

  it("destroys cloudinary when postgres registration fails", () => {
    const source = readFileSync(
      join(
        process.cwd(),
        "src/modules/inventory/infrastructure/vehicle-media-repository.ts",
      ),
      "utf8",
    );
    expect(source).toMatch(/orphan_after_db_failure/);
    expect(source).toMatch(/register_cloudinary_vehicle_media/);
  });
});

describe("gallery progress UI", () => {
  it("exposes progress phases and retry/cancel controls", () => {
    const source = readFileSync(
      join(
        process.cwd(),
        "src/modules/inventory/ui/vehicle-image-gallery.tsx",
      ),
      "utf8",
    );
    expect(source).toMatch(/Solicitando autorización/);
    expect(source).toMatch(/Subiendo/);
    expect(source).toMatch(/Registrando/);
    expect(source).toMatch(/Reintentar/);
    expect(source).toMatch(/Cancelar/);
    expect(source).not.toMatch(/secure_url/);
    expect(source).not.toMatch(/public_id/);
  });
});
