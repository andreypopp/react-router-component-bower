.DELETE_ON_ERROR:
.INTERMEDIATE: react-router-component.prod.js

BIN = ../node_modules/.bin
PATH := $(BIN):$(PATH)
NAME = ReactRouter
NODE_PATH := ./src/node_modules/:$(NODE_PATH)
TARGETS = \
	react-router-component.js \
	react-router-component.min.js

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
	@NODE_PATH=$(NODE_PATH) NODE_ENV=$(1)\
		browserify --standalone $(NAME) ./ >> $@
	@cat ./shim.end.js >> $@
endef
