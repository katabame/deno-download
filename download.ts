import { Destination, DownloadedFile } from "./types.ts";
import { Buffer } from "https://deno.land/std@0.142.0/io/buffer.ts";
import { ensureDirSync } from "https://deno.land/std@0.142.0/fs/mod.ts";
import { extension } from "https://deno.land/std@0.142.0/media_types/mod.ts";

/**
 * Download file from url to the destination
 *
 * @param input - either an url string or fetch request object
 * @param destination
 * @param options
 * @returns
 */
export async function download(
  input: string | Request,
  destination?: Destination,
  options?: RequestInit,
): Promise<DownloadedFile> {
  const response: Response = await fetch(input, options);
  if (response.status !== 200) {
    throw new Deno.errors.Http(
      `status ${response.status}-'${response.statusText}' received instead of 200`,
    );
  }

  const finalUrl: string = response.url.replace(/\/$/, "");
  const blob: Blob = await response.blob();
  const size: number = blob.size;
  const buffer: ArrayBuffer = await blob.arrayBuffer();
  const uint8array: Uint8Array = new Buffer(buffer).bytes();

  let dir: string = destination?.dir ??
    Deno.makeTempDirSync({ prefix: "deno_dwld" });
  let file: string = destination?.file ??
    finalUrl.substring(finalUrl.lastIndexOf("/") + 1);
  const mode: Record<string, number | undefined> =
    (destination?.mode !== undefined) ? { mode: destination.mode } : {};
  dir = dir.replace(/\/$/, "");
  ensureDirSync(dir);

  let ext: string | undefined;
  const disposition: string | null = response.headers.get(
    "Content-Disposition",
  );
  if (disposition != null && disposition.includes("filename")) {
    disposition.split(";").forEach((entry) => {
      if (entry.includes("filename")) {
        ext = entry.replaceAll(/( |\")/g, "").match(/.*\.(.*)$/)![1] ?? "";
      }
    });
  } else {
    ext = extension(response.headers.get("Content-Type")!) ?? "";
  }
  file = ext == ""
    ? file.match(/^(.+)\.?.*$/)![1]
    : file.match(/^(.+)\.?.*$/)![1] + "." + ext;
  const fullPath = `${dir}/${file}`;
  await Deno.writeFile(fullPath, uint8array, mode);
  return { file, dir, fullPath, size };
}
