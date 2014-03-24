.DELETE_ON_ERROR:
.INTERMEDIATE: react-router-component.prod.js

BIN = ../node_modules/.bin
PATH := $(BIN):$(PATH)
NODE_PATH := ./src/node_modules/:$(NODE_PATH)
TARGETS = \
	react-router-component.js

build: $(TARGETS)

react-router-component.prod.js:
	$(call browserify,production)

react-router-component.js:
	$(call browserify,development)

react-router-component.min.js: react-router-component.prod.js
	@cat $< | uglifyjs -cm > $@

clean:
	@rm -f $(TARGETS)

define browserify
	@mkdir -p $(@D)
	@cat ./shim.begin.js > $@
	@NODE_PATH=$(NODE_PATH) NODE_ENV=$(1) browserify ./ \
		| sed -E 's/function\(require/function(__browserify__/g' \
		| sed -E 's/require\(/__browserify__(/g' \
		>> $@
	@cat ./shim.end.js >> $@
endef
