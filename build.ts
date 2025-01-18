import { parse } from "https://deno.land/std/flags/mod.ts";
import { walk } from "https://deno.land/std/fs/mod.ts";
import * as path from "https://deno.land/std/path/mod.ts";

const SRC_DIR = "site";
const DEST_DIR = "site";

async function buildFile(file: string) {
    console.log("BUILD", file);
    const destPath = file.replace(SRC_DIR, DEST_DIR).replace(".org", ".html");
    await Deno.mkdir(path.dirname(destPath), { recursive: true });
    const cmd = new Deno.Command("pandoc", {
        args: [
            "--toc",
            "--toc-depth=2",
            "-s",
            "--section-divs=true",
            "--lua-filter=code-block.lua",
            "--css",
            "reset.css",
            "--css",
            "index.css",
            "-i",
            file,
            "-o",
            destPath,
            "--template=template.html",
            "--verbose",
        ],
    });
    await cmd.output();
}

async function buildAll() {
    for await (const entry of walk(SRC_DIR, { exts: [".org"] })) {
        await buildFile(entry.path);
    }
}

async function watch() {
    const watcher = Deno.watchFs(SRC_DIR);
    for await (const event of watcher) {
        for (const file of event.paths) {
            if (file.endsWith(".org") && event.kind === "modify") {
                await buildFile(file);
            }
        }
    }
}

if (import.meta.main) {
    const args = parse(Deno.args);

    await buildAll();
    if (args.watch) {
        await watch();
    }
}
