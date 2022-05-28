// deno test --allow-read --allow-write --allow-net

import { assertEquals } from "https://deno.land/std@0.141.0/testing/asserts.ts";
import { ensureDir } from "https://deno.land/std@0.141.0/fs/mod.ts";
import { Destination, DownloadedFile } from "./types.ts";
import { download } from "./mod.ts";
import * as path from "https://deno.land/std@0.125.0/path/mod.ts";

const url =
  "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf";
let fileObj: DownloadedFile;
let fileInfo: Deno.FileInfo;

Deno.test({
  name: "Download File",
  async fn(): Promise<void> {
    const reqInit: RequestInit = {
      method: "GET",
    };
    await ensureDir("./test");
    const destination: Destination = {
      file: "example.pdf",
      dir: "./test",
      mode: 0o777,
    };
    fileObj = await download(url, destination, reqInit);

    await Deno.readFile(fileObj.fullPath);
    assertEquals(path.extname(fileObj.fullPath), ".pdf");
  },
});

Deno.test({
  name: "Downloaded File Size",
  async fn(): Promise<void> {
    fileInfo = await Deno.lstat(fileObj.fullPath);
    assertEquals(fileObj.size, fileInfo.size);
    await Deno.remove("./test", { recursive: true }); // remove folder in the last test
  },
});

/*
Deno.test({
  name: "Check File Permission",
  fn(): void {
    assertEquals(fileInfo.mode, 0o777);
  },
});
*/
