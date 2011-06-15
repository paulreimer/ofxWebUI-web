#pragma once

#include "ofThread.h"
#include "ofEvents.h"

extern "C" {
#include <libwebsockets.h>
}

struct session_t {
  session_t()
  {
    skipNextBroadcast   = false;
    lastBroadcast       = NULL;
    lastBroadcastLength = 0;
  }
  bool skipNextBroadcast;
  char* lastBroadcast;
  unsigned int lastBroadcastLength;
};

class ofxWebSocketServer
: public ofThread
{
public:
  ofxWebSocketServer();
  ~ofxWebSocketServer();

  void setup();
  void exit();

  void threadedFunction();

  bool allowClient(const char* const _name, const char* const _ip);

  std::map<std::string, bool> allowRules;

  void _onopen   (libwebsocket* const ws,
                  session_t* const session,
                  const char* const _message) const;
  void _onclose  (libwebsocket* const ws,
                  session_t* const session,
                  const char* const _message) const;
  void _onmessage(libwebsocket* const ws,
                  session_t* const session,
                  const char* const _message) const;

  void broadcast(const std::string& message,
                 const bool needsEncoding = true);
  void broadcast(const char* const message,
                 unsigned int len,
                 const bool needsEncoding = true);

  void send(libwebsocket* const ws,
            const std::string& message);
  void send(libwebsocket* const ws,
            const char* const message,
            unsigned int len,
            const bool needsEncoding = true);

  void close(libwebsocket* const ws) const;

  void execute();
  
  class WebSocketEventArgs {
  public:
    libwebsocket* ws;
    session_t* session;
    std::string message;
  };

  static ofEvent<WebSocketEventArgs> onopen;
  static ofEvent<WebSocketEventArgs> onmessage;
  static ofEvent<WebSocketEventArgs> onclose;

protected:
  
  std::vector<unsigned char> buf;
	short port;
  std::string interface;
  bool binary;
  
	bool useSSL;
  std::string sslCertFilename;
  std::string sslKeyFilename;
  
	struct libwebsocket_context *context;

  bool defaultAllowPolicy;

private:
  void encode(const char* const message,
              const unsigned int len,
              const char** encoded,
              unsigned int* const encoded_len) const;

  void decode(const char* const message,
              const unsigned int len,
              const char** decoded,
              unsigned int* const decoded_len) const;
  
  const libwebsocket* skip_ws;
};

static ofxWebSocketServer _websocket_server;

extern "C"
int
callback_ofx(struct libwebsocket_context * context,
             struct libwebsocket *wsi,
             enum libwebsocket_callback_reasons reason,
             void *user,
             void *in, size_t len);
