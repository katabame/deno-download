import { Destination, DownloadedFile } from "./types.ts";
import { Buffer } from "https://deno.land/std@0.141.0/io/buffer.ts";
import { ensureDir } from "https://deno.land/std@0.141.0/fs/mod.ts";
import { extension } from "https://deno.land/x/media_types@v3.0.3/mod.ts";

/** Download file from url to the destination. */
export async function download(
  url: string | URL,
  destination?: Destination,
  options?: RequestInit,
): Promise<DownloadedFile> {
  let dir: string;
  let file: string;
  let mode: Record<string, unknown> = {};

  const response = await fetch(url, options);
  if (response.status != 200) {
    return Promise.reject(
      new Deno.errors.Http(
        `status ${response.status}-'${response.statusText}' received instead of 200`,
      ),
    );
  }
  const finalUrl = response.url.replace(/\/$/, "");
  const blob = await response.blob();
  /** size in bytes */
  const size = blob.size;
  const buffer = await blob.arrayBuffer();
  const unit8arr = new Buffer(buffer).bytes();
  if (
    typeof destination === "undefined" || typeof destination.dir === "undefined"
  ) {
    dir = await Deno.makeTempDir({ prefix: "deno_dwld" });
  } else {
    dir = destination.dir;
  }

  if (
    typeof destination === "undefined" ||
    typeof destination.file === "undefined"
  ) {
    file = finalUrl.substring(finalUrl.lastIndexOf("/") + 1);
  } else {
    file = destination.file;
  }

  if (
    typeof destination != "undefined" && typeof destination.mode != "undefined"
  ) {
    mode = { mode: destination.mode };
  }

  dir = dir.replace(/\/$/, "");
  await ensureDir(dir);

  const ext = extension(
    response.headers.get("Content-Type") ?? "application/octet-stream",
  );

  file = file.match(/^(.+)\.?.*$/)![1] + "." + ext;

  const fullPath = `${dir}/${file}`;
  await Deno.writeFile(fullPath, unit8arr, mode);
  return { file, dir, fullPath, size };
}
