lint:
	@./node_modules/.bin/jshint .

test:
	@./node_modules/.bin/mocha --reporter spec test/*.js

test-watch:
	@./node_modules/.bin/mocha --reporter spec test/*.js --watch

.PHONY: lint test test-watch
