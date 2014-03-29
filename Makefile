.DELETE_ON_ERROR:
.INTERMEDIATE: react-router-component.prod.js

BIN = ../node_modules/.bin
PATH := $(BIN):$(PATH)
NODE_PATH := ./src/node_modules/:$(NODE_PATH)
TARGETS = \
	react-router-component.js

build: $(TARGETS)

release:
	(cd src && git fetch --all && git checkout $(VERSION))
	$(MAKE) clean build
	git add src $(TARGETS)
	git commit -m "Build for $(VERSION)"
	bower version "$(VERSION)"
	git push origin master
	git push --tags origin master

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
	@NODE_PATH=$(NODE_PATH) NODE_ENV=$(1) browserify -r ./:__main__ \
		| sed -E 's/function\(require/function(__browserify__/g' \
		| sed -E 's/require\(/__browserify__(/g' \
		>> $@
	@cat ./shim.end.js >> $@
endef
