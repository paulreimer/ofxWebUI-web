#pragma once

extern "C" {
#include <libwebsockets.h>
}

class ofxWebSocketEventArgs {
public:
  libwebsocket* ws;
  void* session;
  std::string message;
};

