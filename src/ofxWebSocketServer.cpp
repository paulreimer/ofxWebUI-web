#include "ofxWebSocketServer.h"

#include "ofxHttpServer.h"
#include "ofUtils.h"

#include "encode.h"
#include "decode.h"

#include <sys/time.h>

enum protocols {
	PROTOCOL_HTTP = 0,
	PROTOCOL_OFX,
	PROTOCOL_COUNT
};

static struct libwebsocket_protocols protocols[] = {
	{ "http", callback_http, 0 },
	{ "ofx",  callback_ofx, sizeof(struct session_t) },
	{ NULL, NULL, 0 }
};

ofEvent<ofxWebSocketServer::WebSocketEventArgs> ofxWebSocketServer::onopen;
ofEvent<ofxWebSocketServer::WebSocketEventArgs> ofxWebSocketServer::onmessage;
ofEvent<ofxWebSocketServer::WebSocketEventArgs> ofxWebSocketServer::onclose;

//--------------------------------------------------------------
ofxWebSocketServer::ofxWebSocketServer()
:	port(7681)
, useSSL(false)
, context(NULL)
, buf(LWS_SEND_BUFFER_PRE_PADDING+1024+LWS_SEND_BUFFER_POST_PADDING)
, defaultAllowPolicy(true)
, binary(true)
{}

//--------------------------------------------------------------
ofxWebSocketServer::~ofxWebSocketServer()
{
  exit();
}

//--------------------------------------------------------------
void
ofxWebSocketServer::setup()
{
  int opts = 0;

	sslCertFilename = ofToDataPath("libwebsockets-test-server.pem", true);
	sslKeyFilename = ofToDataPath("libwebsockets-test-server.key.pem", true);

  const char* _sslCertFilename  = NULL;
  const char* _sslKeyFilename   = NULL;
	if (useSSL)
  {
    _sslCertFilename = sslCertFilename.c_str();
    _sslKeyFilename = sslKeyFilename.c_str();
  }

  context = libwebsocket_create_context(port, interface.c_str(), protocols,
                                        libwebsocket_internal_extensions,
                                        _sslCertFilename, _sslKeyFilename,
                                        -1, -1, opts);
	if (context == NULL)
    std::cerr << "libwebsocket init failed" << std::endl;
  else
    startThread(true, false); // blocking, non-verbose
}

//--------------------------------------------------------------
void
ofxWebSocketServer::exit()
{
  if (context != NULL)
  {
    libwebsocket_context_destroy(context);
    context = NULL;
  }
}

//--------------------------------------------------------------
void
ofxWebSocketServer::threadedFunction()
{
  while (isThreadRunning())
  {
    execute();
    libwebsocket_service(context, 50);
  }
}

