
test:
	@./node_modules/.bin/mocha \
		--harmony-generators \
		--reporter spec

.PHONY: test
