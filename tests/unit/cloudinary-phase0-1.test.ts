import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  validateMediaAssetProviderFields,
} from "@/modules/inventory/domain/media-asset-provider";
import { readCloudinaryEnv } from "@/shared/lib/cloudinary/env";

const root = join(process.cwd());

describe("media_assets dual-provider schema migration", () => {
  const sql = readFileSync(
    join(
      root,
      "supabase/migrations/20260720040000_media_assets_dual_provider.sql",
    ),
    "utf8",
  );

  it("is additive and keeps legacy columns", () => {
    const forward = sql.split("Rollback (manual)")[0] ?? sql;
    expect(forward).toMatch(/add column if not exists provider/);
    expect(forward).toMatch(/add column if not exists public_id/);
    expect(forward).toMatch(/add column if not exists resource_type/);
    expect(forward).toMatch(/add column if not exists version/);
    expect(forward).toMatch(/add column if not exists secure_url/);
    expect(forward).toMatch(/add column if not exists format/);
    expect(forward).toMatch(/default 'supabase'/);
    expect(forward).not.toMatch(/drop column/);
    expect(forward).toMatch(/alter column bucket drop not null/);
    expect(forward).toMatch(/alter column object_path drop not null/);
  });

  it("indexes provider and unique public_id", () => {
    expect(sql).toMatch(/media_assets_provider_idx/);
    expect(sql).toMatch(/media_assets_public_id_unique_idx/);
    expect(sql).toMatch(/where public_id is not null/);
  });

  it("documents rollback without deleting live data in the forward migration", () => {
    expect(sql).toMatch(/Rollback \(manual\)/);
  });
});

describe("validateMediaAssetProviderFields", () => {
  it("accepts legacy supabase coordinates", () => {
    expect(
      validateMediaAssetProviderFields({
        provider: "supabase",
        bucket: "vehicle-images",
        object_path: "vehicles/a/b.jpg",
      }),
    ).toEqual({ ok: true });
  });

  it("rejects supabase without storage path", () => {
    const result = validateMediaAssetProviderFields({
      provider: "supabase",
      bucket: null,
      object_path: null,
    });
    expect(result.ok).toBe(false);
  });

  it("accepts cloudinary with public_id as primary identity", () => {
    expect(
      validateMediaAssetProviderFields({
        provider: "cloudinary",
        public_id: "vehicles/uuid/asset",
        resource_type: "image",
        version: 1,
        secure_url: "https://res.cloudinary.com/demo/image/upload/v1/x.jpg",
        format: "jpg",
        width: 1200,
        height: 900,
        byte_size: 120000,
      }),
    ).toEqual({ ok: true });
  });

  it("rejects cloudinary without public_id", () => {
    const result = validateMediaAssetProviderFields({
      provider: "cloudinary",
      public_id: null,
      secure_url: "https://res.cloudinary.com/demo/image/upload/v1/x.jpg",
    });
    expect(result.ok).toBe(false);
  });
});

describe("Cloudinary env safety", () => {
  it("documents cloudinary vars without exposing secrets as NEXT_PUBLIC", () => {
    const example = readFileSync(join(root, ".env.example"), "utf8");
    expect(example).toMatch(/NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=/);
    expect(example).toMatch(/CLOUDINARY_API_KEY=/);
    expect(example).toMatch(/CLOUDINARY_API_SECRET=/);
    expect(example).not.toMatch(/NEXT_PUBLIC_CLOUDINARY_API_SECRET/);
    expect(example).not.toMatch(/NEXT_PUBLIC_CLOUDINARY_API_KEY/);
  });

  it("readCloudinaryEnv reports missing keys without throwing", () => {
    const previous = {
      cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      apiSecret: process.env.CLOUDINARY_API_SECRET,
    };
    delete process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    delete process.env.CLOUDINARY_API_KEY;
    delete process.env.CLOUDINARY_API_SECRET;

    const result = readCloudinaryEnv();
    expect(result.configured).toBe(false);
    if (!result.configured) {
      expect(result.missing).toContain("NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME");
      expect(result.missing).toContain("CLOUDINARY_API_KEY");
      expect(result.missing).toContain("CLOUDINARY_API_SECRET");
    }

    if (previous.cloudName) {
      process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME = previous.cloudName;
    }
    if (previous.apiKey) process.env.CLOUDINARY_API_KEY = previous.apiKey;
    if (previous.apiSecret) {
      process.env.CLOUDINARY_API_SECRET = previous.apiSecret;
    }
  });

  it("server cloudinary module is marked server-only", () => {
    const source = readFileSync(
      join(root, "src/shared/lib/cloudinary/server.ts"),
      "utf8",
    );
    expect(source).toMatch(/import "server-only"/);
    expect(source).not.toMatch(/console\.log\(.*apiSecret/);
    expect(source).not.toMatch(/console\.error\(.*apiSecret/);
  });
});
