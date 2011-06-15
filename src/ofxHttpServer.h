#pragma once

#include <string>
#include <map>

extern "C" {
#include <libwebsockets.h>
}

class ofxHttpServer
{
public:
  ofxHttpServer();
  ~ofxHttpServer();
  
  void setup();

  bool allowClient(const char* const _name,
                   const char* const _ip);

  char const* filenameForUrl(const char* const _url);
  char const* mimetypeForUrl(const char* const _url);

  void addUrl(const std::string& url,
              const std::string& path,
              const std::string _mimetype = "");

protected:  
  bool defaultAllowPolicy;
  std::map<std::string, bool> allowRules;

  std::map<std::string, std::pair<std::string, std::string> > urls;

  std::map<std::string, std::string> mimetypes;
  std::string defaultMimetype;
};

static ofxHttpServer http_server;

extern "C" {
int
callback_http(struct libwebsocket_context* context,
              struct libwebsocket* wsi,
              enum libwebsocket_callback_reasons reason,
              void* user,
              void* in, size_t len);
}