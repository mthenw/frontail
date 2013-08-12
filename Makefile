lint:
	@./node_modules/.bin/jshint .

test:
	@./node_modules/.bin/mocha --reporter spec

.PHONY: lint test
