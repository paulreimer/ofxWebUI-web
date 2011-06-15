#include "ofxHttpServer.h"
#include "ofUtils.h"

#include <iostream>
#include <utility>

//--------------------------------------------------------------
ofxHttpServer::ofxHttpServer()
: defaultAllowPolicy(true)
, defaultMimetype("text/html")
{}

//--------------------------------------------------------------
ofxHttpServer::~ofxHttpServer()
{}

//--------------------------------------------------------------
void
ofxHttpServer::setup()
{
  _http_server.addUrl("/favicon.ico","web/favicon.ico", "image/x-icon");
  _http_server.addUrl("/index.html", "web/index.html");
  _http_server.addUrl("/",           "web/index.html");
  _http_server.addUrl("/ui.manifest","web/ui.manifest", "text/cache-manifest");
  _http_server.addUrl("/protobuf.js","web/protobuf.js", "application/javascript");
  _http_server.addUrl("/protobuf-form.js","web/protobuf-form.js", "application/javascript");
  _http_server.addUrl("/ui.proto.js","web/ui.proto.js", "application/javascript");
}

//--------------------------------------------------------------
void
ofxHttpServer::addUrl(const std::string& url,
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
bool
ofxHttpServer::allowClient(const char* const _name,
                           const char* const _ip)
{
  std::string name(_name);
  std::string ip(_ip);

  std::cout
  << "Received network connect from "
  << name << " (" << ip << ")"
  << std::endl;

  std::map<std::string, bool>::iterator allow_iter;

  allow_iter = allowRules.find(name);
  if (allow_iter != allowRules.end())
    return allow_iter->second;

  allow_iter = allowRules.find(ip);
  if (allow_iter != allowRules.end())
    return allow_iter->second;

  return defaultAllowPolicy;
}

//--------------------------------------------------------------
char const*
ofxHttpServer::filenameForUrl(const char* const _url)
{
  std::string url(_url);
  std::map<std::string, std::pair<std::string, std::string> >::iterator filename_iter;

  std::cout << urls.size() << std::endl;

  filename_iter = urls.find(url);
  if (filename_iter != urls.end())
    return filename_iter->second.first.c_str();

  return NULL;
}

//--------------------------------------------------------------
char const*
ofxHttpServer::mimetypeForUrl(const char* const _url)
{
  std::string url(_url);
  std::map<std::string, std::pair<std::string, std::string> >::iterator mimetype_iter;
  
  mimetype_iter = urls.find(url);
  if (mimetype_iter != urls.end())
    return mimetype_iter->second.second.c_str();
  
  return NULL;
}

extern "C"
int
callback_http(struct libwebsocket_context* context,
              struct libwebsocket* wsi,
              enum libwebsocket_callback_reasons reason,
              void* user,
              void* in, size_t len)
{
	char client_name[128];
	char client_ip[128];
  
  char* url = (char*)in;
  
	switch (reason)
  {
    case LWS_CALLBACK_HTTP:
      fprintf(stderr, "serving HTTP URL %s with file:%s\n", url, _http_server.filenameForUrl(url));
      
      if (libwebsockets_serve_http_file(wsi,
                                        _http_server.filenameForUrl(url),
                                        _http_server.mimetypeForUrl(url)))
        fprintf(stderr, "Failed to send HTTP file\n");
      
      break;

    case LWS_CALLBACK_FILTER_NETWORK_CONNECTION:
      libwebsockets_get_peer_addresses((int)(long)user,
                                       client_name, sizeof(client_name),
                                       client_ip, sizeof(client_ip));
      
      return _http_server.allowClient(client_name, client_ip)? 0 : 1;

      break;
      
    default:
      break;
	}
  
	return 0;
}
