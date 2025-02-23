import { green } from "https://deno.land/std@0.224.0/fmt/colors.ts";
import { parse } from "https://deno.land/std@0.224.0/flags/mod.ts";
import { walk } from "https://deno.land/std@0.224.0/fs/mod.ts";
import * as path from "https://deno.land/std@0.224.0/path/mod.ts";
import PQueue from "https://deno.land/x/p_queue@1.0.1/mod.ts";

const SRC_DIR = "site";
const DEST_DIR = "site";

async function buildFile(file: string, usebar: boolean = false) {
    //console.log(green("build"), file);

    const destPath = file.replace(SRC_DIR, DEST_DIR).replace(".org", ".html");
    await Deno.mkdir(path.dirname(destPath), { recursive: true });
    const templatePath = path.join(Deno.cwd(), "template.html");
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
            `--template=${templatePath}`,
            "--verbose",
        ],
    });
    const decoder = new TextDecoder();
    const output = await cmd.output();
    if (output.code != 0) {
        throw new Error(
            decoder.decode(output.stdout) +
                "\n" +
                decoder.decode(output.stderr),
        );
    }
    console.log(green("build"), file);
}

async function buildAll() {
    const queue = new PQueue({
        concurrency: 10,
    });
    for await (const entry of walk(SRC_DIR, { exts: [".org"] })) {
        queue.add(() => buildFile(entry.path, true));
    }
    await queue.onIdle();
}

async function watch() {
    const watcher = Deno.watchFs(SRC_DIR);
    for await (const event of watcher) {
        for (const file of event.paths) {
            if (file.endsWith(".org") && event.kind === "modify") {
                buildFile(file);
            }
        }
    }
}

if (import.meta.main) {
    const args = parse(Deno.args);

    await buildAll();
    if (args.watch) {
        console.log("watching...");
        watch();
    }
}
