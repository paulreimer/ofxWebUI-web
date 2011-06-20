#include "ofxWebSocketHttpProtocol.h"
#include "ofUtils.h"

#include <iostream>
#include <utility>

extern "C" {
#include <libwebsockets.h>
}

//--------------------------------------------------------------
void
ofxWebSocketHttpProtocol::setup()
{
  defaultMimetype            = "text/html";
  addUrl("/",                  "web/index.html");
  addUrl("/favicon.ico",       "web/favicon.ico",        "image/x-icon");
  addUrl("/cache.manifest",    "web/cache.manifest",     "text/cache-manifest");
  
  addUrl("/WebSocketMain.swf", "web/WebSocketMain.swf",  "application/x-shockwave-flash");
  
  addUrl("/swfobject.js",      "web/swfobject.js",       "application/javascript");
  addUrl("/web_socket.js",     "web/web_socket.js",      "application/javascript");
  addUrl("/protobuf.js",       "web/protobuf.js",        "application/javascript");
  addUrl("/protobuf-form.js",  "web/protobuf-form.js",   "application/javascript");
  addUrl("/ui.proto.js",       "web/ui.proto.js",        "application/javascript");
}

//--------------------------------------------------------------
void
ofxWebSocketHttpProtocol::addUrl(const std::string& url,
                             const std::string& path,
                             const std::string _mimetype)
{
  std::string mimetype(_mimetype);
  if (_mimetype.empty())
  {
    std::map<std::string, std::string>::iterator mimetype_iter;
    
    std::string ext = path.substr(path.find_last_of(".") + 1);
    mimetype_iter = mimetypes.find(ext);
    if (mimetype_iter != mimetypes.end())
      mimetype = mimetype_iter->second;
    else
      mimetype = defaultMimetype;
  }
  
  urls[url] = make_pair(ofToDataPath(path), mimetype);
}

//--------------------------------------------------------------
char const*
ofxWebSocketHttpProtocol::filenameForUrl(const std::string url)
{
  std::map<std::string, std::pair<std::string, std::string> >::iterator filename_iter;
  
  std::cout << urls.size() << std::endl;
  
  filename_iter = urls.find(url);
  if (filename_iter != urls.end())
    return filename_iter->second.first.c_str();
  
  return NULL;
}

//--------------------------------------------------------------
char const*
ofxWebSocketHttpProtocol::mimetypeForUrl(const std::string url)
{
  std::map<std::string, std::pair<std::string, std::string> >::iterator mimetype_iter;
  
  mimetype_iter = urls.find(url);
  if (mimetype_iter != urls.end())
    return mimetype_iter->second.second.c_str();
  
  return NULL;
}

//--------------------------------------------------------------
void
ofxWebSocketHttpProtocol::httprequest(ofxWebSocketEventArgs& args)
{
  if (libwebsockets_serve_http_file(args.ws,
                                    filenameForUrl(args.message),
                                    mimetypeForUrl(args.message)))
  {
    std::cerr
    << "Failed to send HTTP file for " << args.message
    << std::endl;
  }
}
