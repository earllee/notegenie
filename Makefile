BOOTSTRAP = ./public/bootstrap
NG_LESS = ./public/bootstrap/less/ng.less
JAVASCRIPTS = ./public/javascripts
CHECK=\033[32m✔\033[39m
HR=\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#\#

build:
	@echo "\n${HR}"
	@echo "Building Bootstrap..."
	@echo "${HR}\n"
#	@jshint js/*.js --config js/.jshintrc
#	@jshint js/tests/unit/*.js --config js/.jshintrc
#	@echo "Running JSHint on javascript...             ${CHECK} Done"
	@recess --compile ${NG_LESS} > ${BOOTSTRAP}/css/bootstrap.css
	@echo "Compiling LESS with Recess...               ${CHECK} Done"
	@uglifyjs ${BOOTSTRAP}/js/bootstrap.js\
		${JAVASCRIPTS}/jquery.hoverIntent.js\
		${JAVASCRIPTS}/modernizr.js\
		${JAVASCRIPTS}/marked.js\
		${JAVASCRIPTS}/bootstrap-wysiwyg.js\
		${JAVASCRIPTS}/core.js\
		${JAVASCRIPTS}/functions.js\
		${JAVASCRIPTS}/dropbox.js\
		${JAVASCRIPTS}/dropboxFunctions.js\
		${JAVASCRIPTS}/errors.js\
		> ${JAVASCRIPTS}/ng.min.js
	@echo "Compiling JS with UglifyJS...               ${CHECK} Done"
	@node ${BOOTSTRAP}/docs/build
	@cp ${BOOTSTRAP}/img/* ${BOOTSTRAP}/docs/assets/img/
	@cp ${BOOTSTRAP}/js/*.js ${BOOTSTRAP}/docs/assets/js/
	@cp ${BOOTSTRAP}/js/tests/vendor/jquery.js ${BOOTSTRAP}/docs/assets/js/
	@echo "Compiling documentation...                  ${CHECK} Done"
