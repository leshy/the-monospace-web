MAKEFLAGS += --no-print-directory

CONTENT_DIR := content
WEB_DIR := web
STATIC_DIR := static
TEMPLATE := pandoc/template.html
LUA_FILTER := pandoc/lua/code-block.lua

ORGFILES := $(shell find $(CONTENT_DIR) -type f -name "*.org" -not -path '*/.*')
HTMLFILES := $(patsubst $(CONTENT_DIR)/%.org,$(WEB_DIR)/%.html,$(ORGFILES))

STATICFILES := $(shell find $(STATIC_DIR) -type f -not -path '*/.*')
STATICDEST := $(patsubst $(STATIC_DIR)/%,$(WEB_DIR)/%,$(STATICFILES))

CONTENTASSETS := $(shell find $(CONTENT_DIR) -type f -not -name "*.org" -not -path '*/.*')
ASSETSDEST := $(patsubst $(CONTENT_DIR)/%,$(WEB_DIR)/%,$(CONTENTASSETS))

.PHONY: all clean watch

all: $(HTMLFILES) $(STATICDEST) $(ASSETSDEST)

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
	@echo "Copied static $<"

$(WEB_DIR)/%: $(CONTENT_DIR)/%
	@mkdir -p $(@D)
	@cp "$<" "$@"
	@echo "Copied asset $<"

clean:
	rm -rf $(WEB_DIR)

watch:
	@echo "Watching for changes. Press Ctrl+C to stop."
	@while true; do \
		$(MAKE) all; \
		inotifywait -qre modify,create,delete $(CONTENT_DIR) $(STATIC_DIR); \
	done
