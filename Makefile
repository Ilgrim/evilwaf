#REPORTER = spec
REPORTER = tap

test:
	@NODE_ENV=test ./node_modules/.bin/mocha \
        --reporter $(REPORTER) \
        --ui tdd \
        test/*.js
 

.PHONY: test
