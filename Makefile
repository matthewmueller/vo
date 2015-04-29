
test: install
	@./node_modules/.bin/mocha \
		--harmony-generators \
		--reporter spec

install:
	@npm install
	@touch node_modules

dist: install dist-build dist-minify

dist-build:
	@mkdir -p dist
	@./node_modules/.bin/browserify index.js -o dist/vo.js

dist-minify: dist/vo.js
	@curl -s \
		-d compilation_level=SIMPLE_OPTIMIZATIONS \
		-d output_format=text \
		-d output_info=compiled_code \
		--data-urlencode "js_code@$<" \
		http://marijnhaverbeke.nl/uglifyjs \
		> $<.tmp
	@mv $<.tmp dist/vo.min.js

.PHONY: test
