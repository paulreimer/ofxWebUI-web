#!/bin/sh

: > ui.min.js
yuicompressor swfobject.js >> ui.min.js
yuicompressor web_socket.js >> ui.min.js
yuicompressor farbtastic.js >> ui.min.js
yuicompressor protobuf.js >> ui.min.js
yuicompressor ui-templates.js >> ui.min.js
yuicompressor ui-sync.js >> ui.min.js
yuicompressor ui-form.js >> ui.min.js
yuicompressor ui-init.js >> ui.min.js
