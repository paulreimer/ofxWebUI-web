#pragma once

#include "ofxWebSocketProtocol.h"

#include <string>
#include <map>

class ofxWebSocketHttpProtocol
: public ofxWebSocketProtocol
{
public:
  void setup();
  
  void addUrl(const std::string& url,
              const std::string& path,
              const std::string _mimetype = "");

protected:  
  char const* filenameForUrl(const std::string url);
  char const* mimetypeForUrl(const std::string url);  

  void httprequest(ofxWebSocketEvent& args);

  std::map<std::string, std::pair<std::string, std::string> > urls;
  
  std::map<std::string, std::string> mimetypes;
  std::string defaultMimetype;
};
