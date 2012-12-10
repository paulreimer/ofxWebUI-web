#!/bin/sh

: > ui-deps.js
: > ui-deps.min.js
#yuicompressor lib/DataView.js   >> ui-deps.min.js
#yuicompressor lib/swfobject.js  >> ui-deps.min.js
#yuicompressor lib/web_socket.js >> ui-deps.min.js
#yuicompressor lib/farbtastic.js >> ui-deps.min.js
#yuicompressor lib/protobuf.js   >> ui-deps.min.js

cat lib/DataView.js   >> ui-deps.js
cat lib/swfobject.js  >> ui-deps.js
cat lib/web_socket.js >> ui-deps.js
cat lib/farbtastic.js >> ui-deps.js
cat lib/protobuf.js   >> ui-deps.js

yuicompressor ui-deps.js >> ui-deps.min.js

gzip -9 -c ui-deps.min.js > ui-deps.min.gz.js

: > ui.js
: > ui.min.js
#yuicompressor ui-templates.js   >> ui.min.js
#yuicompressor ui-sync.js        >> ui.min.js
#yuicompressor ui-form.js        >> ui.min.js
#yuicompressor ui-init.js        >> ui.min.js
##yuicompressor ui-multitouch.js  >> ui.min.js

cat ui-templates.js   >> ui.js
cat ui-sync.js        >> ui.js
cat ui-form.js        >> ui.js
cat ui-init.js        >> ui.js
#cat ui-multitouch.js  >> ui.js

yuicompressor ui.js >> ui.min.js

gzip -9 -c ui.min.js > ui.min.gz.js
