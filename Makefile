lint:
	@./node_modules/.bin/jshint .

test:
	@./node_modules/.bin/mocha test/*.js

.PHONY: lint test
