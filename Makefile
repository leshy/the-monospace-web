.PHONY: build watch

build:
	deno run --allow-read --allow-write --allow-run build.ts

watch:
	deno run --allow-read --allow-write --allow-run build.ts --watch