//--------------------------------------------------------------
bool
ofxWebSocketServer::allowClient(const char* const _name, const char* const _ip)
{
  std::string name(_name);
  std::string ip(_ip);
  
  std::cout
  << "Received network connect from "
  << name << "(" << ip << ")"
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
void
ofxWebSocketServer::_onopen(libwebsocket* const ws,
                           session_t* const session,
                           const char* const _message) const
{
  std::string message = (_message == NULL)? "" : _message;

  WebSocketEventArgs args;
  args.ws = ws;
  args.session = session;
  args.message = message;

  ofNotifyEvent(onopen, args);
}

//--------------------------------------------------------------
void
ofxWebSocketServer::_onclose(libwebsocket* const ws,
                             session_t* const session,
                             const char* const _message) const
{
  std::string message = (_message == NULL)? "" : _message;
  
  WebSocketEventArgs args;
  args.ws = ws;
  args.session = session;
  args.message = message;
  
  ofNotifyEvent(onclose, args);
}

//--------------------------------------------------------------
void
ofxWebSocketServer::_onmessage(libwebsocket* const ws,
                              session_t* const session,
                              const char* const _message) const
{
  std::string message = (_message == NULL)? "" : _message;

  if (binary)
  {
    unsigned int decoded_len;
    const char* decoded;
    decode(message.c_str(), message.size(), &decoded, &decoded_len);
    message = std::string(decoded, decoded_len);
  }

  WebSocketEventArgs args;
  args.ws = ws;
  args.session = session;
  args.message = message;
  
  ofNotifyEvent(onmessage, args);
}

//--------------------------------------------------------------
void
ofxWebSocketServer::close(libwebsocket* const ws) const
{
  libwebsocket_close_and_free_session(context, ws, LWS_CLOSE_STATUS_NORMAL);
}

//--------------------------------------------------------------
void
ofxWebSocketServer::broadcast(const std::string& message,
                              const bool needsEncoding)
{
  broadcast(message.c_str(), message.size(), needsEncoding);
}

//--------------------------------------------------------------
void
ofxWebSocketServer::broadcast(const char* const message,
                              unsigned int len,
                              const bool needsEncoding)
{
  unsigned char *p = &buf[LWS_SEND_BUFFER_PRE_PADDING];
  
  if (binary && needsEncoding)
  {
    unsigned int encoded_len;
    const char* encoded;
    encode(message, len, &encoded, &encoded_len);
    memcpy(p, encoded, encoded_len);
    len = encoded_len;
  }
  else {
    memcpy(p, message, len);
  }

  int n = libwebsockets_broadcast(&protocols[1], p, len);
  if (n < 0) {
    fprintf(stderr, "ERROR writing to socket");
    return;
  }
}

//--------------------------------------------------------------
void
ofxWebSocketServer::send(libwebsocket* const ws,
                         const std::string& message)
{
  send(ws, message.c_str(), message.size());
}

//--------------------------------------------------------------
void
ofxWebSocketServer::send(libwebsocket* const ws,
                         const char* const message,
                         unsigned int len,
                         const bool needsEncoding)
{
  unsigned char *p = &buf[LWS_SEND_BUFFER_PRE_PADDING];

  if (binary && needsEncoding)
  {
    unsigned int encoded_len;
    const char* encoded;
    encode(message, len, &encoded, &encoded_len);
    memcpy(p, encoded, encoded_len);
    len = encoded_len;
  }
  else {
    memcpy(p, message, len);
  }

  int n = libwebsocket_write(ws, p, len, LWS_WRITE_TEXT);
  if (n < 0)
    std::cout << "ERROR writing to socket" << std::endl;
}

//--------------------------------------------------------------
void
ofxWebSocketServer::execute()
{
  return;
	unsigned int oldus = 0;
  struct timeval tv;

  gettimeofday(&tv, NULL);

  // This broadcasts to all dumb-increment-protocol connections
  // at 20Hz.
  //
  // We're just sending a character 'x', in these examples the
  // callbacks send their own per-connection content.
  //
  // You have to send something with nonzero length to get the
  // callback actions delivered.
  //
  // We take care of pre-and-post padding allocation.

  if (((unsigned int)tv.tv_usec - oldus) > 50000) {
    broadcast((char*)&buf[LWS_SEND_BUFFER_PRE_PADDING]);
    oldus = tv.tv_usec;
  }
}

//--------------------------------------------------------------
void
ofxWebSocketServer::encode(const char* const message,
                           const unsigned int len,
                           const char** encoded,
                           unsigned int* const encoded_len) const
{
  // TODO: this is super hacky, and base 64 encoding/decoding
  // is a waste of CPU, memory, and network traffic for both
  // client and server.
  // Eventually web sockets will support size-preamble frames
  // and these should be used instead.
  //    std::stringstream data_stream;
  std::stringstream ss, encoded_stream;
  base64::encoder enc;
  ss.write(message, len);
  enc.encode(ss, encoded_stream);
  
  const std::string encoded_str = encoded_stream.str();
  *encoded_len = encoded_str.size();
  *encoded = encoded_str.c_str();  
}

//--------------------------------------------------------------
void
ofxWebSocketServer::decode(const char* const message,
                           const unsigned int len,
                           const char** decoded,
                           unsigned int* decoded_len) const
{
  // TODO: this is super hacky, and base 64 encoding/decoding
  // is a waste of CPU, memory, and network traffic for both
  // client and server.
  // Eventually web sockets will support size-preamble frames
  // and these should be used instead.
  std::stringstream ss(message), decoded_stream;
  base64::decoder dec;
  dec.decode(ss, decoded_stream);
  
  const std::string decoded_str = decoded_stream.str();
  *decoded_len = decoded_str.size();
  *decoded = decoded_str.c_str();
}

extern "C"
int
callback_ofx(struct libwebsocket_context* context,
             struct libwebsocket *ws,
             enum libwebsocket_callback_reasons reason,
             void *user,
             void *in, size_t len)
{
  char client_name[128];
	char client_ip[128];
  
	int n;
	unsigned char buf[LWS_SEND_BUFFER_PRE_PADDING + 512 +
                    LWS_SEND_BUFFER_POST_PADDING];
	unsigned char *p = &buf[LWS_SEND_BUFFER_PRE_PADDING];
	struct session_t* session = (session_t*)user;
  char* message = (char*)in;

	switch (reason)
  {
    case LWS_CALLBACK_ESTABLISHED:
      _websocket_server._onopen(ws, session, message);
      break;

    case LWS_CALLBACK_CLOSED:
      _websocket_server._onclose(ws, session, message);
      break;

    case LWS_CALLBACK_BROADCAST:
      /*
      if (session->skipNextBroadcast)
        session->skipNextBroadcast = false;
      else
      */
      /*
      if (session->lastBroadcast == NULL
          || memcmp(session->lastBroadcast, message,
                    MIN(len, session->lastBroadcastLength)))
      */
        _websocket_server.send(ws, message, len, false);
      break;

    case LWS_CALLBACK_SERVER_WRITEABLE:
      printf("Server writable\n");
      //_websocket_server.send(ws, message);
      break;

    case LWS_CALLBACK_RECEIVE:
      _websocket_server._onmessage(ws, session, message);
      break;
      
    case LWS_CALLBACK_FILTER_PROTOCOL_CONNECTION:
      libwebsockets_get_peer_addresses((int)(long)user,
                                       client_name, sizeof(client_name),
                                       client_ip, sizeof(client_ip));
      return _websocket_server.allowClient(client_name, client_ip)? 0 : 1;
      break;
      
    default:
      break;
	}
  
	return 0;
}
