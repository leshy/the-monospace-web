import { green } from "https://deno.land/std@0.224.0/fmt/colors.ts";
import { parse } from "https://deno.land/std@0.224.0/flags/mod.ts";
import { walk } from "https://deno.land/std@0.224.0/fs/mod.ts";
import * as path from "https://deno.land/std@0.224.0/path/mod.ts";
import PQueue from "https://deno.land/x/p_queue@1.0.1/mod.ts";

async function buildOrg(srcPath: string, dstPath: string) {
    await Deno.mkdir(path.dirname(dstPath), { recursive: true });
    const templatePath = path.join(Deno.cwd(), "pandoc/template.html");
    const cmd = new Deno.Command("pandoc", {
        args: [
            "--toc",
            "--toc-depth=2",
            "-s",
            "--section-divs=true",
            "--lua-filter=pandoc/lua/code-block.lua",
            "--css",
            "reset.css",
            "--css",
            "index.css",
            "-i",
            srcPath,
            "-o",
            dstPath,
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
    console.log(green("build"), srcPath, green("➞"), dstPath);
}

async function buildAll(srcDir: string, dstDir: string) {
    const queue = new PQueue({
        concurrency: 10,
    });

    for await (const entry of walk(srcDir, { exts: [".org"] })) {
        queue.add(() =>
            buildOrg(
                entry.path,
                entry.path.replace(srcDir, dstDir).replace(".org", ".html"),
            )
        );
    }

    await queue.onIdle();
}

async function watch(srcDir: string, dstDir: string) {
    const watcher = Deno.watchFs(srcDir);

    for await (const event of watcher) {
        for (const file of event.paths) {
            if (file.endsWith(".org") && event.kind === "modify") {
                const cwd = Deno.cwd();
                const rfile = file.replace(cwd + "/", "");
                buildOrg(
                    rfile,
                    rfile.replace(srcDir, dstDir).replace(".org", ".html"),
                );
            }
        }
    }
}

if (import.meta.main) {
    const args = parse(Deno.args);
    const srcDir = args.src;
    const dstDir = args.dst || srcDir;

    console.log(
        green("starting a recursive build"),
        srcDir,
        green("➞"),
        dstDir,
    );
    await buildAll(srcDir, dstDir);

    if (args.watch) {
        console.log(green("watching..."));
        watch(srcDir, dstDir);
    } else console.log(green("build complete"));
}
