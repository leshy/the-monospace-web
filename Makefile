MAKEFLAGS += --no-print-directory
CONTENT_DIR := content
WEB_DIR := web
STATIC_DIR := static
TEMPLATE := pandoc/template.html
LUA_FILTER := pandoc/lua/code-block.lua

ORGFILES := $(shell find $(CONTENT_DIR) -type f -name "*.org")
HTMLFILES := $(patsubst $(CONTENT_DIR)/%.org,$(WEB_DIR)/%.html,$(ORGFILES))

STATICFILES := $(shell find $(STATIC_DIR) -type f -not -path '*/.*')
STATICDEST := $(patsubst $(STATIC_DIR)/%,$(WEB_DIR)/%,$(STATICFILES))

.PHONY: all clean watch

all: $(HTMLFILES) $(STATICDEST)

$(WEB_DIR)/%.html: $(CONTENT_DIR)/%.org
	@mkdir -p $(@D)
	@pandoc --toc \
		--toc-depth=2 \
		-s \
		--section-divs=true \
		--lua-filter=$(LUA_FILTER) \
		--css reset.css \
		--css index.css \
		-i $< \
		-o $@ \
		--template=$(TEMPLATE) \
		--verbose > /dev/null 2>&1 || { echo "Error processing $<"; exit 1; }
	@echo "Processed $<"

$(WEB_DIR)/%: $(STATIC_DIR)/%
	@mkdir -p $(@D)
	@cp $< $@
	@echo "Copied $<"

clean:
	rm -rf $(WEB_DIR)

watch:
	@echo "Watching for changes. Press Ctrl+C to stop."
	@while true; do \
		make all; \
		inotifywait -qre modify,create,delete $(CONTENT_DIR) $(STATIC_DIR); \
	done
