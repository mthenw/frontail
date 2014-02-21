lint:
	@./node_modules/.bin/jshint .

test:
	@./node_modules/.bin/mocha test/*.js

test-watch:
	@./node_modules/.bin/mocha test/*.js --watch

.PHONY: lint test
